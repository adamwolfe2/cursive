// Lead Deduplication Service
// Handles duplicate detection, hash calculation, and rejection logging

import { createAdminClient } from '@/lib/supabase/admin'

// Edge-compatible crypto helper (no Node.js 'crypto' import)
async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Rejection reason codes
export enum RejectionReason {
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_STATE = 'INVALID_STATE',
  INVALID_INDUSTRY = 'INVALID_INDUSTRY',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  DUPLICATE_SAME_PARTNER = 'DUPLICATE_SAME_PARTNER', // Same partner, same lead
  DUPLICATE_CROSS_PARTNER = 'DUPLICATE_CROSS_PARTNER', // Different partner, lead already exists
  PLATFORM_OWNED_LEAD = 'PLATFORM_OWNED_LEAD', // Trying to claim a seed/platform lead
  NO_MATCHING_WORKSPACE = 'NO_MATCHING_WORKSPACE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Rejection log entry
export interface RejectionLogEntry {
  rowNumber: number
  reason: RejectionReason
  field?: string
  value?: string
  existingLeadId?: string
  existingPartnerId?: string
  message: string
}

// Deduplication result
export interface DeduplicationResult {
  isDuplicate: boolean
  isSamePartner: boolean
  isPlatformOwned: boolean
  existingLeadId?: string
  existingPartnerId?: string
  hashKey: string
}

/**
 * Normalize email for hashing
 * - Lowercase
 * - Trim whitespace
 * - Remove dots from Gmail local part (per Gmail's dot-blindness)
 */
export function normalizeEmail(email: string): string {
  if (!email) return ''

  const [local, domain] = email.toLowerCase().trim().split('@')
  if (!local || !domain) return email.toLowerCase().trim()

  // Gmail dot-blindness: j.doe@gmail.com == jdoe@gmail.com
  const gmailDomains = ['gmail.com', 'googlemail.com']
  if (gmailDomains.includes(domain)) {
    return local.replace(/\./g, '') + '@' + domain
  }

  return local + '@' + domain
}

/**
 * Extract domain from email
 */
export function extractDomainFromEmail(email: string): string {
  if (!email) return ''
  const parts = email.toLowerCase().trim().split('@')
  return parts[1] || ''
}

/**
 * Normalize phone number for hashing
 * - Extract digits only
 * - Remove leading 1 for US numbers if 11 digits
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''

  // Extract only digits
  const digits = phone.replace(/\D/g, '')

  // If US number with leading 1 (11 digits), remove it
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }

  return digits
}

/**
 * Calculate hash key for lead deduplication
 * SHA256(lower(email) + '|' + lower(company_domain) + '|' + digits_only(phone))
 */
export async function calculateHashKey(
  email: string,
  companyDomain: string | null,
  phone: string | null
): Promise<string> {
  const normalizedEmail = normalizeEmail(email)
  const normalizedDomain = (companyDomain || extractDomainFromEmail(email)).toLowerCase().trim()
  const normalizedPhone = normalizePhone(phone)

  const hashInput = `${normalizedEmail}|${normalizedDomain}|${normalizedPhone}`

  return sha256Hex(hashInput)
}

/**
 * Check if a lead is a duplicate
 */
export async function checkDuplicate(
  email: string,
  companyDomain: string | null,
  phone: string | null,
  currentPartnerId: string
): Promise<DeduplicationResult> {
  const supabase = createAdminClient()

  const hashKey = await calculateHashKey(email, companyDomain, phone)

  // Check for existing lead with same hash
  const { data: existingLead, error } = await supabase
    .from('leads')
    .select('id, partner_id, hash_key')
    .eq('hash_key', hashKey)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected for new leads
    throw new Error(`Duplicate check failed: ${error.message}`)
  }

  if (!existingLead) {
    return {
      isDuplicate: false,
      isSamePartner: false,
      isPlatformOwned: false,
      hashKey,
    }
  }

  // Lead exists - check attribution
  const isSamePartner = existingLead.partner_id === currentPartnerId
  const isPlatformOwned = !existingLead.partner_id // No partner_id = platform-owned/seed lead

  return {
    isDuplicate: true,
    isSamePartner,
    isPlatformOwned,
    existingLeadId: existingLead.id,
    existingPartnerId: existingLead.partner_id || undefined,
    hashKey,
  }
}

/**
 * Handle same-partner duplicate (update existing lead)
 */
export async function handleSamePartnerDuplicate(
  existingLeadId: string,
  updates: {
    first_name?: string
    last_name?: string
    phone?: string
    job_title?: string
    company_name?: string
    city?: string
    state?: string
  }
): Promise<void> {
  const supabase = createAdminClient()

  // Update only if new data is provided and differs
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  // Only update fields that have new values
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && value !== null && value !== '') {
      updateData[key] = value
    }
  }

  await supabase
    .from('leads')
    .update(updateData)
    .eq('id', existingLeadId)
}

/**
 * Create rejection log for download
 */
export function createRejectionLog(rejections: RejectionLogEntry[]): string {
  if (rejections.length === 0) return ''

  const headers = ['Row', 'Reason', 'Field', 'Value', 'Message']
  const rows = rejections.map(r => [
    r.rowNumber.toString(),
    r.reason,
    r.field || '',
    r.value || '',
    r.message,
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
}

/**
 * Store rejection log for download
 */
export async function storeRejectionLog(
  uploadBatchId: string,
  rejections: RejectionLogEntry[]
): Promise<string | null> {
  if (rejections.length === 0) return null

  const supabase = createAdminClient()

  const csvContent = createRejectionLog(rejections)
  const fileName = `rejections/${uploadBatchId}.csv`

  // Store in Supabase storage
  const { data, error } = await supabase
    .storage
    .from('uploads')
    .upload(fileName, csvContent, {
      contentType: 'text/csv',
      upsert: true,
    })

  if (error) {
    console.error('Failed to store rejection log:', error)
    return null
  }

  // Get public URL
  const { data: urlData } = supabase
    .storage
    .from('uploads')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

/**
 * Batch check for duplicates (more efficient for large uploads)
 * Uses both exact hash matching and fuzzy matching for better duplicate detection
 */
export async function batchCheckDuplicates(
  leads: Array<{
    email: string
    companyDomain?: string | null
    phone?: string | null
    companyName?: string | null
  }>,
  currentPartnerId: string,
  useFuzzyMatching: boolean = true
): Promise<Map<string, DeduplicationResult>> {
  const supabase = createAdminClient()

  // Calculate hash keys for all leads
  const hashMap = new Map<string, { email: string; companyName?: string | null; index: number }>()
  const results = new Map<string, DeduplicationResult>()

  for (let index = 0; index < leads.length; index++) {
    const lead = leads[index]
    const hashKey = await calculateHashKey(lead.email, lead.companyDomain || null, lead.phone || null)
    hashMap.set(hashKey, { email: lead.email, companyName: lead.companyName, index })
    // Default to not duplicate
    results.set(lead.email, {
      isDuplicate: false,
      isSamePartner: false,
      isPlatformOwned: false,
      hashKey,
    })
  }

  // STEP 1: Check for exact hash duplicates
  const hashKeys = Array.from(hashMap.keys())

  // Batch query in chunks of 100
  const chunkSize = 100
  for (let i = 0; i < hashKeys.length; i += chunkSize) {
    const chunk = hashKeys.slice(i, i + chunkSize)

    const { data: existingLeads, error } = await supabase
      .from('leads')
      .select('id, partner_id, hash_key, email, company_name')
      .in('hash_key', chunk)
      .is('is_deleted', false) // Exclude soft-deleted leads

    if (error) {
      console.error('[Deduplication] Batch duplicate check error:', error)
      continue
    }

    // Update results for found duplicates
    for (const existing of existingLeads || []) {
      const emailInfo = hashMap.get(existing.hash_key)
      if (!emailInfo) continue

      const isSamePartner = existing.partner_id === currentPartnerId
      const isPlatformOwned = !existing.partner_id

      results.set(emailInfo.email, {
        isDuplicate: true,
        isSamePartner,
        isPlatformOwned,
        existingLeadId: existing.id,
        existingPartnerId: existing.partner_id || undefined,
        hashKey: existing.hash_key,
      })
    }
  }

  // STEP 2: Fuzzy matching for leads that weren't exact duplicates
  if (useFuzzyMatching) {
    const nonDuplicateLeads = leads.filter(lead => !results.get(lead.email)?.isDuplicate)

    for (const lead of nonDuplicateLeads) {
      try {
        // Use PostgreSQL function to find similar leads
        const { data: similarLeads, error: fuzzyError } = await supabase
          .rpc('find_similar_leads', {
            p_company_name: lead.companyName || null,
            p_email: lead.email,
            p_linkedin_url: null,
            p_similarity_threshold: 0.85, // 85% similarity
            p_workspace_id: null, // Check across all workspaces
          })

        if (fuzzyError) {
          console.error('[Deduplication] Fuzzy matching error for lead:', lead.email, fuzzyError)
          continue
        }

        // If we found a similar lead, mark as duplicate
        if (similarLeads && similarLeads.length > 0) {
          const match = similarLeads[0] // Most similar lead
          const { data: matchedLead } = await supabase
            .from('leads')
            .select('id, partner_id, hash_key')
            .eq('id', match.lead_id)
            .single()

          if (matchedLead) {
            const isSamePartner = matchedLead.partner_id === currentPartnerId
            const isPlatformOwned = !matchedLead.partner_id

            results.set(lead.email, {
              isDuplicate: true,
              isSamePartner,
              isPlatformOwned,
              existingLeadId: matchedLead.id,
              existingPartnerId: matchedLead.partner_id || undefined,
              hashKey: matchedLead.hash_key,
            })
          }
        }
      } catch (fuzzyError) {
        console.error('[Deduplication] Fuzzy matching exception for lead:', lead.email, fuzzyError)
        // Continue processing other leads even if fuzzy matching fails for one
      }
    }
  }

  return results
}

/**
 * Workspace-scoped deduplication for lead delivery paths
 * (daily distribution, onboarding, API ingest)
 *
 * Checks for duplicates by:
 * 1. Exact email match within workspace
 * 2. Name + company match within workspace (catches same person with different email)
 */
export async function checkWorkspaceDuplicates(
  workspaceId: string,
  candidates: Array<{
    email: string | null
    first_name: string | null
    last_name: string | null
    company_name: string | null
    company_domain: string | null
  }>
): Promise<Set<number>> {
  const supabase = createAdminClient()
  const duplicateIndices = new Set<number>()

  // Collect all candidate emails and name+company combos
  const candidateEmails = candidates
    .map((c) => c.email?.toLowerCase().trim())
    .filter((e): e is string => !!e)

  // Step 1: Email dedup (batch query)
  const existingEmails = new Set<string>()
  if (candidateEmails.length > 0) {
    // Query in chunks of 100
    for (let i = 0; i < candidateEmails.length; i += 100) {
      const chunk = candidateEmails.slice(i, i + 100)
      const { data: existing } = await supabase
        .from('leads')
        .select('email')
        .eq('workspace_id', workspaceId)
        .in('email', chunk)

      for (const row of existing || []) {
        if (row.email) existingEmails.add(row.email.toLowerCase())
      }
    }
  }

  // Mark email duplicates
  for (let i = 0; i < candidates.length; i++) {
    const email = candidates[i].email?.toLowerCase().trim()
    if (email && existingEmails.has(email)) {
      duplicateIndices.add(i)
    }
  }

  // Step 2: Name + company dedup for remaining candidates
  // Only check candidates not already flagged as email duplicates
  const nameCompanyCandidates = candidates
    .map((c, i) => ({ ...c, index: i }))
    .filter((c) => !duplicateIndices.has(c.index))
    .filter((c) => c.first_name && c.last_name && c.company_name)

  if (nameCompanyCandidates.length > 0) {
    // Build a set of "first|last|company" keys from existing workspace leads
    // We query by company_name first (smaller result set), then match name
    const uniqueCompanies = [...new Set(
      nameCompanyCandidates
        .map((c) => c.company_name!.toLowerCase().trim())
        .filter(Boolean)
    )]

    const existingNameCompanyKeys = new Set<string>()
    for (let i = 0; i < uniqueCompanies.length; i += 50) {
      const chunk = uniqueCompanies.slice(i, i + 50)
      const { data: existing } = await supabase
        .from('leads')
        .select('first_name, last_name, company_name')
        .eq('workspace_id', workspaceId)
        .in('company_name', chunk)

      for (const row of existing || []) {
        if (row.first_name && row.last_name && row.company_name) {
          const key = `${row.first_name.toLowerCase().trim()}|${row.last_name.toLowerCase().trim()}|${row.company_name.toLowerCase().trim()}`
          existingNameCompanyKeys.add(key)
        }
      }
    }

    // Check candidates against existing name+company keys
    for (const candidate of nameCompanyCandidates) {
      const key = `${candidate.first_name!.toLowerCase().trim()}|${candidate.last_name!.toLowerCase().trim()}|${candidate.company_name!.toLowerCase().trim()}`
      if (existingNameCompanyKeys.has(key)) {
        duplicateIndices.add(candidate.index)
      }
    }
  }

  // Step 3: Intra-batch dedup (catch duplicates within the same batch)
  const seenEmails = new Set<string>()
  const seenNameCompany = new Set<string>()
  for (let i = 0; i < candidates.length; i++) {
    if (duplicateIndices.has(i)) continue

    const email = candidates[i].email?.toLowerCase().trim()
    if (email) {
      if (seenEmails.has(email)) {
        duplicateIndices.add(i)
        continue
      }
      seenEmails.add(email)
    }

    const { first_name, last_name, company_name } = candidates[i]
    if (first_name && last_name && company_name) {
      const key = `${first_name.toLowerCase().trim()}|${last_name.toLowerCase().trim()}|${company_name.toLowerCase().trim()}`
      if (seenNameCompany.has(key)) {
        duplicateIndices.add(i)
        continue
      }
      seenNameCompany.add(key)
    }
  }

  return duplicateIndices
}

export interface DedupRejection {
  reason: 'email_match' | 'name_company_match' | 'intra_batch'
  email: string | null
  name: string | null
  company: string | null
}

/**
 * Log workspace dedup rejections to the dedup_rejections table.
 * Non-blocking — errors are silently caught to avoid disrupting lead delivery.
 */
export async function logDedupRejections(
  workspaceId: string,
  source: 'daily_distribution' | 'onboarding' | 'api_ingest',
  candidates: Array<{
    email: string | null
    first_name: string | null
    last_name: string | null
    company_name: string | null
  }>,
  duplicateIndices: Set<number>,
  batchSize: number
): Promise<void> {
  if (duplicateIndices.size === 0) return

  try {
    const supabase = createAdminClient()
    const rows = Array.from(duplicateIndices).map((i) => {
      const c = candidates[i]
      return {
        workspace_id: workspaceId,
        reason: 'dedup', // simplified — detailed reason requires tracking per-step
        source,
        rejected_email: c.email || null,
        rejected_name: c.first_name && c.last_name
          ? `${c.first_name} ${c.last_name}`
          : null,
        rejected_company: c.company_name || null,
        batch_size: batchSize,
      }
    })

    // Insert in chunks to avoid payload limits
    for (let i = 0; i < rows.length; i += 50) {
      await supabase
        .from('dedup_rejections')
        .insert(rows.slice(i, i + 50))
    }
  } catch {
    // Non-blocking — don't let logging failures disrupt lead delivery
  }
}

/**
 * Get deduplication stats for a partner
 */
export async function getPartnerDuplicateStats(partnerId: string): Promise<{
  totalLeads: number
  uniqueLeads: number
  duplicatesRejected: number
  duplicateRate: number
}> {
  const supabase = createAdminClient()

  // Get total leads uploaded by partner
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'estimated', head: true })
    .eq('partner_id', partnerId)

  // Get upload batches with duplicate counts
  const { data: batches } = await supabase
    .from('partner_upload_batches')
    .select('duplicate_rows')
    .eq('partner_id', partnerId)

  const duplicatesRejected = batches?.reduce((sum, b) => sum + (b.duplicate_rows || 0), 0) || 0

  const total = (totalLeads || 0) + duplicatesRejected
  const duplicateRate = total > 0 ? (duplicatesRejected / total) * 100 : 0

  return {
    totalLeads: totalLeads || 0,
    uniqueLeads: totalLeads || 0,
    duplicatesRejected,
    duplicateRate: Math.round(duplicateRate * 100) / 100,
  }
}
