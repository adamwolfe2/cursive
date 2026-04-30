/**
 * Production schema drift audit.
 *
 * Queries the remote database via the Supabase Management API to identify
 * tables that are defined in local migration files but DO NOT exist in
 * production. Catches silent drift like the api_usage_log situation
 * (defined in 20260125000006, never applied, code referencing it silently
 * fails).
 *
 * Usage: pnpm tsx scripts/audit-schema-drift.ts
 */

import { execSync } from 'node:child_process'

const PROJECT_REF = 'lrbftjspiiakfnydxbgk'

// Tables we expect to exist based on local migration files. If we find any of
// these missing in production, that's a drift signal worth investigating.
const EXPECTED_TABLES = [
  // Core platform
  'workspaces',
  'users',
  'leads',

  // MCP / AL infrastructure
  'api_usage_log',
  'audiencelab_events',
  'audiencelab_identities',
  'audiencelab_pixels',
  'workspace_api_keys',
  'rate_limit_logs',
  'api_idempotency_keys',

  // From 20260125000006_rate_limiting_analytics.sql (the one that never ran)
  'push_subscriptions',
  'notification_history',
  'api_rate_limits',
  'analytics_reports',
  'prediction_cache',

  // CRM integrations
  'crm_connections',
  'crm_sync_log',
  'workspace_integrations',

  // Targeting / routing
  'user_targeting',
  'user_lead_assignments',

  // Webhooks (outbound)
  'workspace_webhooks',
  'outbound_webhook_deliveries',

  // Billing / usage
  'stripe_customers',
  'workspace_usage',

  // Email / automation
  'email_conversations',
  'email_accounts',
  'email_sends',

  // Onboarding
  'onboarding_templates',

  // Inbox / SDR
  'sdr_configurations',
  'sdr_knowledge_base',
  'reply_response_templates',

  // Autoresearch
  'autoresearch_programs',
  'autoresearch_experiments',
  'autoresearch_results',
  'winning_patterns',

  // Marketplace
  'partners',
  'marketplace_audit_log',
  'partner_payouts',

  // GHL
  'ghl_app_installs',

  // Referrals
  'referral_tracking',

  // Credits / transactions
  'credit_transactions',
  'workspace_credits',

  // Deployment / Onboarding v2
  'onboarding_clients',
  'onboarding_steps',
]

async function getPAT(): Promise<string> {
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

async function runQuery(pat: string, query: string): Promise<unknown[]> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Query failed: ${res.status} ${text}`)
  }
  return res.json()
}

async function main() {
  const pat = await getPAT()

  // eslint-disable-next-line no-console
  console.log('=== Schema Drift Audit ===')
  // eslint-disable-next-line no-console
  console.log('Project:', PROJECT_REF)
  // eslint-disable-next-line no-console
  console.log('Expected tables:', EXPECTED_TABLES.length)

  // Get all tables in public schema
  const rows = (await runQuery(
    pat,
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  )) as { table_name: string }[]

  const present = new Set(rows.map((r) => r.table_name))
  const missing = EXPECTED_TABLES.filter((t) => !present.has(t))
  const unexpectedPresent = Array.from(present).filter((t) => !EXPECTED_TABLES.includes(t))

  // eslint-disable-next-line no-console
  console.log('')
  // eslint-disable-next-line no-console
  console.log(`Tables in production: ${present.size}`)
  // eslint-disable-next-line no-console
  console.log(`Expected tables present: ${EXPECTED_TABLES.length - missing.length}/${EXPECTED_TABLES.length}`)

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.log('')
    // eslint-disable-next-line no-console
    console.log('MISSING TABLES:')
    for (const t of missing) {
      // eslint-disable-next-line no-console
      console.log(`  - ${t}`)
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('')
    // eslint-disable-next-line no-console
    console.log('All expected tables present.')
  }

  // eslint-disable-next-line no-console
  console.log('')
  // eslint-disable-next-line no-console
  console.log(`(${unexpectedPresent.length} additional tables exist that weren't in the expected list — may be fine)`)

  // Also check for tables that code references but may be missing
  // eslint-disable-next-line no-console
  console.log('')
  // eslint-disable-next-line no-console
  console.log('=== Quick sanity checks on key tables ===')

  for (const table of ['audiencelab_events', 'audiencelab_identities', 'leads', 'workspace_api_keys', 'api_usage_log']) {
    if (!present.has(table)) {
      // eslint-disable-next-line no-console
      console.log(`  ${table}: MISSING`)
      continue
    }
    try {
      const countRes = (await runQuery(
        pat,
        `SELECT count(*)::int as n FROM ${table}`
      )) as { n: number }[]
      // eslint-disable-next-line no-console
      console.log(`  ${table}: ${countRes[0]?.n ?? '?'} rows`)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`  ${table}: ERROR ${(err as Error).message.slice(0, 80)}`)
    }
  }

  // Check how much data is flowing through AL (are real events landing?)
  // eslint-disable-next-line no-console
  console.log('')
  // eslint-disable-next-line no-console
  console.log('=== AudienceLab data flow health ===')
  try {
    const recent = (await runQuery(
      pat,
      "SELECT count(*)::int as n FROM audiencelab_events WHERE received_at >= now() - interval '7 days'"
    )) as { n: number }[]
    // eslint-disable-next-line no-console
    console.log(`  audiencelab_events (last 7d): ${recent[0]?.n ?? 0}`)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`  audiencelab_events query failed: ${(err as Error).message.slice(0, 80)}`)
  }

  try {
    const leadsLast7 = (await runQuery(
      pat,
      "SELECT count(*)::int as n FROM leads WHERE source IN ('audiencelab','audiencelab_pull') AND created_at >= now() - interval '7 days'"
    )) as { n: number }[]
    // eslint-disable-next-line no-console
    console.log(`  AL-sourced leads (last 7d): ${leadsLast7[0]?.n ?? 0}`)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`  AL leads query failed: ${(err as Error).message.slice(0, 80)}`)
  }

  try {
    const pixels = (await runQuery(
      pat,
      "SELECT count(*)::int as n FROM audiencelab_pixels"
    )) as { n: number }[]
    // eslint-disable-next-line no-console
    console.log(`  audiencelab_pixels: ${pixels[0]?.n ?? 0} total`)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`  audiencelab_pixels query failed: ${(err as Error).message.slice(0, 80)}`)
  }

  // eslint-disable-next-line no-console
  console.log('')
  // eslint-disable-next-line no-console
  console.log(missing.length === 0 ? 'DRIFT AUDIT PASSED' : `DRIFT FOUND: ${missing.length} missing tables`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
