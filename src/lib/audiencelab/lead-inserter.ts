/**
 * AudienceLab Lead Inserter
 *
 * Shared utility for converting ALEnrichedProfile records into Cursive leads.
 * Extracted from provision-workspace-audience.ts to avoid duplication across
 * the DFY onboarding sequence, weekly refresh cron, and batch enrichment poller.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { ALEnrichedProfile } from './api-client'

export const MIN_QUALITY_SCORE = 20

/**
 * Score an ALEnrichedProfile's data completeness (0–100).
 * Leads below MIN_QUALITY_SCORE are too sparse to be useful.
 */
export function scoreALProfile(record: ALEnrichedProfile): number {
  let score = 0

  const bve = record.BUSINESS_VERIFIED_EMAILS
  const pve = record.PERSONAL_VERIFIED_EMAILS
  if ((typeof bve === 'string' && bve.length > 0) || (Array.isArray(bve) && bve.length > 0)) score += 30
  else if ((typeof pve === 'string' && pve.length > 0) || (Array.isArray(pve) && pve.length > 0)) score += 25
  else if (record.BUSINESS_EMAIL) score += 12
  else if (record.PERSONAL_EMAILS) score += 8

  if (record.FIRST_NAME && record.LAST_NAME) score += 15
  else if (record.FIRST_NAME || record.LAST_NAME) score += 5

  if (record.MOBILE_PHONE) score += 12
  else if (record.DIRECT_NUMBER) score += 10
  else if (record.PERSONAL_PHONE) score += 8
  else if (record.COMPANY_PHONE) score += 4

  if (record.COMPANY_NAME) score += 8
  if (record.JOB_TITLE) score += 7
  if (record.COMPANY_LINKEDIN_URL) score += 8

  const hasCity = record.COMPANY_CITY || record.PERSONAL_CITY
  const hasState = record.COMPANY_STATE || record.PERSONAL_STATE
  if (hasCity && hasState) score += 5
  else if (hasState) score += 2

  if (record.COMPANY_DOMAIN) score += 5
  if (record.COMPANY_EMPLOYEE_COUNT) score += 3
  if (record.COMPANY_REVENUE) score += 3

  return score
}

function parseCSV(val: unknown): string[] {
  if (!val || typeof val !== 'string') return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

function boolField(val: unknown): boolean | null {
  if (val === null || val === undefined) return null
  return ['Y', 'y', 'true', 'TRUE', 'Yes', 'yes', true].includes(val as string | boolean)
}

function extractEmail(record: ALEnrichedProfile): string | null {
  const bve = record.BUSINESS_VERIFIED_EMAILS
  const pve = record.PERSONAL_VERIFIED_EMAILS
  return (
    (Array.isArray(bve) ? bve[0] : typeof bve === 'string' && bve.length > 0 ? bve : null) ||
    (Array.isArray(pve) ? pve[0] : typeof pve === 'string' && pve.length > 0 ? pve : null) ||
    parseCSV(record.PERSONAL_EMAILS)[0] ||
    record.BUSINESS_EMAIL ||
    null
  )
}

export interface InsertLeadOptions {
  workspaceId: string
  assignedUserId?: string
  /** Source tag stored in lead.source column, e.g. 'audiencelab_pull' */
  sourceTag: string
  /** Additional tags beyond the default 'audiencelab' + sourceTag */
  extraTags?: string[]
  /** Industry context for fallback fields */
  industries?: string[]
}

export interface InsertLeadResult {
  leadId: string | null
  /** 'inserted' | 'skipped_quality' | 'skipped_no_email' | 'skipped_duplicate' | 'error' */
  outcome: string
}

/**
 * Insert a single ALEnrichedProfile as a lead in the workspace.
 * Handles quality scoring, email extraction, and deduplication.
 * Returns the lead ID on success, or null with an outcome reason on skip/error.
 */
export async function insertLeadFromALRecord(
  record: ALEnrichedProfile,
  options: InsertLeadOptions
): Promise<InsertLeadResult> {
  const { workspaceId, assignedUserId, sourceTag, extraTags = [], industries = [] } = options

  const qualityScore = scoreALProfile(record)
  if (qualityScore < MIN_QUALITY_SCORE) {
    return { leadId: null, outcome: 'skipped_quality' }
  }

  const email = extractEmail(record)
  if (!email) {
    return { leadId: null, outcome: 'skipped_no_email' }
  }

  const supabase = createAdminClient()

  // Dedupe: skip if this email already exists in the workspace
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', email.toLowerCase())
    .limit(1)
    .maybeSingle()

  if (existing) {
    return { leadId: null, outcome: 'skipped_duplicate' }
  }

  const firstName = record.FIRST_NAME || ''
  const lastName = record.LAST_NAME || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const phones = parseCSV(record.PERSONAL_PHONE || record.MOBILE_PHONE || record.DIRECT_NUMBER)

  const { data: inserted, error: insertErr } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      source: sourceTag,
      enrichment_status: 'enriched',
      status: 'new',
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName || null,
      email: email.toLowerCase(),
      phone: phones[0] || null,
      company_name: record.COMPANY_NAME || null,
      company_industry: record.COMPANY_INDUSTRY || industries[0] || null,
      company_domain: record.COMPANY_DOMAIN || null,
      city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
      state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
      state_code: record.PERSONAL_STATE || record.COMPANY_STATE || null,
      country: 'US',
      country_code: 'US',
      postal_code: record.PERSONAL_ZIP || record.COMPANY_ZIP || null,
      job_title: record.JOB_TITLE || null,
      age_range: record.AGE_RANGE || null,
      gender: record.GENDER || null,
      homeowner: boolField(record.HOMEOWNER),
      married: boolField(record.MARRIED),
      headline: record.HEADLINE || null,
      company_address: record.COMPANY_ADDRESS || null,
      company_city: record.COMPANY_CITY || null,
      company_state: record.COMPANY_STATE || null,
      company_zip: record.COMPANY_ZIP || null,
      company_phone: record.COMPANY_PHONE || null,
      company_sic: record.COMPANY_SIC || null,
      company_naics: record.COMPANY_NAICS || null,
      individual_twitter_url: record.INDIVIDUAL_TWITTER_URL || null,
      individual_facebook_url: record.INDIVIDUAL_FACEBOOK_URL || null,
      all_mobiles: record.ALL_MOBILES
        ? String(record.ALL_MOBILES).split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined,
      all_landlines: record.ALL_LANDLINES
        ? String(record.ALL_LANDLINES).split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined,
      skills: record.SKILLS
        ? String(record.SKILLS).split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined,
      interests: record.INTERESTS
        ? String(record.INTERESTS).split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined,
      lead_score: Math.min(qualityScore, 100),
      intent_score_calculated: Math.round(qualityScore * 0.8),
      freshness_score: 100,
      has_email: true,
      has_phone: phones.length > 0,
      validated: false,
      assigned_user_id: assignedUserId || null,
      enrichment_method: 'audiencelab_pull',
      tags: ['audiencelab', sourceTag, ...extraTags, ...industries.map(i => i.toLowerCase())],
      company_data: {
        name: record.COMPANY_NAME || null,
        industry: record.COMPANY_INDUSTRY || industries[0] || null,
        domain: record.COMPANY_DOMAIN || null,
      },
      company_location: {
        city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
        state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
        country: 'US',
      },
    })
    .select('id')
    .single()

  if (insertErr) {
    if (insertErr.code === '23505') {
      return { leadId: null, outcome: 'skipped_duplicate' }
    }
    safeError('[LeadInserter] Insert failed for', email, insertErr)
    return { leadId: null, outcome: 'error' }
  }

  return { leadId: inserted?.id ?? null, outcome: 'inserted' }
}

/**
 * Bulk-insert multiple AL records into a workspace.
 * Returns counts of inserted/skipped for logging.
 */
export async function bulkInsertALRecords(
  records: ALEnrichedProfile[],
  options: InsertLeadOptions & { maxRecords?: number }
): Promise<{ inserted: number; skipped: number; errors: number }> {
  const { maxRecords = 500, ...insertOptions } = options
  let inserted = 0
  let skipped = 0
  let errors = 0

  for (const record of records) {
    if (inserted >= maxRecords) break

    const result = await insertLeadFromALRecord(record, insertOptions)
    if (result.outcome === 'inserted') {
      inserted++
    } else if (result.outcome === 'error') {
      errors++
    } else {
      skipped++
    }
  }

  return { inserted, skipped, errors }
}
