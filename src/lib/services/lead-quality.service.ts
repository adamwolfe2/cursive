/**
 * Lead Quality Gate
 *
 * Shared quality check applied at all lead insertion paths.
 * Ensures every lead delivered to users has the minimum data
 * required to be actionable: first name, last name, company, email,
 * phone, and at least a state/city for location.
 */

import type { ALEnrichedProfile } from '@/lib/audiencelab/api-client'
import { hasVerifiedEmail } from '@/lib/audiencelab/provision-helpers'
import { isVerifiedEmail } from '@/lib/audiencelab/field-map'

// AL email_validation_status values that mean "do not deliver". We only ACT on
// an unambiguously-bad status; an absent or unrecognized status falls back to
// the verified-email-presence check, so we never drop a genuinely verified lead
// just because AL omitted the status field (it is absent on many records).
const BAD_EMAIL_STATUSES = new Set([
  'invalid',
  'catch_all',
  'catch-all',
  'catchall',
  'do_not_mail',
  'do-not-mail',
  'spamtrap',
  'spam_trap',
  'abuse',
  'unknown',
])

function firstString(v: unknown): string {
  if (Array.isArray(v)) return typeof v[0] === 'string' ? v[0] : ''
  return typeof v === 'string' ? v : ''
}

export interface LeadQualityAssessment {
  /** Passes the email bar to be handed to a client. */
  deliverable: boolean
  /** Verified + deliverable but missing fields -> top-up via /enrich before insert. */
  needsEnrichment: boolean
  reason?: string
}

/**
 * Single source of truth for "can this AL record become a client-facing lead?"
 * Used by every ingestion path (audience pull, pixel pull, real-time webhook)
 * so the quality bar is identical everywhere, including the weekly refresh.
 *
 *  1. Must carry an AL-VERIFIED email (hasVerifiedEmail).
 *  2. If AL ALSO provides an explicit email_validation_status, honor an
 *     unambiguously-bad one (invalid / catch-all / spamtrap / ...).
 *  3. Verified but missing name/company/title -> deliverable, flagged for a
 *     /enrich top-up to fill the gaps before insert.
 */
export function assessLeadQuality(record: ALEnrichedProfile): LeadQualityAssessment {
  if (!hasVerifiedEmail(record)) {
    return { deliverable: false, needsEnrichment: false, reason: 'no_verified_email' }
  }

  const rec = record as Record<string, unknown>
  const status = firstString(
    rec.PERSONAL_EMAIL_VALIDATION_STATUS ??
      rec.BUSINESS_EMAIL_VALIDATION_STATUS ??
      rec.email_validation_status
  )
    .toLowerCase()
    .trim()
  if (status && !isVerifiedEmail(status) && BAD_EMAIL_STATUSES.has(status)) {
    return { deliverable: false, needsEnrichment: false, reason: `email_status_${status}` }
  }

  const hasName = !!(firstString(rec.FIRST_NAME).trim() && firstString(rec.LAST_NAME).trim())
  const hasCompany = !!firstString(rec.COMPANY_NAME).trim()
  const hasTitle = !!firstString(rec.JOB_TITLE).trim()
  const needsEnrichment = !hasName || !hasCompany || !hasTitle

  return { deliverable: true, needsEnrichment }
}

export function meetsQualityBar(lead: {
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
}): { passes: boolean; reason?: string } {
  // Name: both parts required, minimum 2 chars each
  const firstName = lead.first_name?.trim() ?? ''
  if (firstName.length < 2) return { passes: false, reason: 'missing_first_name' }
  const lastName = lead.last_name?.trim() ?? ''
  if (lastName.length < 2) return { passes: false, reason: 'missing_last_name' }

  if (!lead.company_name?.trim()) return { passes: false, reason: 'missing_company_name' }

  // Email: must be a real address (local@domain.tld, local part > 1 char)
  const emailRegex = /^[^\s@]{2,}@[^\s@]+\.[a-zA-Z]{2,}$/
  const email = lead.email?.trim() ?? ''
  if (!email || !emailRegex.test(email)) return { passes: false, reason: 'missing_email' }

  // Phone: required — users need a way to reach the lead
  const phone = lead.phone?.trim() ?? ''
  if (!phone || phone.length < 7) return { passes: false, reason: 'missing_phone' }

  // Location: at least a state or city required — "US" alone is not useful
  const hasLocation = !!(lead.city?.trim() || lead.state?.trim())
  if (!hasLocation) return { passes: false, reason: 'missing_location' }

  return { passes: true }
}
