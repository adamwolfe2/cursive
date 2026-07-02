/**
 * Reseller layer END-TO-END TEST MATRIX (real signed deliveries).
 *
 * Exercises the LIVE isolated reseller Inngest app (`cursive-reseller`) against a
 * real webhook.site receiver, asserting cap / throttle / deactivate / burst /
 * HMAC behavior. Unlike reseller-smoke-test.ts (single fire), this drives the
 * full acceptance matrix from the handoff spec.
 *
 * PREREQUISITE: the `cursive-reseller` app must be DEPLOYED and synced in Inngest
 * Cloud (PUT /api/inngest-reseller → modified:true), otherwise `lead/created`
 * never reaches deliverResellerLead and every scenario times out.
 *
 * Usage:
 *   npx tsx scripts/reseller-test-matrix.ts <pixel_id> [--webhook <uuid|url>]
 *
 * If --webhook is omitted a fresh webhook.site token is created automatically.
 * Point your env at PROD (SUPABASE + INNGEST_EVENT_KEY) so the deployed function
 * runs. The script mutates the pixel's config (cap/throttle/status/destination)
 * and restores it at the end.
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, INNGEST_EVENT_KEY.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

type PixelRow = {
  id: string
  reseller_id: string
  workspace_id: string
  pixel_id: string
  signing_secret: string | null
  destination_url: string | null
  status: string
  throttle_mode: boolean | null
  lead_cap_per_period: number | null
  period_start: string
  leads_delivered_period: number
}

const results: { name: string; ok: boolean; detail: string }[] = []
function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} — ${detail}`)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Unique per-run suffix: leads have a unique hash key (workspace+email), so a
// re-run with the same fixed emails would violate idx_leads_hash_key_unique.
const RUN = Date.now().toString(36)
const email = (tag: string) => `matrix-${tag}-${RUN}@example.com`

async function main() {
  const pixelId = process.argv[2]
  if (!pixelId) {
    console.error('Usage: npx tsx scripts/reseller-test-matrix.ts <pixel_id> [--webhook <uuid|url>]')
    process.exit(1)
  }
  const whFlag = process.argv.indexOf('--webhook')
  let webhookArg = whFlag > -1 ? process.argv[whFlag + 1] : undefined

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const inngestKey = process.env.INNGEST_EVENT_KEY
  if (!url || !serviceKey) throw new Error('Missing SUPABASE env')
  if (!inngestKey) throw new Error('Missing INNGEST_EVENT_KEY')

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Resolve or create the webhook.site receiver.
  const { token, receiverUrl } = await resolveWebhook(webhookArg)
  console.log('Receiver:', receiverUrl, '\n')

  // Snapshot original pixel config so we can restore it at the end.
  const original = await getPixel(supabase, pixelId)
  if (!original.signing_secret) throw new Error('Pixel has no signing_secret — set one via PUT .../delivery first')
  const secret = original.signing_secret

  try {
    // Point the pixel at our receiver for the whole run.
    await configurePixel(supabase, original.id, { destination_url: receiverUrl })

    // ── (e) HMAC + (baseline delivered): active, no cap, no throttle ──────────
    await resetPixel(supabase, original.id, { status: 'active', throttle_mode: false, lead_cap_per_period: null })
    const t0 = Math.floor(Date.now() / 1000)
    const baseLead = await fireLead(supabase, inngestKey, original.workspace_id, email('base'))
    const baseReq = await waitForRequest(token, t0, (b) => b?.lead?.email === email('base'))
    if (baseReq) {
      const sigOk = verifyHmac(baseReq.rawBody, baseReq.sigHeader, secret)
      record('(e) HMAC signature verifies', sigOk, sigOk ? 'v1 recomputed matches X-Cursive-Signature' : 'signature mismatch')
      const full = baseReq.body?.lead
      const hasFull = !!full?.phone && !!full?.company?.title && !!full?.location
      record('baseline delivered (full payload)', hasFull, hasFull ? 'phone+title+location present' : 'unexpected missing fields')
      await assertDeliveryRow(supabase, baseLead, 'delivered')
    } else {
      record('(e) HMAC signature verifies', false, 'no delivery received (is the cursive-reseller app synced?)')
      record('baseline delivered (full payload)', false, 'no delivery received')
    }

    // ── (b) THROTTLE: reduced payload omits phone/title/location ──────────────
    await resetPixel(supabase, original.id, { status: 'active', throttle_mode: true, lead_cap_per_period: null })
    const t1 = Math.floor(Date.now() / 1000)
    const thLead = await fireLead(supabase, inngestKey, original.workspace_id, email('throttle'))
    const thReq = await waitForRequest(token, t1, (b) => b?.lead?.email === email('throttle'))
    if (thReq) {
      const l = thReq.body.lead
      const reduced = !l.phone && !l.company?.title && !l.location && !!thReq.body.throttled
      record('(b) throttle reduces payload', reduced, reduced ? 'phone/title/location omitted, throttled=true' : `unexpected: ${JSON.stringify(l)}`)
      await assertDeliveryRow(supabase, thLead, 'throttled')
    } else {
      record('(b) throttle reduces payload', false, 'no delivery received')
    }

    // ── (a) CAP: lead_cap_per_period=2, fire 3 → 3rd skipped_cap ──────────────
    await resetPixel(supabase, original.id, { status: 'active', throttle_mode: false, lead_cap_per_period: 2 })
    const capLeads: string[] = []
    for (let i = 1; i <= 3; i++) {
      capLeads.push(await fireLead(supabase, inngestKey, original.workspace_id, email(`cap-${i}`)))
      await sleep(1500)
    }
    // Poll until all 3 runs reach a terminal audit row. Fixed sleeps are NOT
    // enough: per-workspace concurrency is 2 and each run is several executor
    // round-trips, so a settle window that is too short reads as a false FAIL.
    const capStatuses = await waitForTerminalStatuses(supabase, capLeads, 180_000, 'cap')
    const deliveredCount = capStatuses.filter((s) => s === 'delivered').length
    const skippedCount = capStatuses.filter((s) => s === 'skipped_cap').length
    const capOk = deliveredCount === 2 && skippedCount === 1
    record('(a) cap=2 → 3rd skipped_cap', capOk, `delivered=${deliveredCount} skipped_cap=${skippedCount} (${capStatuses.join(',')})`)

    // ── (c) DEACTIVATE: status inactive → no delivery ─────────────────────────
    await resetPixel(supabase, original.id, { status: 'inactive', throttle_mode: false, lead_cap_per_period: null })
    const t3 = Math.floor(Date.now() / 1000)
    const deacLead = await fireLead(supabase, inngestKey, original.workspace_id, email('deactivated'))
    const [deacStatus] = await waitForTerminalStatuses(supabase, [deacLead], 120_000, 'deactivate')
    const deacReq = await waitForRequest(token, t3, (b) => b?.lead?.email === email('deactivated'), 4000)
    const deacOk = !deacReq && deacStatus !== 'delivered' && deacStatus !== 'throttled'
    record('(c) deactivate stops delivery', deacOk, `receiver_hit=${!!deacReq} delivery_status=${deacStatus ?? 'none'}`)

    // ── (d) BURST: 20 leads → all deliver, counters accurate ──────────────────
    await resetPixel(supabase, original.id, { status: 'active', throttle_mode: false, lead_cap_per_period: null })
    const burstBefore = await getPixel(supabase, pixelId)
    const burstLeads: string[] = []
    for (let i = 0; i < 20; i++) {
      burstLeads.push(await fireLead(supabase, inngestKey, original.workspace_id, email(`burst-${i}`)))
    }
    // Poll until all 20 have a terminal delivery row (or timeout). Budget is
    // generous ON PURPOSE: per-workspace concurrency 2 x ~4 executor calls per
    // run means a single-customer burst of 20 legitimately takes minutes, and
    // any receiver 429 adds a 15s+ retry backoff.
    const burstStatuses = await waitForTerminalStatuses(supabase, burstLeads, 420_000, 'burst')
    const burstDelivered = burstStatuses.filter((s) => s === 'delivered').length
    const burstAfter = await getPixel(supabase, pixelId)
    const periodDelta = burstAfter.leads_delivered_period - burstBefore.leads_delivered_period
    const usageDelivered = await getUsageDeliveredToday(supabase, original.reseller_id, burstLeads.length)
    const burstOk = burstDelivered === 20 && periodDelta >= 20
    record(
      '(d) burst 20 all deliver + counters',
      burstOk,
      `delivered=${burstDelivered}/20 pixel.period_delta=${periodDelta} usage_daily_delivered≈${usageDelivered}`,
    )
  } finally {
    // Restore original config.
    await configurePixel(supabase, original.id, {
      status: original.status,
      throttle_mode: original.throttle_mode,
      lead_cap_per_period: original.lead_cap_per_period,
      destination_url: original.destination_url,
    })
    console.log('\nRestored original pixel config.')
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n=== MATRIX: ${results.length - failed.length}/${results.length} passed ===`)
  if (failed.length) process.exit(1)
}

// ── helpers ─────────────────────────────────────────────────────────────────

async function resolveWebhook(arg?: string): Promise<{ token: string; receiverUrl: string }> {
  if (arg) {
    const token = arg.includes('webhook.site') ? arg.split('/').filter(Boolean).pop()! : arg
    return { token, receiverUrl: `https://webhook.site/${token}` }
  }
  const res = await fetch('https://webhook.site/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  if (!res.ok) throw new Error(`Could not create webhook.site token (${res.status}). Pass --webhook <uuid> instead.`)
  const json = (await res.json()) as { uuid: string }
  return { token: json.uuid, receiverUrl: `https://webhook.site/${json.uuid}` }
}

async function getPixel(supabase: SupabaseClient, pixelId: string): Promise<PixelRow> {
  const { data, error } = await supabase
    .from('reseller_pixels')
    .select('id, reseller_id, workspace_id, pixel_id, signing_secret, destination_url, status, throttle_mode, lead_cap_per_period, period_start, leads_delivered_period')
    .eq('pixel_id', pixelId)
    .maybeSingle()
  if (error || !data) throw new Error(`reseller_pixels lookup failed for ${pixelId}: ${error?.message ?? 'not found'}`)
  return data as PixelRow
}

async function configurePixel(supabase: SupabaseClient, id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from('reseller_pixels').update(patch).eq('id', id)
  if (error) throw new Error(`configurePixel failed: ${error.message}`)
}

/** Reset counters to a clean current period + apply scenario config. */
async function resetPixel(
  supabase: SupabaseClient,
  id: string,
  cfg: { status: string; throttle_mode: boolean | null; lead_cap_per_period: number | null },
) {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${new Date().toISOString().slice(0, 7)}-01`
  await configurePixel(supabase, id, {
    ...cfg,
    leads_delivered_period: 0,
    period_start: monthStart,
  })
  // Also reset the reseller-wide period counter so a reseller cap doesn't bleed
  // across scenarios.
  const { data: pix } = await supabase.from('reseller_pixels').select('reseller_id').eq('id', id).maybeSingle()
  if (pix) {
    await supabase
      .from('resellers')
      .update({ leads_delivered_period: 0, period_start: monthStart })
      .eq('id', (pix as { reseller_id: string }).reseller_id)
  }
  void today
  await sleep(500)
}

async function fireLead(supabase: SupabaseClient, inngestKey: string, workspaceId: string, email: string): Promise<string> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      email,
      first_name: 'Matrix',
      last_name: 'Test',
      full_name: 'Matrix Test',
      company_name: 'Example Inc',
      company_domain: 'example.com',
      job_title: 'VP Testing',
      phone: '+15125550199',
      city: 'Austin',
      state: 'TX',
      state_code: 'TX',
      source: 'reseller_test_matrix',
      enrichment_status: 'enriched',
      delivery_status: 'pending',
      delivered_at: new Date().toISOString(),
      status: 'new',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`lead insert failed: ${error?.message}`)
  // Retry the event fire on transient network failure (up to 3 attempts).
  const body = JSON.stringify({ name: 'lead/created', data: { lead_id: data.id, workspace_id: workspaceId, source: 'reseller_test_matrix' } })
  for (let i = 0; i < 3; i++) {
    const res = await fetch('https://inn.gs/e/' + inngestKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => null)
    if (res?.ok) return data.id as string
    if (i < 2) await sleep(2000)
  }
  throw new Error('fire lead/created failed after 3 attempts')
}

type ReceivedReq = { rawBody: string; sigHeader: string; body: any }

/** Poll webhook.site for a request whose parsed JSON body matches `pred`. */
async function waitForRequest(
  token: string,
  sinceUnix: number,
  pred: (body: any) => boolean,
  // Event->run->4 executor round-trips on a cold function is routinely 30-90s;
  // 25s produced false "no delivery received" failures.
  timeoutMs = 120000,
): Promise<ReceivedReq | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    // Tolerate transient network failures — keep polling until the deadline.
    const res = await fetch(`https://webhook.site/token/${token}/requests?sorting=newest&per_page=50`).catch(
      () => null,
    )
    if (res?.ok) {
      const json = (await res.json()) as { data: Array<{ content: string; headers: Record<string, string[]>; created_at: string }> }
      for (const r of json.data ?? []) {
        let body: any
        try {
          body = JSON.parse(r.content)
        } catch {
          continue
        }
        if (pred(body)) {
          const sig = r.headers['x-cursive-signature']?.[0] ?? ''
          return { rawBody: r.content, sigHeader: sig, body }
        }
      }
    }
    await sleep(2000)
  }
  return null
}

function verifyHmac(rawBody: string, sigHeader: string, secret: string): boolean {
  // Split on the FIRST '=' only (values may contain '=').
  const parts = Object.fromEntries(
    sigHeader.split(',').map((kv) => {
      const i = kv.indexOf('=')
      return i === -1 ? [kv, ''] : [kv.slice(0, i), kv.slice(i + 1)]
    }),
  )
  const t = parts.t
  const received = parts.v1
  if (!t || !received) return false
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Poll until every lead has a terminal reseller_lead_deliveries row (or timeout). */
async function waitForTerminalStatuses(
  supabase: SupabaseClient,
  leadIds: string[],
  timeoutMs: number,
  label: string,
): Promise<(string | null)[]> {
  const deadline = Date.now() + timeoutMs
  let statuses: (string | null)[] = leadIds.map(() => null)
  for (;;) {
    statuses = await Promise.all(leadIds.map((id) => getDeliveryStatus(supabase, id).catch(() => null)))
    const done = statuses.filter((s) => s != null).length
    if (done === leadIds.length || Date.now() >= deadline) return statuses
    console.log(`  ... ${label}: ${done}/${leadIds.length} terminal, polling`)
    await sleep(3000)
  }
}

async function getDeliveryStatus(supabase: SupabaseClient, leadId: string): Promise<string | null> {
  const { data } = await supabase
    .from('reseller_lead_deliveries')
    .select('status')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as { status: string } | null)?.status ?? null
}

async function assertDeliveryRow(supabase: SupabaseClient, leadId: string, expected: string) {
  const status = await getDeliveryStatus(supabase, leadId)
  record(`delivery row = ${expected}`, status === expected, `lead ${leadId.slice(0, 8)} status=${status ?? 'none'}`)
}

async function getUsageDeliveredToday(supabase: SupabaseClient, resellerId: string, _n: number): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('reseller_usage_daily')
    .select('leads_delivered')
    .eq('reseller_id', resellerId)
    .eq('usage_date', today)
  const rows = (data as Array<{ leads_delivered: number }> | null) ?? []
  return rows.reduce((sum, r) => sum + r.leads_delivered, 0)
}

main().catch((err) => {
  console.error('Matrix failed:', err.message)
  process.exit(1)
})
