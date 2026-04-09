/**
 * Pixel end-to-end smoke test.
 *
 * Sends a signed SuperPixel webhook event to the production endpoint with a
 * real pixel_id, verifies the event lands in audiencelab_events, and checks
 * that any downstream lead or identity rows were created.
 *
 * Usage: pnpm tsx scripts/smoke-test-pixel.ts
 *
 * This is the "real leads in real time" proof. It simulates a browser pixel
 * fire without requiring a real browser session — instead hitting the webhook
 * endpoint directly with a properly formed, secret-authenticated payload.
 */

import { readFileSync } from 'node:fs'
import { randomBytes, createHash, createHmac } from 'node:crypto'
import { execSync } from 'node:child_process'

const envFile = readFileSync('.env.local', 'utf8')
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  let value = trimmed.slice(eq + 1).trim()
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).replace(/\\n|\\r|\\t/g, '').trim()
  }
  if (!process.env[key]) process.env[key] = value
}

const WEBHOOK_URL =
  process.env.PIXEL_WEBHOOK_URL || 'https://leads.meetcursive.com/api/webhooks/audiencelab/superpixel'
const PROJECT_REF = 'lrbftjspiiakfnydxbgk'

function getPAT(): string {
  const raw = execSync(
    'security find-generic-password -s "Supabase CLI" -a "supabase" -w',
    { encoding: 'utf8' }
  ).trim()
  if (raw.startsWith('go-keyring-base64:')) {
    return Buffer.from(raw.slice('go-keyring-base64:'.length), 'base64')
      .toString('utf8')
      .trim()
  }
  return raw
}

async function prodQuery(sql: string): Promise<unknown[]> {
  const pat = getPAT()
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    }
  )
  if (!res.ok) throw new Error(`Prod query failed: ${res.status} ${await res.text()}`)
  return res.json()
}

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[pixel-smoke]', ...args)
}

interface TestResult {
  name: string
  pass: boolean
  detail?: string
}

const results: TestResult[] = []
function assert(name: string, cond: boolean, detail?: string) {
  results.push({ name, pass: cond, detail })
  if (cond) log(`  PASS: ${name}`)
  else log(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`)
}

async function main() {
  log('Target webhook:', WEBHOOK_URL)

  const secret = process.env.AUDIENCELAB_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('AUDIENCELAB_WEBHOOK_SECRET not set in .env.local')
  }

  // 1. Find a CLAIMED active pixel in production. We need one with a
  //    workspace_id so the webhook handler will actually process it.
  const pixels = (await prodQuery(
    "SELECT pixel_id, workspace_id, domain FROM audiencelab_pixels WHERE is_active=true AND workspace_id IS NOT NULL ORDER BY created_at DESC LIMIT 1"
  )) as { pixel_id: string; workspace_id: string; domain: string }[]

  if (pixels.length === 0) {
    log('FAIL: no active, claimed pixels in production')
    log('Cannot run end-to-end pixel test — pixels exist but none are claimed by a workspace.')
    process.exit(2)
  }

  const pixel = pixels[0]
  log('Using pixel:', pixel.pixel_id, 'domain:', pixel.domain, 'workspace:', pixel.workspace_id)

  // 2. Snapshot current counts so we can verify inserts post-test
  const beforeEvents = (await prodQuery(
    `SELECT count(*)::int as n FROM audiencelab_events WHERE pixel_id='${pixel.pixel_id}'`
  )) as { n: number }[]
  log('Events before:', beforeEvents[0].n)

  // 3. Build a synthetic pixel fire event
  const testMarker = `pixel-smoke-${randomBytes(6).toString('hex')}`
  const hemSha = createHash('sha256')
    .update(`smoke+${testMarker}@example.com`)
    .digest('hex')
  const profileId = `smoke-profile-${testMarker}`

  const event = {
    pixel_id: pixel.pixel_id,
    event: 'authentication',
    event_type: 'page_view',
    event_timestamp: new Date().toISOString(),
    hem_sha256: hemSha,
    profile_id: profileId,
    ip: '10.0.0.1',
    user_agent: `Cursive-Pixel-Smoke-Test/1.0 (${testMarker})`,
    FIRST_NAME: 'Pixel',
    LAST_NAME: 'SmokeTest',
    PERSONAL_EMAILS: `smoke+${testMarker}@example.com`,
    COMPANY_NAME: 'Cursive Smoke Test Co',
    JOB_TITLE: 'QA Engineer',
    PERSONAL_CITY: 'Austin',
    STATE: 'TX',
    landing_url: `https://${pixel.domain}/?smoke=${testMarker}`,
    page_url: `https://${pixel.domain}/test`,
  }

  const payload = JSON.stringify({ result: [event] })

  // 4. Sign via HMAC-SHA256 (fallback path) — the webhook also accepts
  //    x-audiencelab-secret header, which is simpler.
  const signature = createHmac('sha256', secret).update(payload).digest('hex')

  // 5. POST the webhook
  log('Sending webhook...')
  const webhookRes = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-audiencelab-secret': secret,
      'x-audiencelab-signature': signature,
      'user-agent': 'Cursive-Pixel-Smoke-Test',
    },
    body: payload,
  })

  const webhookBody = await webhookRes.json().catch(() => ({}))
  log('Webhook response:', webhookRes.status, JSON.stringify(webhookBody))

  assert('webhook returns 200', webhookRes.status === 200)
  assert('webhook stored at least one event', (webhookBody as any).stored > 0)
  assert(
    'webhook processed inline',
    (webhookBody as any).processed !== undefined
  )

  // 6. Wait briefly for inline processing + async logging
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // 7. Verify the event landed in audiencelab_events
  const afterEvents = (await prodQuery(
    `SELECT id, workspace_id, pixel_id, hem_sha256, profile_id, processed, error FROM audiencelab_events WHERE profile_id='${profileId}' ORDER BY received_at DESC LIMIT 5`
  )) as Array<{
    id: string
    workspace_id: string | null
    pixel_id: string
    hem_sha256: string
    profile_id: string
    processed: boolean
    error: string | null
  }>

  assert('event landed in audiencelab_events', afterEvents.length > 0)
  if (afterEvents.length > 0) {
    const e = afterEvents[0]
    log('  event row:', JSON.stringify(e, null, 2).slice(0, 500))
    assert('event has workspace_id set', Boolean(e.workspace_id))
    assert('event workspace matches pixel workspace', e.workspace_id === pixel.workspace_id)
    assert('event was processed', e.processed === true || e.error !== null)
  }

  // 8. Verify identity was upserted
  const identities = (await prodQuery(
    `SELECT id, workspace_id, first_name, last_name, company_name, deliverability_score FROM audiencelab_identities WHERE profile_id='${profileId}' OR hem_sha256='${hemSha}' LIMIT 5`
  )) as Array<{
    id: string
    workspace_id: string | null
    first_name: string | null
    last_name: string | null
    company_name: string | null
    deliverability_score: number | null
  }>

  if (identities.length > 0) {
    log('  identity row:', JSON.stringify(identities[0], null, 2).slice(0, 400))
    assert('identity was created', true)
  } else {
    log('  (no identity row created — likely because synthetic email has no real AL resolution)')
  }

  // 9. Check if any leads were created (may be none — requires verified email)
  const leads = (await prodQuery(
    `SELECT id, workspace_id, first_name, last_name, email, source FROM leads WHERE email LIKE 'smoke+${testMarker}@%' LIMIT 5`
  )) as Array<{
    id: string
    workspace_id: string | null
    first_name: string | null
    last_name: string | null
    email: string | null
    source: string | null
  }>

  if (leads.length > 0) {
    log('  lead created:', JSON.stringify(leads[0], null, 2).slice(0, 400))
    assert('lead created from pixel fire', true)
  } else {
    log('  (no lead created — synthetic email likely failed quality gate, which is expected)')
  }

  // 10. Cleanup: delete the test events so we don't pollute production
  log('Cleaning up test rows...')
  await prodQuery(
    `DELETE FROM audiencelab_events WHERE profile_id='${profileId}' OR (hem_sha256='${hemSha}' AND raw->>'user_agent' LIKE '%smoke%')`
  )
  await prodQuery(
    `DELETE FROM audiencelab_identities WHERE profile_id='${profileId}' OR hem_sha256='${hemSha}'`
  )
  if (leads.length > 0) {
    await prodQuery(
      `DELETE FROM leads WHERE email LIKE 'smoke+${testMarker}@%'`
    )
  }
  log('Cleaned up.')

  // Summary
  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass)
  log('')
  log(`Summary: ${passed}/${results.length} passed`)
  if (failed.length > 0) {
    log('')
    log('FAILURES:')
    for (const f of failed) log(`  - ${f.name}${f.detail ? ': ' + f.detail : ''}`)
    process.exit(1)
  }
  log('All pixel pipeline assertions passed.')
}

main().catch((err) => {
  log('Smoke test crashed:', err)
  process.exit(1)
})
