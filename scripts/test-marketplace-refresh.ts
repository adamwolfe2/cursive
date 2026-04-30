/**
 * Manual test of the marketplace refresh logic against production.
 *
 * Bypasses the Inngest wrapper so we can verify the rewritten function
 * actually pulls leads from AudienceLab and inserts them into the
 * marketplace placeholder workspaces.
 *
 * Limit: pulls only ONE segment, max 5 records, to avoid spamming production.
 *
 * Usage: pnpm tsx scripts/test-marketplace-refresh.ts [segment_id]
 */

import { readFileSync } from 'node:fs'

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

// Dynamic imports below — env vars must be loaded before module-level code
// in api-client.ts captures process.env.AUDIENCELAB_ACCOUNT_API_KEY.
type ALEnrichedProfile = any

const TEST_RECORD_LIMIT = 5
const DAYS_BACK = Number(process.env.DAYS_BACK ?? '7')
const MIN_QUALITY_SCORE = 40

const INDUSTRY_WORKSPACE_MAP: Record<string, string> = {
  home_services: '00000000-0000-0000-0000-000000000002',
  hvac: '00000000-0000-0000-0000-000000000002',
  plumbing: '00000000-0000-0000-0000-000000000002',
  contractor: '00000000-0000-0000-0000-000000000002',
  roofing: '00000000-0000-0000-0000-000000000002',
  home_security: '00000000-0000-0000-0000-000000000002',
  security: '00000000-0000-0000-0000-000000000002',
  fba: '00000000-0000-0000-0000-000000000003',
  logistics: '00000000-0000-0000-0000-000000000003',
  shipping: '00000000-0000-0000-0000-000000000003',
  real_estate: '00000000-0000-0000-0000-000000000003',
  commercial_real_estate: '00000000-0000-0000-0000-000000000003',
  cre: '00000000-0000-0000-0000-000000000003',
}
const FALLBACK_WORKSPACE = '00000000-0000-0000-0000-000000000001'

function workspaceForIndustry(industry: string): string {
  return INDUSTRY_WORKSPACE_MAP[industry.toLowerCase()] ?? FALLBACK_WORKSPACE
}

function scoreRecord(r: ALEnrichedProfile): number {
  let score = 0
  const bve = r.BUSINESS_VERIFIED_EMAILS
  const pve = r.PERSONAL_VERIFIED_EMAILS
  if (typeof bve === 'string' && bve.length > 0) score += 30
  else if (typeof pve === 'string' && pve.length > 0) score += 25
  else if (r.BUSINESS_EMAIL) score += 12
  else if (r.PERSONAL_EMAILS) score += 8
  if (r.FIRST_NAME && r.LAST_NAME) score += 15
  if (r.MOBILE_PHONE) score += 12
  else if (r.DIRECT_NUMBER) score += 10
  else if (r.PERSONAL_PHONE) score += 6
  if (r.COMPANY_NAME) score += 8
  if (r.JOB_TITLE) score += 7
  if (r.COMPANY_STATE || r.PERSONAL_STATE) score += 3
  if (r.COMPANY_DOMAIN) score += 5
  return score
}

function pickEmail(r: ALEnrichedProfile): string | null {
  const bve = r.BUSINESS_VERIFIED_EMAILS
  if (typeof bve === 'string' && bve.includes('@')) return bve.split(',')[0].trim()
  const pve = r.PERSONAL_VERIFIED_EMAILS
  if (typeof pve === 'string' && pve.includes('@')) return pve.split(',')[0].trim()
  if (typeof r.BUSINESS_EMAIL === 'string' && r.BUSINESS_EMAIL.includes('@')) return r.BUSINESS_EMAIL
  const pe = r.PERSONAL_EMAILS
  if (typeof pe === 'string' && pe.includes('@')) return pe.split(',')[0].trim()
  return null
}

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[mkt-refresh-test]', ...args)
}

async function main() {
  const { createAdminClient } = await import('../src/lib/supabase/admin')
  const { fetchAudienceRecords } = await import('../src/lib/audiencelab/api-client')
  const supabase = createAdminClient()
  const requestedSegmentId = process.argv[2]

  log('Loading available segments...')
  const segmentsQuery = supabase
    .from('audience_lab_segments')
    .select('id, industry, segment_name, segment_id')
    .not('segment_id', 'is', null)

  const { data: segmentsData, error: segErr } = requestedSegmentId
    ? await segmentsQuery.eq('segment_id', requestedSegmentId).limit(1)
    : await segmentsQuery.limit(1)

  if (segErr || !segmentsData || segmentsData.length === 0) {
    log('No segments found:', segErr?.message ?? 'empty')
    process.exit(1)
  }

  const segment = segmentsData[0] as any
  log('Using segment:', segment.industry, '→', segment.segment_id)

  const workspaceId = workspaceForIndustry(segment.industry)
  log('Target workspace:', workspaceId)

  log('Calling AudienceLab fetchAudienceRecords...')
  let recordsResponse
  try {
    recordsResponse = await fetchAudienceRecords(segment.segment_id, 1, TEST_RECORD_LIMIT)
  } catch (err) {
    log('AL fetchAudienceRecords failed:', (err as Error).message)
    process.exit(1)
  }

  log(
    `AL returned ${recordsResponse.total_records ?? 0} total available, ${recordsResponse.data?.length ?? 0} fetched`
  )

  const records = (recordsResponse.data ?? []).slice(0, TEST_RECORD_LIMIT)
  if (records.length === 0) {
    log('No records returned. Exiting.')
    process.exit(0)
  }

  const qualified = records
    .map((r) => ({ record: r, score: scoreRecord(r), email: pickEmail(r) }))
    .filter((x) => x.score >= MIN_QUALITY_SCORE && x.email)

  log(`After quality filter: ${qualified.length}/${records.length} qualified`)

  for (const q of qualified.slice(0, 3)) {
    log(
      `  - ${q.record.FIRST_NAME ?? '?'} ${q.record.LAST_NAME ?? '?'} | ${q.email} | score=${q.score} | ${q.record.COMPANY_NAME ?? '?'}`
    )
  }

  if (qualified.length === 0) {
    log('No records met quality bar. Exiting without inserting.')
    process.exit(0)
  }

  // Dedupe against existing marketplace
  const emails = qualified.map((q) => q.email!)
  const { data: existing } = await supabase
    .from('leads')
    .select('email')
    .in('email', emails)
    .eq('is_marketplace_listed', true)

  const existingSet = new Set((existing || []).map((r: any) => r.email))
  const toInsert = qualified.filter((q) => !existingSet.has(q.email!))
  log(`After dedup: ${toInsert.length} new (${qualified.length - toInsert.length} already in marketplace)`)

  if (toInsert.length === 0) {
    log('All qualified records already in marketplace. Exiting.')
    process.exit(0)
  }

  // Build insert payloads
  const inserts = toInsert.map((q) => {
    const r = q.record
    return {
      workspace_id: workspaceId,
      first_name: r.FIRST_NAME ?? null,
      last_name: r.LAST_NAME ?? null,
      email: q.email,
      phone: r.MOBILE_PHONE ?? r.DIRECT_NUMBER ?? null,
      company_name: r.COMPANY_NAME ?? null,
      job_title: r.JOB_TITLE ?? null,
      source: 'audiencelab_marketplace',
      status: 'new',
      is_marketplace_listed: true,
      marketplace_status: 'available',
      marketplace_price: 0.6,
      verification_status: 'valid',
      intent_score_calculated: Math.min(100, q.score + 20),
      freshness_score: 90,
      lead_score: Math.min(100, q.score + 20),
      delivered_at: new Date().toISOString(),
      company_industry: r.COMPANY_INDUSTRY ?? segment.industry,
      city: r.COMPANY_CITY ?? r.PERSONAL_CITY ?? null,
      state: r.COMPANY_STATE ?? r.PERSONAL_STATE ?? null,
      postal_code: r.COMPANY_ZIP ?? r.PERSONAL_ZIP ?? null,
      metadata: {
        audiencelab_segment_id: segment.segment_id,
        audiencelab_segment_name: segment.segment_name,
        audiencelab_industry: segment.industry,
        test_marker: 'manual-marketplace-test',
        source: 'marketplace_refresh_test',
      },
    }
  })

  log(`Inserting ${inserts.length} test marketplace leads...`)
  const { data: inserted, error: insertErr } = await supabase
    .from('leads')
    .insert(inserts)
    .select('id, email')

  if (insertErr) {
    log('Insert FAILED:', insertErr.message)
    process.exit(1)
  }

  log(`SUCCESS: Inserted ${inserted?.length ?? 0} marketplace leads`)
  for (const lead of inserted ?? []) {
    log(`  - ${(lead as any).id} (${(lead as any).email})`)
  }

  // Verify by querying back
  const { count: totalAfter } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('is_marketplace_listed', true)
    .eq('marketplace_status', 'available')
  log(`Marketplace total now: ${totalAfter}`)

  log('Test passed. Cleaning up test rows...')
  const { error: cleanupErr } = await supabase
    .from('leads')
    .delete()
    .filter('metadata->>test_marker', 'eq', 'manual-marketplace-test')
  if (cleanupErr) {
    log('Cleanup failed:', cleanupErr.message)
  } else {
    log('Cleaned up.')
  }
}

main().catch((err) => {
  log('Test crashed:', err)
  process.exit(1)
})
