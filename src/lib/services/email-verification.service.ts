// Email Verification Service
// Integrates with email verification providers (MillionVerifier)

import { createAdminClient } from '@/lib/supabase/admin'
import type { VerificationStatus } from '@/types/database.types'

// Configuration
const VERIFICATION_CONFIG = {
  // Provider (millionverifier, zerobounce, etc.)
  PROVIDER: 'millionverifier',

  // API settings
  API_BASE_URL: 'https://api.millionverifier.com/api/v3',

  // Batch settings
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,

  // Result mapping
  RESULT_MAPPING: {
    ok: 'valid',
    catch_all: 'catch_all',
    unknown: 'unknown',
    invalid: 'invalid',
    disposable: 'invalid',
    role: 'risky',
  } as Record<string, VerificationStatus>,
}

interface VerificationResult {
  email: string
  status: VerificationStatus
  rawResult: {
    result: string
    resultcode: number
    subresult?: string
    free?: boolean
    role?: boolean
    [key: string]: unknown
  }
}

interface BatchVerificationResult {
  results: VerificationResult[]
  successful: number
  failed: number
  errors: string[]
}

/**
 * Verify a single email address
 */
export async function verifyEmail(email: string): Promise<VerificationResult> {
  const apiKey = process.env.MILLIONVERIFIER_API_KEY

  if (!apiKey) {
    console.warn('MillionVerifier API key not configured, returning unknown status')
    return {
      email,
      status: 'unknown',
      rawResult: { result: 'unknown', resultcode: 0 },
    }
  }

  try {
    const url = `${VERIFICATION_CONFIG.API_BASE_URL}/?api=${apiKey}&email=${encodeURIComponent(email)}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Verification API error: ${response.status}`)
    }

    const data = await response.json()

    // Map result to our status
    const status = VERIFICATION_CONFIG.RESULT_MAPPING[data.result] || 'unknown'

    return {
      email,
      status,
      rawResult: data,
    }
  } catch (error) {
    console.error(`Email verification failed for ${email}:`, error)
    return {
      email,
      status: 'unknown',
      rawResult: {
        result: 'error',
        resultcode: -1,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Verify multiple emails in batch
 */
export async function verifyEmailBatch(emails: string[]): Promise<BatchVerificationResult> {
  const results: VerificationResult[] = []
  const errors: string[] = []
  let successful = 0
  let failed = 0

  // Process in batches
  for (let i = 0; i < emails.length; i += VERIFICATION_CONFIG.BATCH_SIZE) {
    const batch = emails.slice(i, i + VERIFICATION_CONFIG.BATCH_SIZE)

    // Process batch (for now, one by one - could use bulk API if available)
    for (const email of batch) {
      try {
        const result = await verifyEmail(email)
        results.push(result)

        if (result.status === 'valid' || result.status === 'catch_all') {
          successful++
        } else if (result.status === 'invalid') {
          failed++
        }
      } catch (error) {
        errors.push(`Failed to verify ${email}: ${error}`)
        failed++
      }

      // Small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  return {
    results,
    successful,
    failed,
    errors,
  }
}

/**
 * Queue leads for verification
 */
export async function queueLeadsForVerification(
  leadIds: string[],
  priority: number = 0
): Promise<number> {
  const supabase = createAdminClient()

  // Get leads with emails
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, email')
    .in('id', leadIds)
    .not('email', 'is', null)

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`)
  }

  if (!leads || leads.length === 0) {
    return 0
  }

  // Create queue entries
  const queueEntries = leads.map((lead) => ({
    lead_id: lead.id,
    email: lead.email!,
    priority,
    status: 'pending',
  }))

  const { error: insertError } = await supabase
    .from('email_verification_queue')
    .insert(queueEntries)

  if (insertError) {
    throw new Error(`Failed to queue leads: ${insertError.message}`)
  }

  return leads.length
}

/**
 * Process verification queue
 * Called by background job
 */
export async function processVerificationQueue(
  limit: number = 100
): Promise<{
  processed: number
  valid: number
  invalid: number
  catchAll: number
  unknown: number
}> {
  const supabase = createAdminClient()

  // Get pending items from queue
  const { data: queueItems, error } = await supabase
    .from('email_verification_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch queue: ${error.message}`)
  }

  if (!queueItems || queueItems.length === 0) {
    return { processed: 0, valid: 0, invalid: 0, catchAll: 0, unknown: 0 }
  }

  const stats = { processed: 0, valid: 0, invalid: 0, catchAll: 0, unknown: 0 }

  for (const item of queueItems) {
    try {
      // Mark as processing
      await supabase
        .from('email_verification_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          attempts: item.attempts + 1,
        })
        .eq('id', item.id)

      // Verify email
      const result = await verifyEmail(item.email)

      // Update queue item
      await supabase
        .from('email_verification_queue')
        .update({
          status: 'completed',
          verification_result: result.status,
          verification_provider: VERIFICATION_CONFIG.PROVIDER,
          verification_response: result.rawResult,
          completed_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      // Update lead
      await supabase
        .from('leads')
        .update({
          verification_status: result.status,
          verification_result: result.rawResult,
          verified_at: new Date().toISOString(),
          // Only list in marketplace if valid or catch_all
          is_marketplace_listed: result.status === 'valid' || result.status === 'catch_all',
        })
        .eq('id', item.lead_id)

      // Update stats
      stats.processed++
      if (result.status === 'valid') stats.valid++
      else if (result.status === 'invalid') stats.invalid++
      else if (result.status === 'catch_all') stats.catchAll++
      else stats.unknown++
    } catch (error) {
      console.error(`Error processing queue item ${item.id}:`, error)

      // Handle retry or failure
      if (item.attempts >= VERIFICATION_CONFIG.MAX_RETRIES) {
        await supabase
          .from('email_verification_queue')
          .update({
            status: 'failed',
            verification_response: {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          })
          .eq('id', item.id)
      } else {
        // Schedule retry
        const nextRetry = new Date()
        nextRetry.setMinutes(
          nextRetry.getMinutes() + Math.pow(2, item.attempts) * 5 // Exponential backoff
        )

        await supabase
          .from('email_verification_queue')
          .update({
            status: 'pending',
            next_retry_at: nextRetry.toISOString(),
          })
          .eq('id', item.id)
      }
    }
  }

  return stats
}

/**
 * Get verification queue stats
 */
export async function getQueueStats(): Promise<{
  pending: number
  processing: number
  completed: number
  failed: number
}> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('email_verification_queue')
    .select('status')

  if (error) {
    throw new Error(`Failed to fetch queue stats: ${error.message}`)
  }

  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  }

  for (const item of data || []) {
    if (item.status in stats) {
      stats[item.status as keyof typeof stats]++
    }
  }

  return stats
}

/**
 * Re-verify stale leads (for leads that haven't sold in 60+ days)
 */
export async function queueStaleLeadsForReverification(daysOld: number = 60): Promise<number> {
  const supabase = createAdminClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  // Find leads that are:
  // - Listed in marketplace
  // - Were verified more than X days ago
  // - Haven't sold
  const { data: staleLeads, error } = await supabase
    .from('leads')
    .select('id')
    .eq('is_marketplace_listed', true)
    .eq('sold_count', 0)
    .lt('verified_at', cutoffDate.toISOString())
    .limit(500)

  if (error) {
    throw new Error(`Failed to fetch stale leads: ${error.message}`)
  }

  if (!staleLeads || staleLeads.length === 0) {
    return 0
  }

  const leadIds = staleLeads.map((l) => l.id)
  return queueLeadsForVerification(leadIds, 0) // Low priority
}

/**
 * Check if email is likely valid (quick check without API call)
 */
export function isEmailFormatValid(email: string): boolean {
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return false
  }

  // Check for common invalid patterns
  const invalidPatterns = [
    /^test@/i,
    /^fake@/i,
    /^example@/i,
    /^noreply@/i,
    /^no-reply@/i,
    /@example\.com$/i,
    /@test\.com$/i,
    /\.invalid$/i,
    /\.(test|local|localhost)$/i,
  ]

  return !invalidPatterns.some((pattern) => pattern.test(email))
}
