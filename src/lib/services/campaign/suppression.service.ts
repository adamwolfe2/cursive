/**
 * Email Suppression Service
 * Manages email suppression list for deliverability protection
 */

import { createClient } from '@/lib/supabase/server'

export type SuppressionReason = 'unsubscribe' | 'hard_bounce' | 'complaint' | 'manual'

export interface SuppressedEmail {
  id: string
  email: string
  reason: SuppressionReason
  suppressed_at: string
  metadata?: Record<string, unknown>
}

export interface SuppressionResult {
  isSuppressed: boolean
  reason?: SuppressionReason
  suppressedAt?: string
}

/**
 * Check if an email is on the suppression list
 */
export async function isEmailSuppressed(
  email: string,
  workspaceId: string
): Promise<SuppressionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppressed_emails')
    .select('id, reason, suppressed_at')
    .eq('email', email.toLowerCase())
    .eq('workspace_id', workspaceId)
    .single()

  if (error || !data) {
    return { isSuppressed: false }
  }

  return {
    isSuppressed: true,
    reason: data.reason as SuppressionReason,
    suppressedAt: data.suppressed_at,
  }
}

/**
 * Check multiple emails for suppression
 * Returns a map of email -> suppression status
 */
export async function checkBulkSuppression(
  emails: string[],
  workspaceId: string
): Promise<Map<string, SuppressionResult>> {
  const supabase = await createClient()
  const results = new Map<string, SuppressionResult>()

  // Initialize all as not suppressed
  for (const email of emails) {
    results.set(email.toLowerCase(), { isSuppressed: false })
  }

  if (emails.length === 0) {
    return results
  }

  const { data, error } = await supabase
    .from('suppressed_emails')
    .select('email, reason, suppressed_at')
    .eq('workspace_id', workspaceId)
    .in('email', emails.map((e) => e.toLowerCase()))

  if (error || !data) {
    return results
  }

  for (const row of data) {
    results.set(row.email.toLowerCase(), {
      isSuppressed: true,
      reason: row.reason as SuppressionReason,
      suppressedAt: row.suppressed_at,
    })
  }

  return results
}

/**
 * Add an email to the suppression list
 */
export async function addToSuppressionList(
  email: string,
  workspaceId: string,
  reason: SuppressionReason,
  options?: {
    campaignId?: string
    leadId?: string
    metadata?: Record<string, unknown>
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppressed_emails')
    .upsert(
      {
        workspace_id: workspaceId,
        email: email.toLowerCase(),
        reason,
        source_campaign_id: options?.campaignId,
        source_lead_id: options?.leadId,
        metadata: options?.metadata || {},
        suppressed_at: new Date().toISOString(),
      },
      {
        onConflict: 'workspace_id,email',
      }
    )
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, id: data.id }
}

/**
 * Remove an email from the suppression list
 */
export async function removeFromSuppressionList(
  email: string,
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('suppressed_emails')
    .delete()
    .eq('email', email.toLowerCase())
    .eq('workspace_id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get suppression list for a workspace
 */
export async function getSuppressionList(
  workspaceId: string,
  options?: {
    reason?: SuppressionReason
    limit?: number
    offset?: number
  }
): Promise<{ data: SuppressedEmail[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('suppressed_emails')
    .select('id, email, reason, suppressed_at, metadata', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('suppressed_at', { ascending: false })

  if (options?.reason) {
    query = query.eq('reason', options.reason)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options?.limit || 50) - 1)
  }

  const { data, count, error } = await query

  if (error) {
    return { data: [], total: 0 }
  }

  return {
    data: (data || []) as SuppressedEmail[],
    total: count || 0,
  }
}

/**
 * Filter out suppressed emails from a list
 * Returns only the emails that are NOT suppressed
 */
export async function filterSuppressedEmails(
  emails: string[],
  workspaceId: string
): Promise<string[]> {
  const suppressionMap = await checkBulkSuppression(emails, workspaceId)

  return emails.filter((email) => {
    const result = suppressionMap.get(email.toLowerCase())
    return !result?.isSuppressed
  })
}
