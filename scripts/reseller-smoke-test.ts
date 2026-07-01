/**
 * Reseller layer end-to-end smoke test — with a FAKE data point.
 *
 * Usage:
 *   npx tsx scripts/reseller-smoke-test.ts <pixel_id> [--email you@example.com]
 *
 * What it does (against whatever env your shell has — point it at prod by
 * loading prod env, or dev):
 *   1. Looks up the reseller_pixels row for <pixel_id> to find its child
 *      workspace + configured destination_url.
 *   2. Inserts a synthetic identified lead into that workspace's `leads` table.
 *   3. Fires the `lead/created` Inngest event (same path edge-processor uses).
 *
 * The deployed deliverResellerLead function then forwards a signed
 * `lead.identified` payload to the pixel's destination_url — so if you set the
 * pixel's destination to a https://webhook.site/<id> URL, you'll see the signed
 * payload arrive within a few seconds. No real pixel traffic required.
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * INNGEST_EVENT_KEY.
 */

import { createClient } from '@supabase/supabase-js'

async function main() {
  const pixelId = process.argv[2]
  if (!pixelId) {
    console.error('Usage: npx tsx scripts/reseller-smoke-test.ts <pixel_id> [--email addr]')
    process.exit(1)
  }
  const emailFlag = process.argv.indexOf('--email')
  const email = emailFlag > -1 ? process.argv[emailFlag + 1] : `smoke+${Date.now()}@example.com`

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const inngestKey = process.env.INNGEST_EVENT_KEY
  if (!url || !serviceKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  if (!inngestKey) throw new Error('Missing INNGEST_EVENT_KEY (needed to fire lead/created)')

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  // 1. Resolve the reseller pixel -> child workspace.
  const { data: pixel, error: pErr } = await supabase
    .from('reseller_pixels')
    .select('id, workspace_id, reseller_id, external_customer_ref, destination_url, status')
    .eq('pixel_id', pixelId)
    .maybeSingle()
  if (pErr) throw new Error(`reseller_pixels lookup failed: ${pErr.message}`)
  if (!pixel) throw new Error(`No reseller_pixels row for pixel_id=${pixelId}. Create it via POST /api/reseller/v1/pixels first.`)

  console.log('Pixel:', {
    pixel_id: pixelId,
    workspace_id: pixel.workspace_id,
    customer: pixel.external_customer_ref,
    destination: pixel.destination_url ?? '(none set — set one via PUT .../delivery to see delivery)',
    status: pixel.status,
  })

  // 2. Insert a synthetic identified lead into the child workspace.
  const { data: lead, error: lErr } = await supabase
    .from('leads')
    .insert({
      workspace_id: pixel.workspace_id,
      email,
      first_name: 'Smoke',
      last_name: 'Test',
      full_name: 'Smoke Test',
      company_name: 'Example Inc',
      company_domain: 'example.com',
      job_title: 'VP Testing',
      phone: '+15125550199',
      city: 'Austin',
      state: 'TX',
      state_code: 'TX',
      source: 'reseller_smoke_test',
      enrichment_status: 'enriched',
      delivery_status: 'pending',
      delivered_at: new Date().toISOString(),
      status: 'new',
    })
    .select('id')
    .single()
  if (lErr) throw new Error(`lead insert failed: ${lErr.message}`)
  console.log('Inserted fake lead:', lead.id, `(${email})`)

  // 3. Fire lead/created (same REST path edge-processor uses).
  const res = await fetch('https://inn.gs/e/' + inngestKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'lead/created',
      data: { lead_id: lead.id, workspace_id: pixel.workspace_id, source: 'reseller_smoke_test' },
    }),
  })
  console.log('Fired lead/created:', res.status, res.ok ? 'OK' : await res.text())
  console.log(
    '\nWatch your destination_url (e.g. webhook.site) for a signed `lead.identified` POST within a few seconds.',
  )
  console.log('Then check delivery + usage:')
  console.log('  GET /api/reseller/v1/usage')
  console.log(`  (or query reseller_lead_deliveries where lead_id = '${lead.id}')`)
}

main().catch((err) => {
  console.error('Smoke test failed:', err.message)
  process.exit(1)
})
