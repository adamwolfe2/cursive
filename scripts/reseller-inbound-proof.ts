/**
 * Reseller INBOUND-LEG proof (superpixel webhook -> lead -> automatic delivery).
 *
 * The test matrix (reseller-test-matrix.ts) injects `leads` rows and fires
 * `lead/created` manually — it proves the OUTBOUND leg only. This script proves
 * the inbound leg end to end with zero manual event firing:
 *
 *   POST /api/webhooks/audiencelab/superpixel?ws=<child_ws>   (real prod route,
 *     secret-authenticated, lead-worthy synthetic payload)
 *   -> processEventInline: normalize -> identity -> leads row
 *   -> fireInngestEvent('lead/created')                        (fired by the ROUTE)
 *   -> deliverResellerLead (isolated cursive-reseller app)
 *   -> signed POST on the webhook.site receiver
 *
 * Usage:
 *   ./node_modules/.bin/tsx scripts/reseller-inbound-proof.ts <pixel_id>
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *               AUDIENCELAB_WEBHOOK_SECRET.
 * Mutates the pixel's destination_url for the run and restores it; cleans up
 * the synthetic event/identity/lead rows afterwards.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const APP_URL = process.env.RESELLER_APP_URL || 'https://leads.meetcursive.com'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const RUN = Date.now().toString(36)

async function main() {
  const pixelId = process.argv[2]
  if (!pixelId) {
    console.error('Usage: tsx scripts/reseller-inbound-proof.ts <pixel_id>')
    process.exit(1)
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const alSecret = process.env.AUDIENCELAB_WEBHOOK_SECRET
  if (!url || !serviceKey) throw new Error('Missing SUPABASE env')
  if (!alSecret) throw new Error('Missing AUDIENCELAB_WEBHOOK_SECRET')

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: pixel, error } = await supabase
    .from('reseller_pixels')
    .select('id, workspace_id, pixel_id, signing_secret, destination_url, status')
    .eq('pixel_id', pixelId)
    .maybeSingle()
  if (error || !pixel) throw new Error(`pixel lookup failed: ${error?.message ?? 'not found'}`)
  if (pixel.status !== 'active') throw new Error('pixel is not active')
  if (!pixel.signing_secret) throw new Error('pixel has no signing_secret')

  // Fresh receiver.
  const whRes = await fetch('https://webhook.site/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!whRes.ok) throw new Error(`webhook.site token failed (${whRes.status})`)
  const { uuid: token } = (await whRes.json()) as { uuid: string }
  const receiverUrl = `https://webhook.site/${token}`
  console.log('Receiver:', receiverUrl)

  const originalDestination = pixel.destination_url
  await supabase.from('reseller_pixels').update({ destination_url: receiverUrl }).eq('id', pixel.id)

  const email = `inbound-proof-${RUN}@example.com`
  const hem = crypto.createHash('sha256').update(email).digest('hex')
  const profileId = `inbound-proof-${RUN}`

  try {
    // Lead-worthy synthetic superpixel event: verified email + proper name.
    const event = {
      pixel_id: pixel.pixel_id,
      event: 'identification',
      event_type: 'page_view',
      event_timestamp: new Date().toISOString(),
      hem_sha256: hem,
      profile_id: profileId,
      user_agent: `Cursive-Reseller-Inbound-Proof/1.0 (${RUN})`,
      FIRST_NAME: 'Inbound',
      LAST_NAME: 'Prooftest',
      PERSONAL_EMAILS: email,
      PERSONAL_VERIFIED_EMAILS: email,
      PERSONAL_EMAIL_VALIDATION_STATUS: 'valid',
      PERSONAL_PHONE: '+15125550137',
      COMPANY_NAME: 'Inbound Proof Co',
      JOB_TITLE: 'QA Director',
      PERSONAL_CITY: 'Austin',
      STATE: 'TX',
      landing_url: 'https://example.com/?proof=' + RUN,
    }
    const body = JSON.stringify({ result: [event] })

    // Real prod inbound route, ?ws= scoped to the reseller child workspace.
    const hookUrl = `${APP_URL}/api/webhooks/audiencelab/superpixel?ws=${pixel.workspace_id}`
    const res = await fetch(hookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-audiencelab-secret': alSecret },
      body,
    })
    const resBody = await res.json().catch(() => ({}))
    console.log('Webhook response:', res.status, JSON.stringify(resBody))
    if (res.status !== 200) throw new Error('inbound webhook rejected')

    // 1. leads row created in the CHILD workspace by the real pipeline?
    let leadId: string | null = null
    for (let i = 0; i < 30 && !leadId; i++) {
      const { data } = await supabase
        .from('leads')
        .select('id, workspace_id, email, source')
        .eq('workspace_id', pixel.workspace_id)
        .eq('email', email)
        .maybeSingle()
      if (data) {
        leadId = data.id
        console.log(`PASS  lead created by inbound pipeline: ${data.id} (source=${data.source})`)
      } else {
        await sleep(2000)
      }
    }
    if (!leadId) throw new Error('FAIL: no leads row appeared within 60s')

    // 2. Automatic delivery (no manual lead/created fire!) recorded?
    let delivered = false
    for (let i = 0; i < 60 && !delivered; i++) {
      const { data } = await supabase
        .from('reseller_lead_deliveries')
        .select('status, response_status')
        .eq('lead_id', leadId)
        .maybeSingle()
      if (data) {
        delivered = data.status === 'delivered' || data.status === 'throttled'
        console.log(`${delivered ? 'PASS' : 'FAIL'}  delivery row: ${data.status} (http=${data.response_status})`)
        break
      }
      await sleep(3000)
    }

    // 3. Signed payload actually landed on the receiver?
    let received = false
    for (let i = 0; i < 20 && !received; i++) {
      const r = await fetch(`https://webhook.site/token/${token}/requests?sorting=newest&per_page=20`)
      if (r.ok) {
        const j = (await r.json()) as { data: Array<{ content: string; headers: Record<string, string[]> }> }
        for (const req of j.data ?? []) {
          try {
            const b = JSON.parse(req.content)
            if (b?.lead?.email === email) {
              const sig = req.headers['x-cursive-signature']?.[0] ?? ''
              const i2 = sig.indexOf('t=')
              const parts = Object.fromEntries(
                sig.split(',').map((kv) => {
                  const k = kv.indexOf('=')
                  return k === -1 ? [kv, ''] : [kv.slice(0, k), kv.slice(k + 1)]
                }),
              )
              void i2
              const expected = crypto
                .createHmac('sha256', pixel.signing_secret!)
                .update(`${parts.t}.${req.content}`)
                .digest('hex')
              const sigOk = parts.v1 === expected
              console.log(`${sigOk ? 'PASS' : 'FAIL'}  signed payload on receiver (HMAC ${sigOk ? 'verifies' : 'MISMATCH'})`)
              received = true
              break
            }
          } catch {
            /* not JSON */
          }
        }
      }
      if (!received) await sleep(3000)
    }
    if (!received) console.log('FAIL  no signed payload observed on receiver')

    console.log(received && delivered ? '\nINBOUND LEG: FULL PASS' : '\nINBOUND LEG: INCOMPLETE — see failures above')

    // Cleanup synthetic rows (keep the delivery audit row — it is real history).
    await supabase.from('leads').delete().eq('id', leadId)
    await supabase.from('audiencelab_events').delete().eq('profile_id', profileId)
    await supabase.from('audiencelab_identities').delete().eq('profile_id', profileId)
    console.log('Cleaned up synthetic lead/event/identity rows.')
  } finally {
    await supabase.from('reseller_pixels').update({ destination_url: originalDestination }).eq('id', pixel.id)
    console.log('Restored original destination_url.')
  }
}

main().catch((err) => {
  console.error('Inbound proof failed:', err.message)
  process.exit(1)
})
