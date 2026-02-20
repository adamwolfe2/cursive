/**
 * Lead Notification Service
 *
 * Handles notifications for lead assignments, including:
 * - Email notifications via Resend
 * - Future: Push notifications, SMS, etc.
 */

import { sendNewLeadEmail } from '@/lib/email'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { Lead } from '@/types'

interface UserInfo {
  email: string
  name: string | null
}

interface LeadNotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Notify a user about a new lead assignment
 */
export async function notifyUserNewLead(
  user: UserInfo,
  lead: Lead,
  matchInfo?: {
    matchedIndustry?: string | null
    matchedSic?: string | null
    matchedGeo?: string | null
  }
): Promise<LeadNotificationResult> {
  try {
    // Build lead name
    const leadName = lead.full_name ||
      [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
      'New Contact'

    // Build location string
    const locationParts = [lead.city, lead.state_code || lead.state].filter(Boolean)
    const location = locationParts.length > 0 ? locationParts.join(', ') : null

    // Build matched on string
    let matchedOn: string | null = null
    if (matchInfo) {
      const matchParts: string[] = []
      if (matchInfo.matchedIndustry) {
        matchParts.push(`Industry: ${matchInfo.matchedIndustry}`)
      }
      if (matchInfo.matchedSic) {
        matchParts.push(`SIC: ${matchInfo.matchedSic}`)
      }
      if (matchInfo.matchedGeo) {
        matchParts.push(`Location: ${matchInfo.matchedGeo}`)
      }
      if (matchParts.length > 0) {
        matchedOn = matchParts.join(' | ')
      }
    }

    const result = await sendNewLeadEmail(
      user.email,
      user.name || 'there',
      {
        name: leadName,
        company: lead.company_name,
        title: lead.job_title || lead.contact_title,
        location,
        leadId: lead.id,
      },
      matchedOn
    )

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    }
  } catch (error) {
    safeError('[LeadNotification] Failed to send notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Notify multiple users about a lead (batch notification)
 */
export async function notifyUsersNewLead(
  users: Array<UserInfo & { matchInfo?: { matchedIndustry?: string | null; matchedSic?: string | null; matchedGeo?: string | null } }>,
  lead: Lead
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(
    users.map((user) => notifyUserNewLead(user, lead, user.matchInfo))
  )

  let sent = 0
  let failed = 0
  const errors: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++
    } else {
      failed++
      const errorMsg = result.status === 'rejected'
        ? String(result.reason)
        : result.value.error || 'Unknown error'
      errors.push(`${users[index].email}: ${errorMsg}`)
    }
  })

  return { sent, failed, errors }
}
