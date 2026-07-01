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
    const baseLead = await fireLead(supabase, inngestKey, original.workspace_id, 'matrix-base@example.com')
    const baseReq = await waitForRequest(token, t0, (b) => b?.lead?.email === 'matrix-base@example.com')
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
    const thLead = await fireLead(supabase, inngestKey, original.workspace_id, 'matrix-throttle@example.com')
    const thReq = await waitForRequest(token, t1, (b) => b?.lead?.email === 'matrix-throttle@example.com')
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
      capLeads.push(await fireLead(supabase, inngestKey, original.workspace_id, `matrix-cap-${i}@example.com`))
      await sleep(1500)
    }
    await sleep(6000) // allow all 3 runs to settle
    const capStatuses = await Promise.all(capLeads.map((id) => getDeliveryStatus(supabase, id)))
    const deliveredCount = capStatuses.filter((s) => s === 'delivered').length
    const skippedCount = capStatuses.filter((s) => s === 'skipped_cap').length
    const capOk = deliveredCount === 2 && skippedCount === 1
    record('(a) cap=2 → 3rd skipped_cap', capOk, `delivered=${deliveredCount} skipped_cap=${skippedCount} (${capStatuses.join(',')})`)

    // ── (c) DEACTIVATE: status inactive → no delivery ─────────────────────────
    await resetPixel(supabase, original.id, { status: 'inactive', throttle_mode: false, lead_cap_per_period: null })
    const t3 = Math.floor(Date.now() / 1000)
    const deacLead = await fireLead(supabase, inngestKey, original.workspace_id, 'matrix-deactivated@example.com')
    await sleep(6000)
    const deacReq = await waitForRequest(token, t3, (b) => b?.lead?.email === 'matrix-deactivated@example.com', 4000)
    const deacStatus = await getDeliveryStatus(supabase, deacLead)
    const deacOk = !deacReq && deacStatus !== 'delivered' && deacStatus !== 'throttled'
    record('(c) deactivate stops delivery', deacOk, `receiver_hit=${!!deacReq} delivery_status=${deacStatus ?? 'none'}`)

    // ── (d) BURST: 20 leads → all deliver, counters accurate ──────────────────
    await resetPixel(supabase, original.id, { status: 'active', throttle_mode: false, lead_cap_per_period: null })
    const burstBefore = await getPixel(supabase, pixelId)
    const burstLeads: string[] = []
    for (let i = 0; i < 20; i++) {
      burstLeads.push(await fireLead(supabase, inngestKey, original.workspace_id, `matrix-burst-${i}@example.com`))
    }
    // Poll until all 20 have a terminal delivery row (or timeout).
    let burstStatuses: (string | null)[] = []
    for (let attempt = 0; attempt < 30; attempt++) {
      await sleep(2000)
      burstStatuses = await Promise.all(burstLeads.map((id) => getDeliveryStatus(supabase, id)))
      if (burstStatuses.every((s) => s != null)) break
    }
    const burstDelivered = burstStatuses.filter((s) => s === 'delivered').length
    const burstAfter = await getPixel(supabase, pixelId)
    const periodDelta = burstAfter.leads_delivered_period - burstBefore.leads_delivered_period
    const usageDelivered = await getUsageDeliveredToday(supabase, original.id, burstLeads.length)
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
  const res = await fetch('https://inn.gs/e/' + inngestKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'lead/created', data: { lead_id: data.id, workspace_id: workspaceId, source: 'reseller_test_matrix' } }),
  })
  if (!res.ok) throw new Error(`fire lead/created failed: ${res.status}`)
  return data.id as string
}

type ReceivedReq = { rawBody: string; sigHeader: string; body: any }

/** Poll webhook.site for a request whose parsed JSON body matches `pred`. */
async function waitForRequest(
  token: string,
  sinceUnix: number,
  pred: (body: any) => boolean,
  timeoutMs = 25000,
): Promise<ReceivedReq | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const res = await fetch(`https://webhook.site/token/${token}/requests?sorting=newest&per_page=50`)
    if (res.ok) {
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
  const parts = Object.fromEntries(sigHeader.split(',').map((kv) => kv.split('=')))
  const t = parts.t
  const received = parts.v1
  if (!t || !received) return false
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
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
