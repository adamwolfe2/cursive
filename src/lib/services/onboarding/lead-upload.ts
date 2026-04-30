// Lead Upload Service
// Loads leads from a client's uploaded CSV file and uploads them to EmailBison campaigns.

import Papa from 'papaparse'
import { createAdminClient } from '@/lib/supabase/server'
import { addLeadsToCampaign } from '@/lib/integrations/emailbison'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import type { EmailBisonLead } from '@/lib/integrations/emailbison'

// Re-export for use in the route
export type { EmailBisonLead }

const MAX_LEADS = 50_000
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// Header aliases — maps normalized lowercase header → canonical field
const EMAIL_ALIASES = new Set(['email', 'email_address', 'email address'])
const FIRST_NAME_ALIASES = new Set(['first_name', 'firstname', 'first name', 'first', 'fname'])
const LAST_NAME_ALIASES = new Set(['last_name', 'lastname', 'last name', 'last', 'lname'])
const COMPANY_ALIASES = new Set(['company', 'company_name', 'company name', 'organization'])

type ColumnRole = 'email' | 'first_name' | 'last_name' | 'company_name' | 'custom'

function classifyHeader(header: string): ColumnRole {
  const normalized = header.trim().toLowerCase()
  if (EMAIL_ALIASES.has(normalized)) return 'email'
  if (FIRST_NAME_ALIASES.has(normalized)) return 'first_name'
  if (LAST_NAME_ALIASES.has(normalized)) return 'last_name'
  if (COMPANY_ALIASES.has(normalized)) return 'company_name'
  return 'custom'
}

/**
 * Load leads for a client from their uploaded CSV file in Supabase storage.
 * Returns an empty array if no existing_list file is found.
 */
export async function loadLeadsForClient(clientId: string): Promise<EmailBisonLead[]> {
  const supabase = createAdminClient()

  // Find the most recently created existing_list file for this client
  const { data: fileRow, error: fileErr } = await supabase
    .from('client_files')
    .select('id, storage_path, file_name')
    .eq('client_id', clientId)
    .eq('file_type', 'existing_list')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fileErr) {
    safeError(`[lead-upload] DB error fetching client_files for ${clientId}: ${fileErr.message}`)
    return []
  }

  if (!fileRow) {
    safeLog(`[lead-upload] No existing_list file found for client ${clientId}`)
    return []
  }

  // Download from Supabase storage
  const { data: fileData, error: downloadErr } = await supabase.storage
    .from('client-uploads')
    .download(fileRow.storage_path)

  if (downloadErr || !fileData) {
    safeError(
      `[lead-upload] Failed to download ${fileRow.storage_path}: ${downloadErr?.message ?? 'no data'}`
    )
    return []
  }

  const csvText = await fileData.text()

  // Parse CSV
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (parsed.errors.length > 0) {
    safeLog(`[lead-upload] CSV parse warnings for ${fileRow.storage_path}: ${parsed.errors.length} error(s)`)
  }

  const rows = parsed.data
  const totalRows = rows.length

  if (totalRows === 0) {
    safeLog(`[lead-upload] CSV is empty for client ${clientId}`)
    return []
  }

  if (totalRows > MAX_LEADS) {
    safeLog(
      `[lead-upload] WARNING: CSV has ${totalRows} rows — capping at ${MAX_LEADS} for client ${clientId}`
    )
  }

  const cappedRows = rows.slice(0, MAX_LEADS)

  // Build column role map from first row's keys (headers)
  const headers = Object.keys(cappedRows[0] ?? {})
  const roleMap = new Map<string, ColumnRole>()
  for (const h of headers) {
    roleMap.set(h, classifyHeader(h))
  }

  const leads: EmailBisonLead[] = []

  for (const row of cappedRows) {
    let email = ''
    let firstName = ''
    let lastName = ''
    let companyName = ''
    const customVariables: Array<{ name: string; value: string }> = []

    for (const [header, role] of roleMap.entries()) {
      const val = (row[header] ?? '').trim()
      if (role === 'email') {
        email = val
      } else if (role === 'first_name') {
        firstName = val
      } else if (role === 'last_name') {
        lastName = val
      } else if (role === 'company_name') {
        companyName = val
      } else if (role === 'custom' && val !== '') {
        customVariables.push({ name: header, value: val })
      }
    }

    // Skip rows with no email or invalid email
    if (!email || !EMAIL_REGEX.test(email)) continue

    const lead: EmailBisonLead = { email }
    if (firstName) lead.first_name = firstName
    if (lastName) lead.last_name = lastName
    if (companyName) lead.company_name = companyName
    if (customVariables.length > 0) lead.custom_variables = customVariables

    leads.push(lead)
  }

  safeLog(
    `[lead-upload] Parsed ${leads.length} valid leads from ${totalRows} rows for client ${clientId}`
  )

  return leads
}

export interface CampaignUploadResult {
  campaignId: string
  added: number
  skipped: number
  error?: string
}

/**
 * Upload leads to each campaign, with a 500ms delay between campaigns.
 * Errors on individual campaigns are caught so one failure doesn't abort the rest.
 */
export async function uploadLeadsToCampaigns(
  campaignIds: string[],
  leads: EmailBisonLead[],
  ebWorkspaceId: number | null | undefined
): Promise<CampaignUploadResult[]> {
  const results: CampaignUploadResult[] = []

  for (let i = 0; i < campaignIds.length; i++) {
    const campaignId = campaignIds[i]

    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    try {
      const { added, skipped } = await addLeadsToCampaign(
        campaignId,
        leads,
        ebWorkspaceId ?? undefined
      )
      results.push({ campaignId, added, skipped })
      safeLog(`[lead-upload] campaign=${campaignId} added=${added} skipped=${skipped}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      safeError(`[lead-upload] campaign=${campaignId} upload error: ${msg}`)
      results.push({ campaignId, added: 0, skipped: 0, error: msg })
    }
  }

  return results
}
