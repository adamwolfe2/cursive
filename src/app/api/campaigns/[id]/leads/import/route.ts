/**
 * Campaign Lead Import API
 * Import leads into a campaign from CSV, paste, or existing leads
 */

export const runtime = 'edge'

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { checkBulkSuppression } from '@/lib/services/campaign/suppression.service'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { sanitizeCsvValue } from '@/lib/utils/csv-sanitizer'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Validation schemas
const csvImportSchema = z.object({
  type: z.literal('csv'),
  csv_data: z.string().min(1),
  email_column: z.string().default('email'),
  first_name_column: z.string().optional(),
  last_name_column: z.string().optional(),
  company_column: z.string().optional(),
  title_column: z.string().optional(),
  has_header: z.boolean().default(true),
})

const pasteImportSchema = z.object({
  type: z.literal('paste'),
  emails: z.string().min(1), // comma or newline separated emails
})

const existingLeadsSchema = z.object({
  type: z.literal('existing'),
  lead_ids: z.array(z.string().uuid()).min(1),
})

const filterLeadsSchema = z.object({
  type: z.literal('filter'),
  filters: z.object({
    industries: z.array(z.string()).optional(),
    company_sizes: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    query_ids: z.array(z.string().uuid()).optional(),
    search: z.string().optional(),
  }),
  limit: z.number().int().min(1).max(1000).default(500),
})

const importSchema = z.discriminatedUnion('type', [
  csvImportSchema,
  pasteImportSchema,
  existingLeadsSchema,
  filterLeadsSchema,
])

// Preview schema (dry run)
const previewSchema = z.object({
  preview: z.literal(true),
}).and(importSchema)

interface ImportResult {
  total: number
  added: number
  duplicates: number
  suppressed: number
  in_other_campaigns: number
  errors: string[]
}

interface LeadToImport {
  email: string
  first_name?: string
  last_name?: string
  company_name?: string
  job_title?: string
}

/**
 * POST /api/campaigns/[id]/leads/import
 * Import leads into a campaign
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const isPreview = body.preview === true

    // Validate input
    const validated = isPreview
      ? previewSchema.parse(body)
      : importSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign exists and belongs to workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id, workspace_id, name, status')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (campaignError || !campaign) {
      return notFound('Campaign not found')
    }

    // Parse leads to import based on type
    let leadsToImport: LeadToImport[]
    try {
      leadsToImport = await parseLeadsFromInput(validated, user.workspace_id, supabase)
    } catch (error: any) {
      console.error('[Lead Import] Parse error:', error)
      return badRequest('Failed to parse leads from input')
    }

    if (leadsToImport.length === 0) {
      return badRequest('No valid leads found to import')
    }

    // Deduplicate and validate
    const result = await processLeadImport(
      leadsToImport,
      campaignId,
      user.workspace_id,
      supabase,
      isPreview
    )

    // If preview, return results without actually importing
    if (isPreview) {
      return success({
        preview: true,
        ...result,
        leads_sample: leadsToImport.slice(0, 10).map((l) => ({
          email: l.email,
          name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || undefined,
          company: l.company_name,
        })),
      })
    }

    // Inngest disabled (Node.js runtime not available on this deployment)
    // Original: await inngest.send({ name: 'campaign/batch-enrich', data: { campaign_id, workspace_id } })
    if (result.added > 0 && campaign.status === 'active') {
      console.log(`[Campaign Lead Import] ${result.added} leads added to campaign ${campaignId} (Inngest enrichment skipped - Edge runtime)`)
    }

    return success(result)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Parse leads from different input types
 */
async function parseLeadsFromInput(
  input: z.infer<typeof importSchema>,
  workspaceId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<LeadToImport[]> {
  switch (input.type) {
    case 'csv':
      return parseCSV(input)

    case 'paste':
      return parsePastedEmails(input.emails)

    case 'existing':
      return fetchExistingLeads(input.lead_ids, workspaceId, supabase)

    case 'filter':
      return fetchFilteredLeads(input.filters, input.limit, workspaceId, supabase)

    default:
      throw new Error('Invalid import type')
  }
}

/**
 * Parse CSV data into leads
 */
function parseCSV(input: z.infer<typeof csvImportSchema>): LeadToImport[] {
  const lines = input.csv_data.split(/\r?\n/).filter((line) => line.trim())

  if (lines.length === 0) {
    throw new Error('CSV data is empty')
  }

  // Parse header row
  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const headers = input.has_header
    ? lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))
    : []

  const startRow = input.has_header ? 1 : 0

  // Find column indices
  const emailCol = headers.indexOf(input.email_column.toLowerCase())
  const firstNameCol = input.first_name_column
    ? headers.indexOf(input.first_name_column.toLowerCase())
    : -1
  const lastNameCol = input.last_name_column
    ? headers.indexOf(input.last_name_column.toLowerCase())
    : -1
  const companyCol = input.company_column
    ? headers.indexOf(input.company_column.toLowerCase())
    : -1
  const titleCol = input.title_column
    ? headers.indexOf(input.title_column.toLowerCase())
    : -1

  if (input.has_header && emailCol === -1) {
    throw new Error(`Email column "${input.email_column}" not found in CSV headers`)
  }

  const leads: LeadToImport[] = []

  for (let i = startRow; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter)

    const email = (input.has_header ? values[emailCol] : values[0])?.trim().toLowerCase()
    if (!email || !isValidEmail(email)) {
      continue
    }

    // Sanitize all values to prevent CSV injection attacks
    leads.push({
      email,
      first_name: firstNameCol >= 0 ? sanitizeCsvValue(values[firstNameCol]) : undefined,
      last_name: lastNameCol >= 0 ? sanitizeCsvValue(values[lastNameCol]) : undefined,
      company_name: companyCol >= 0 ? sanitizeCsvValue(values[companyCol]) : undefined,
      job_title: titleCol >= 0 ? sanitizeCsvValue(values[titleCol]) : undefined,
    })
  }

  return leads
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result.map((v) => v.replace(/^["']|["']$/g, ''))
}

/**
 * Parse pasted emails (comma or newline separated)
 */
function parsePastedEmails(text: string): LeadToImport[] {
  // Split by comma, newline, semicolon, or space
  const emails = text
    .split(/[,\n\r;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && isValidEmail(e))

  return [...new Set(emails)].map((email) => ({ email }))
}

/**
 * Fetch existing leads by IDs
 */
async function fetchExistingLeads(
  leadIds: string[],
  workspaceId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<LeadToImport[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('email, first_name, last_name, company_name, job_title')
    .eq('workspace_id', workspaceId)
    .in('id', leadIds)
    .not('email', 'is', null)

  if (error) {
    console.error('[Fetch Existing Leads] Database error:', error)
    throw new Error('Failed to fetch leads')
  }

  return (data || []).map((l) => ({
    email: l.email.toLowerCase(),
    first_name: l.first_name,
    last_name: l.last_name,
    company_name: l.company_name,
    job_title: l.job_title,
  }))
}

/**
 * Fetch leads matching filters
 */
async function fetchFilteredLeads(
  filters: z.infer<typeof filterLeadsSchema>['filters'],
  limit: number,
  workspaceId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<LeadToImport[]> {
  let query = supabase
    .from('leads')
    .select('email, first_name, last_name, company_name, job_title')
    .eq('workspace_id', workspaceId)
    .not('email', 'is', null)
    .limit(limit)

  if (filters.industries?.length) {
    query = query.in('company_industry', filters.industries)
  }

  if (filters.company_sizes?.length) {
    query = query.in('company_size', filters.company_sizes)
  }

  if (filters.statuses?.length) {
    query = query.in('status', filters.statuses)
  }

  if (filters.query_ids?.length) {
    query = query.in('query_id', filters.query_ids)
  }

  if (filters.search) {
    const term = sanitizeSearchTerm(filters.search)
    query = query.or(
      `email.ilike.%${term}%,company_name.ilike.%${term}%,first_name.ilike.%${term}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('[Fetch Filtered Leads] Database error:', error)
    throw new Error('Failed to fetch filtered leads')
  }

  return (data || []).map((l) => ({
    email: l.email.toLowerCase(),
    first_name: l.first_name,
    last_name: l.last_name,
    company_name: l.company_name,
    job_title: l.job_title,
  }))
}

/**
 * Process lead import with deduplication
 */
async function processLeadImport(
  leads: LeadToImport[],
  campaignId: string,
  workspaceId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  previewOnly: boolean
): Promise<ImportResult> {
  const result: ImportResult = {
    total: leads.length,
    added: 0,
    duplicates: 0,
    suppressed: 0,
    in_other_campaigns: 0,
    errors: [],
  }

  // Get unique emails
  const uniqueEmails = [...new Set(leads.map((l) => l.email))]
  const emailToLead = new Map(leads.map((l) => [l.email, l]))

  // Check suppression list
  const suppressionMap = await checkBulkSuppression(uniqueEmails, workspaceId)

  // Check which emails already exist in this campaign
  const { data: existingInCampaign } = await supabase
    .from('campaign_leads')
    .select('leads!inner(email)')
    .eq('campaign_id', campaignId)

  const existingCampaignEmails = new Set(
    (existingInCampaign || []).map((cl: any) => cl.leads?.email?.toLowerCase())
  )

  // Check which emails are in other active campaigns
  const { data: inOtherCampaigns } = await supabase
    .from('campaign_leads')
    .select('leads!inner(email), campaign:email_campaigns!inner(status)')
    .neq('campaign_id', campaignId)
    .in('status', ['pending', 'enriching', 'ready', 'in_sequence', 'awaiting_approval'])

  const otherActiveCampaignEmails = new Set(
    (inOtherCampaigns || [])
      .filter((cl: any) => cl.campaign?.status === 'active')
      .map((cl: any) => cl.leads?.email?.toLowerCase())
  )

  // Categorize leads
  const leadsToAdd: LeadToImport[] = []

  for (const email of uniqueEmails) {
    const suppression = suppressionMap.get(email)

    if (suppression?.isSuppressed) {
      result.suppressed++
      continue
    }

    if (existingCampaignEmails.has(email)) {
      result.duplicates++
      continue
    }

    if (otherActiveCampaignEmails.has(email)) {
      result.in_other_campaigns++
      // Still allow adding, but track the warning
    }

    leadsToAdd.push(emailToLead.get(email)!)
  }

  result.added = leadsToAdd.length

  // If preview only, return without actually adding
  if (previewOnly || leadsToAdd.length === 0) {
    return result
  }

  // Find or create leads in the leads table
  const leadIdsToAdd: string[] = []

  for (const lead of leadsToAdd) {
    // Check if lead exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', lead.email)
      .single()

    if (existingLead) {
      leadIdsToAdd.push(existingLead.id)
    } else {
      // Create new lead
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          workspace_id: workspaceId,
          email: lead.email,
          first_name: lead.first_name,
          last_name: lead.last_name,
          company_name: lead.company_name,
          job_title: lead.job_title,
          source: 'campaign_import',
        })
        .select('id')
        .single()

      if (createError) {
        console.error('[Lead Import] Create error:', createError)
        result.errors.push(`Failed to create lead ${lead.email}`)
        result.added--
        continue
      }

      leadIdsToAdd.push(newLead.id)
    }
  }

  // Bulk insert campaign_leads
  if (leadIdsToAdd.length > 0) {
    const campaignLeadsToInsert = leadIdsToAdd.map((leadId) => ({
      campaign_id: campaignId,
      lead_id: leadId,
      status: 'pending',
    }))

    const { error: insertError } = await supabase
      .from('campaign_leads')
      .insert(campaignLeadsToInsert)

    if (insertError) {
      console.error('[Lead Import] Bulk insert error:', insertError)
      result.errors.push('Failed to add leads to campaign')
      result.added = 0
    }
  }

  return result
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
