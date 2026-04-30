/**
 * AL Prospecting Service
 * ----------------------
 * Single source of truth for "given an outbound agent's filters, pull N leads
 * from AudienceLab into the workspace, dedupe by email, and deduct credits."
 *
 * Used by:
 *   - src/inngest/functions/outbound-workflow-run.ts (Step 3 — pullProspects)
 *   - (future) src/app/api/outbound/workflows/[id]/preview/route.ts
 *
 * Mirrors the logic in src/app/api/audiencelab/database/search/route.ts but
 * exposed as a reusable function rather than an HTTP route. The HTTP route
 * remains untouched to keep backward compatibility.
 *
 * Dev mode:
 *   Set OUTBOUND_DEV_MOCK_AL=1 in .env.local to bypass the AL API and credit
 *   deduction. Returns 5 hard-coded fake leads with realistic shapes — useful
 *   for end-to-end testing without spending real credits or hitting AL.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import {
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  type ALAudienceSegmentFilters,
  type ALEnrichedProfile,
  AudienceLabApiError,
  AudienceLabUnfilteredError,
  UNFILTERED_PREVIEW_THRESHOLD,
} from '@/lib/audiencelab/api-client'
import type { OutboundFilters, SeniorityLevel } from '@/types/outbound'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export const CREDIT_COST_PER_LEAD = 0.5
export const HARD_CAP_PER_RUN = 100

export class EmptyPreviewError extends Error {
  constructor(public filterSummary: string) {
    super(`AudienceLab preview returned 0 matches for filters: ${filterSummary}`)
    this.name = 'EmptyPreviewError'
  }
}

export class OverlyBroadFilterError extends Error {
  constructor(public previewCount: number) {
    super(
      `Filter set is too broad (preview returned ${previewCount.toLocaleString()} matches > ${UNFILTERED_PREVIEW_THRESHOLD.toLocaleString()}). Add more constraints.`
    )
    this.name = 'OverlyBroadFilterError'
  }
}

export class InsufficientCreditsError extends Error {
  constructor(public required: number, public balance: number) {
    super(`Insufficient credits: ${required} required, ${balance} available`)
    this.name = 'InsufficientCreditsError'
  }
}

export interface ProspectAndIngestParams {
  workspaceId: string
  agentId: string
  filters: OutboundFilters
  targetCount: number
  runId?: string
  triggeredByUserId?: string | null
}

export interface ProspectAndIngestResult {
  audienceId: string | null
  fetched: number
  newLeads: number
  duplicatesSkipped: number
  insertedLeadIds: string[]
  creditsCharged: number
  newBalance: number | null
  devMock: boolean
}

/**
 * Pull leads from AudienceLab matching the agent's ICP filters,
 * dedupe by email, insert into the workspace's `leads` table, and
 * deduct the credit cost.
 *
 * Returns the inserted lead IDs so the caller can fan-out enrichment.
 */
export async function prospectAndIngest(
  params: ProspectAndIngestParams
): Promise<ProspectAndIngestResult> {
  const { workspaceId, filters, targetCount, runId } = params

  const requestedCount = Math.max(
    1,
    Math.min(
      targetCount,
      filters.cap_per_run ?? 25,
      HARD_CAP_PER_RUN
    )
  )

  const devMock = process.env.OUTBOUND_DEV_MOCK_AL === '1'

  if (devMock) {
    return ingestMockProspects(workspaceId, requestedCount, runId)
  }

  // 1. Build AL filters from our flatter shape
  const alFilters = buildAlFilters(filters)

  // 2. Preview to validate
  const preview = await previewAudience({
    days_back: 7,
    filters: alFilters,
    limit: 25,
  })

  if (preview.count === 0) {
    throw new EmptyPreviewError(JSON.stringify(filters))
  }
  if (preview.count > UNFILTERED_PREVIEW_THRESHOLD) {
    throw new OverlyBroadFilterError(preview.count)
  }

  // 3. Check workspace credit balance up-front
  const supabase = createAdminClient()
  const estimatedCost = requestedCount * CREDIT_COST_PER_LEAD

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('id, credits_balance')
    .eq('id', workspaceId)
    .maybeSingle()

  if (wsError || !workspace) {
    throw new Error(`Workspace ${workspaceId} not found`)
  }
  if ((workspace.credits_balance ?? 0) < estimatedCost) {
    throw new InsufficientCreditsError(estimatedCost, workspace.credits_balance ?? 0)
  }

  // 4. Create the audience and fetch records
  const audience = await createAudience({
    name: `outbound-${runId ?? Date.now()}-${workspaceId.substring(0, 8)}`,
    filters: alFilters,
  })

  const recordsResponse = await fetchAudienceRecords(
    audience.audienceId,
    1,
    requestedCount
  )
  const records = recordsResponse.data ?? []

  if (records.length === 0) {
    return {
      audienceId: audience.audienceId,
      fetched: 0,
      newLeads: 0,
      duplicatesSkipped: 0,
      insertedLeadIds: [],
      creditsCharged: 0,
      newBalance: workspace.credits_balance ?? 0,
      devMock: false,
    }
  }

  // 5. Dedupe by email against existing leads
  const candidateEmails = records
    .map(extractEmail)
    .filter((e): e is string => !!e)

  const { data: existing, error: existingErr } = await supabase
    .from('leads')
    .select('email')
    .eq('workspace_id', workspaceId)
    .in('email', candidateEmails)

  if (existingErr) {
    throw new Error(`Dedupe lookup failed: ${existingErr.message}`)
  }

  const existingEmails = new Set((existing ?? []).map(l => l.email))
  const newRecords = records.filter(record => {
    const email = extractEmail(record)
    return email !== null && !existingEmails.has(email)
  })

  if (newRecords.length === 0) {
    return {
      audienceId: audience.audienceId,
      fetched: records.length,
      newLeads: 0,
      duplicatesSkipped: records.length,
      insertedLeadIds: [],
      creditsCharged: 0,
      newBalance: workspace.credits_balance ?? 0,
      devMock: false,
    }
  }

  const actualCost = newRecords.length * CREDIT_COST_PER_LEAD

  // 6. Deduct credits atomically via the existing RPC
  const { data: creditResult, error: creditErr } = await supabase.rpc('deduct_credits', {
    p_workspace_id: workspaceId,
    p_amount: actualCost,
    p_user_id: params.triggeredByUserId ?? null,
    p_action_type: 'outbound_agent_prospect',
    p_metadata: {
      run_id: runId,
      total_fetched: records.length,
      new_leads: newRecords.length,
      duplicates_skipped: records.length - newRecords.length,
      filters,
    },
  } as any)

  if (creditErr) {
    throw new Error(`Credit deduction failed: ${creditErr.message}`)
  }
  if (!creditResult || !(creditResult as any[])[0]?.success) {
    throw new InsufficientCreditsError(actualCost, workspace.credits_balance ?? 0)
  }
  const newBalance = (creditResult as any[])[0].new_balance

  // 7. Insert the new leads
  const leadsToInsert = newRecords.map(record => mapAlProfileToLead(record, workspaceId))

  const { data: insertedLeads, error: insertError } = await supabase
    .from('leads')
    .insert(leadsToInsert)
    .select('id, email')

  if (insertError) {
    // Refund credits on insert failure
    await supabase
      .rpc('refund_credits', {
        p_workspace_id: workspaceId,
        p_amount: actualCost,
        p_user_id: params.triggeredByUserId ?? null,
        p_reason: 'Outbound agent: lead insert failed',
        p_original_action: 'outbound_agent_prospect',
      } as any)
      .then(() => undefined, () => undefined)
    safeError('[outbound] Lead insert failed, credits refunded:', insertError)
    throw new Error(`Lead insert failed: ${insertError.message}`)
  }

  safeLog('[outbound] Prospects ingested', {
    workspace_id: workspaceId,
    run_id: runId,
    fetched: records.length,
    new_leads: newRecords.length,
    duplicates: records.length - newRecords.length,
    cost: actualCost,
  })

  return {
    audienceId: audience.audienceId,
    fetched: records.length,
    newLeads: newRecords.length,
    duplicatesSkipped: records.length - newRecords.length,
    insertedLeadIds: (insertedLeads ?? []).map(l => l.id),
    creditsCharged: actualCost,
    newBalance,
    devMock: false,
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build AL nested filter shape from our flatter `OutboundFilters`.
 * Mirrors `buildAudienceFilters` in `database/search/route.ts` but supports
 * the wider field set.
 */
export function buildAlFilters(filters: OutboundFilters): ALAudienceSegmentFilters {
  const al: ALAudienceSegmentFilters = {}

  const business: NonNullable<ALAudienceSegmentFilters['business']> = {}
  if (filters.industries?.length) business.industry = filters.industries
  if (filters.job_titles?.length) business.jobTitle = filters.job_titles
  if (filters.seniority_levels?.length) {
    business.seniority = filters.seniority_levels as SeniorityLevel[]
  }
  if (filters.departments?.length) business.department = filters.departments
  if (filters.sic?.length) business.sic = filters.sic
  if (filters.naics?.length) business.naics = filters.naics
  if (filters.employee_count) business.employeeCount = filters.employee_count
  if (filters.company_revenue) business.companyRevenue = filters.company_revenue
  if (Object.keys(business).length > 0) al.business = business

  const location: NonNullable<ALAudienceSegmentFilters['location']> = {}
  if (filters.states?.length) location.state = filters.states
  if (filters.cities?.length) location.city = filters.cities
  if (filters.zips?.length) location.zip = filters.zips
  if (Object.keys(location).length > 0) al.location = location

  return al
}

/**
 * Extract a usable email from an AL profile, preferring business over personal.
 */
function extractEmail(record: ALEnrichedProfile): string | null {
  if (record.BUSINESS_EMAIL) return record.BUSINESS_EMAIL.split(',')[0].trim().toLowerCase()
  if (record.PERSONAL_EMAILS) return record.PERSONAL_EMAILS.split(',')[0].trim().toLowerCase()
  return null
}

/**
 * Map an AL enriched profile to a `leads` table insert. company_name is NOT NULL
 * in the schema so we always supply a fallback.
 */
function mapAlProfileToLead(record: ALEnrichedProfile, workspaceId: string) {
  const email = extractEmail(record)
  const fullName = [record.FIRST_NAME, record.LAST_NAME].filter(Boolean).join(' ').trim() || null
  return {
    workspace_id: workspaceId,
    email,
    first_name: record.FIRST_NAME ?? null,
    last_name: record.LAST_NAME ?? null,
    full_name: fullName,
    company_name: record.COMPANY_NAME || 'Unknown Company',
    company_domain: record.COMPANY_DOMAIN ?? null,
    company_industry: record.COMPANY_INDUSTRY ?? null,
    company_size: record.COMPANY_EMPLOYEE_COUNT ?? null,
    company_revenue: record.COMPANY_REVENUE ?? null,
    job_title: record.JOB_TITLE ?? null,
    contact_title: record.JOB_TITLE ?? null,
    contact_seniority: record.SENIORITY_LEVEL ?? null,
    contact_department: record.DEPARTMENT ?? null,
    phone: record.MOBILE_PHONE || record.DIRECT_NUMBER || null,
    linkedin_url:
      (record as Record<string, unknown>).INDIVIDUAL_LINKEDIN_URL as string | undefined ??
      record.COMPANY_LINKEDIN_URL ??
      null,
    state: record.COMPANY_STATE || record.PERSONAL_STATE || null,
    city: record.COMPANY_CITY || record.PERSONAL_CITY || null,
    postal_code: record.COMPANY_ZIP || record.PERSONAL_ZIP || null,
    source: 'audiencelab_outbound',
    enrichment_status: 'pending',
    delivery_status: 'pending',
  }
}

// ============================================================================
// DEV MOCK — 5 fake leads when OUTBOUND_DEV_MOCK_AL=1
// ============================================================================

function ingestMockProspects(
  workspaceId: string,
  requestedCount: number,
  runId?: string
): Promise<ProspectAndIngestResult> {
  return (async () => {
    const supabase = createAdminClient()
    const count = Math.min(requestedCount, 5)

    const fakes = Array.from({ length: count }).map((_, i) => ({
      workspace_id: workspaceId,
      email: `mock${Date.now()}${i}@example-${i}.com`,
      first_name: ['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan'][i % 5],
      last_name: ['Reed', 'Chen', 'Patel', 'Garcia', 'Kim'][i % 5],
      full_name: `${['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan'][i % 5]} ${['Reed', 'Chen', 'Patel', 'Garcia', 'Kim'][i % 5]}`,
      company_name: `Acme ${['Robotics', 'Analytics', 'Cloud', 'Labs', 'Health'][i % 5]}`,
      company_domain: `acme-${i}.example.com`,
      company_industry: 'Software',
      company_size: '50-200',
      job_title: ['VP of Sales', 'Director of Marketing', 'Head of Growth', 'CTO', 'COO'][i % 5],
      contact_title: ['VP of Sales', 'Director of Marketing', 'Head of Growth', 'CTO', 'COO'][i % 5],
      contact_seniority: ['VP', 'Director', 'Director', 'C-Suite', 'C-Suite'][i % 5],
      state: 'CA',
      city: 'San Francisco',
      source: 'audiencelab_outbound',
      enrichment_status: 'pending',
      delivery_status: 'pending',
    }))

    // Dedupe against existing — mock emails are timestamped so collisions unlikely
    const { data: insertedLeads, error: insertError } = await supabase
      .from('leads')
      .insert(fakes)
      .select('id, email')

    if (insertError) {
      throw new Error(`[mock] Lead insert failed: ${insertError.message}`)
    }

    safeLog('[outbound mock] Inserted fake prospects', {
      workspace_id: workspaceId,
      run_id: runId,
      count,
    })

    return {
      audienceId: null,
      fetched: count,
      newLeads: count,
      duplicatesSkipped: 0,
      insertedLeadIds: (insertedLeads ?? []).map(l => l.id),
      creditsCharged: 0,
      newBalance: null,
      devMock: true,
    }
  })()
}

// Re-export for callers that want to introspect AL errors
export { AudienceLabApiError, AudienceLabUnfilteredError }
