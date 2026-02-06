// Lead Deduplication Service
// Handles duplicate detection, hash calculation, and rejection logging

import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

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
export function calculateHashKey(
  email: string,
  companyDomain: string | null,
  phone: string | null
): string {
  const normalizedEmail = normalizeEmail(email)
  const normalizedDomain = (companyDomain || extractDomainFromEmail(email)).toLowerCase().trim()
  const normalizedPhone = normalizePhone(phone)

  const hashInput = `${normalizedEmail}|${normalizedDomain}|${normalizedPhone}`

  return createHash('sha256').update(hashInput).digest('hex')
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

  const hashKey = calculateHashKey(email, companyDomain, phone)

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

  leads.forEach((lead, index) => {
    const hashKey = calculateHashKey(lead.email, lead.companyDomain || null, lead.phone || null)
    hashMap.set(hashKey, { email: lead.email, companyName: lead.companyName, index })
    // Default to not duplicate
    results.set(lead.email, {
      isDuplicate: false,
      isSamePartner: false,
      isPlatformOwned: false,
      hashKey,
    })
  })

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
