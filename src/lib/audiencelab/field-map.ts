/**
 * Audience Labs Field Normalization
 *
 * Maps UPPER_CASE AL resolution fields → normalized identity fields.
 * Handles multi-value email/phone parsing, validation priority ranking,
 * primary email selection, and deliverability scoring.
 */

// Inline normalizeEmail/normalizePhone to avoid transitive crypto dependency
// (deduplication.service.ts imports Node.js crypto, blocking Edge runtime)

function normalizeEmail(email: string): string {
  if (!email) return ''
  const [local, domain] = email.toLowerCase().trim().split('@')
  if (!local || !domain) return email.toLowerCase().trim()
  const gmailDomains = ['gmail.com', 'googlemail.com']
  if (gmailDomains.includes(domain)) {
    return local.replace(/\./g, '') + '@' + domain
  }
  return local + '@' + domain
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }
  return digits
}

// ============ Lead-Worthiness Policy ============

/** Minimum deliverability score to create a lead from non-auth events */
export const LEAD_CREATION_SCORE_THRESHOLD = 60

/** Event types that always create leads (regardless of score) */
export const LEAD_CREATING_EVENT_TYPES = new Set([
  'authentication',
  'all_form_submissions',
  'form_submission',
])

/**
 * Determine if an event should create a lead (not just update identity).
 * - Authentication / form events always create leads.
 * - Other events require: deliverability_score >= threshold,
 *   an email (business or personal), AND a name + company.
 */
export function isLeadWorthy(params: {
  eventType: string
  deliverabilityScore: number
  hasBusinessEmail: boolean
  hasPhone: boolean
  hasName?: boolean
  hasCompany?: boolean
}): boolean {
  if (LEAD_CREATING_EVENT_TYPES.has(params.eventType)) return true
  const hasEmail = params.hasBusinessEmail || params.hasPhone
  const hasIdentity = (params.hasName ?? false) && (params.hasCompany ?? false)
  if (
    params.deliverabilityScore >= LEAD_CREATION_SCORE_THRESHOLD &&
    hasEmail &&
    hasIdentity
  ) {
    return true
  }
  return false
}

// ============ Types ============

export interface NormalizedIdentity {
  uid: string | null
  profile_id: string | null
  hem_sha256: string | null
  first_name: string | null
  last_name: string | null
  personal_emails: string[]
  business_emails: string[]
  phones: string[]
  primary_email: string | null
  company_name: string | null
  company_domain: string | null
  address1: string | null
  city: string | null
  state: string | null
  zip: string | null
  job_title: string | null
  email_validation_status: string | null
  email_last_seen: string | null
  skiptrace_match_by: string | null
  deliverability_score: number
  company_industry: string | null
  landing_url: string | null
  referrer: string | null
}

// ============ Validation Status Priority ============

/**
 * Email validation status ranking.
 * Higher score = more deliverable.
 */
const VALIDATION_STATUS_SCORES: Record<string, number> = {
  'valid (esp)': 40,
  'valid(esp)': 40,
  'valid_esp': 40,
  'valid': 30,
  'catch-all': 15,
  'catch_all': 15,
  'catchall': 15,
  'unknown': 5,
  'risky': 5,
  'invalid': 0,
  'bounce': 0,
  'disposable': 0,
}

/**
 * Get validation score for a status string.
 * Case-insensitive lookup.
 */
function getValidationScore(status: string | null | undefined): number {
  if (!status) return 5 // unknown
  const key = status.toLowerCase().trim()
  return VALIDATION_STATUS_SCORES[key] ?? 5
}

// ============ Multi-Value Parsing ============

/**
 * Split comma-separated values (AL sends multi-value fields as CSV strings).
 * Filters empty strings and normalizes each email.
 */
function parseEmailList(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map(e => e.trim())
    .filter(e => e.length > 0 && e.includes('@'))
    .map(e => normalizeEmail(e))
}

/**
 * Split comma-separated phone values and normalize.
 */
function parsePhoneList(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => normalizePhone(p))
    .filter(p => p.length >= 7) // filter out junk
}

// ============ Primary Email Selection ============

interface EmailCandidate {
  email: string
  validationScore: number
  lastSeen: Date | null
  isBusiness: boolean
}

/**
 * Choose the best primary email from all available emails.
 * Priority: validation status > last_seen freshness > business email preference.
 */
function selectPrimaryEmail(candidates: EmailCandidate[]): string | null {
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0].email

  // Sort by: validation score desc, last_seen desc, business first
  candidates.sort((a, b) => {
    // Higher validation score wins
    if (a.validationScore !== b.validationScore) {
      return b.validationScore - a.validationScore
    }
    // More recent last_seen wins
    const aTime = a.lastSeen?.getTime() ?? 0
    const bTime = b.lastSeen?.getTime() ?? 0
    if (aTime !== bTime) {
      return bTime - aTime
    }
    // Business email preferred
    if (a.isBusiness !== b.isBusiness) {
      return a.isBusiness ? -1 : 1
    }
    return 0
  })

  return candidates[0].email
}

// ============ Deliverability Score ============

/**
 * Compute deliverability score (0-100) based on:
 * - validation_status weight: Valid(Esp)=40, Valid=30, Catch-all=15, Unknown=5, Invalid=0
 * - last_seen recency: <30d=30, <90d=20, <180d=10, >180d=0
 * - skiptrace presence: +15 if match_by present, +10 if phone verified
 * - has_business_email bonus: +5
 */
export function computeDeliverabilityScore(params: {
  validationStatus: string | null | undefined
  lastSeenDate: string | null | undefined
  skiptraceMatchBy: string | null | undefined
  hasBusinessEmail: boolean
  hasPhone: boolean
}): number {
  let score = 0

  // Validation status weight (max 40)
  score += getValidationScore(params.validationStatus)

  // Last seen recency (max 30)
  if (params.lastSeenDate) {
    const lastSeen = new Date(params.lastSeenDate)
    const now = new Date()
    const daysSince = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince < 30) score += 30
    else if (daysSince < 90) score += 20
    else if (daysSince < 180) score += 10
    // >180d = 0
  }

  // Skiptrace presence (max 15)
  if (params.skiptraceMatchBy) {
    score += 15
    if (params.hasPhone) score += 10 // Phone verified via skiptrace
  }

  // Business email bonus
  if (params.hasBusinessEmail) {
    score += 5
  }

  return Math.min(score, 100)
}

// ============ Field Normalization ============

/**
 * Flatten nested AL payload objects into a single-level lookup.
 * AL payloads may nest identity fields under resolution.*, event_data.*, or event.data.*.
 * Top-level keys always win (they're checked first).
 */
function flattenPayload(raw: Record<string, any>): Record<string, any> {
  const merged: Record<string, any> = {}

  // Layer in nested sources (lowest priority first)
  const nestedSources = [
    raw.event?.data,
    raw.event_data,
    raw.resolution,
  ]
  for (const source of nestedSources) {
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      Object.assign(merged, source)
    }
  }

  // Top-level keys win (highest priority)
  Object.assign(merged, raw)

  return merged
}

/**
 * Normalize an AL payload (from any source) into a unified identity shape.
 * Accepts raw JSONB from audiencelab_events.raw.
 * Extracts fields from top-level, resolution.*, event_data.*, and event.data.*.
 */
export function normalizeALPayload(raw: Record<string, any>): NormalizedIdentity {
  // Flatten nested structures so field lookups work regardless of nesting
  const flat = flattenPayload(raw)

  // Parse multi-value email fields
  const personalEmails = parseEmailList(flat.PERSONAL_EMAILS || flat.personal_emails)
  const businessEmails = parseEmailList(flat.BUSINESS_EMAILS || flat.business_emails)

  // Handle auth event email_raw
  if (flat.email_raw) {
    const normalized = normalizeEmail(flat.email_raw)
    if (normalized && !personalEmails.includes(normalized)) {
      personalEmails.unshift(normalized)
    }
  }
  // Handle audiencesync email field
  if (flat.email) {
    const normalized = normalizeEmail(flat.email)
    if (normalized && !personalEmails.includes(normalized)) {
      personalEmails.unshift(normalized)
    }
  }

  // Parse phones
  const phones = [
    ...parsePhoneList(flat.PERSONAL_PHONE || flat.personal_phone || flat.phone),
    ...parsePhoneList(flat.MOBILE_PHONE_DNC || flat.mobile_phone_dnc),
  ]
  // Dedupe phones
  const uniquePhones = [...new Set(phones)]

  // Validation statuses
  const personalValidation = flat.PERSONAL_EMAIL_VALIDATION_STATUS || flat.personal_email_validation_status
  const businessValidation = flat.BUSINESS_EMAIL_VALIDATION_STATUS || flat.business_email_validation_status
  const personalLastSeen = flat.PERSONAL_EMAIL_LAST_SEEN_BY_ESP_DATE || flat.personal_email_last_seen_by_esp_date
  const businessLastSeen = flat.BUSINESS_EMAIL_LAST_SEEN_BY_ESP_DATE || flat.business_email_last_seen_by_esp_date

  // Build email candidates for primary selection
  const candidates: EmailCandidate[] = []

  for (const email of personalEmails) {
    candidates.push({
      email,
      validationScore: getValidationScore(personalValidation),
      lastSeen: personalLastSeen ? new Date(personalLastSeen) : null,
      isBusiness: false,
    })
  }
  for (const email of businessEmails) {
    candidates.push({
      email,
      validationScore: getValidationScore(businessValidation),
      lastSeen: businessLastSeen ? new Date(businessLastSeen) : null,
      isBusiness: true,
    })
  }

  const primaryEmail = selectPrimaryEmail(candidates)

  // Best validation status for scoring
  const bestValidation = personalValidation || businessValidation
  const bestLastSeen = personalLastSeen || businessLastSeen
  const skiptraceMatchBy = flat.SKIPTRACE_MATCH_BY || flat.skiptrace_match_by || null

  const deliverabilityScore = computeDeliverabilityScore({
    validationStatus: bestValidation,
    lastSeenDate: bestLastSeen,
    skiptraceMatchBy,
    hasBusinessEmail: businessEmails.length > 0,
    hasPhone: uniquePhones.length > 0,
  })

  return {
    uid: flat.uid || null,
    profile_id: flat.profile_id || null,
    hem_sha256: flat.hem_sha256 || flat.hem || null,
    first_name: flat.FIRST_NAME || flat.first_name || null,
    last_name: flat.LAST_NAME || flat.last_name || null,
    personal_emails: personalEmails,
    business_emails: businessEmails,
    phones: uniquePhones,
    primary_email: primaryEmail,
    company_name: flat.COMPANY_NAME || flat.company_name || flat.company || null,
    company_domain: flat.COMPANY_DOMAIN || flat.company_domain || null,
    address1: flat.PERSONAL_ADDRESS || flat.address || null,
    city: flat.PERSONAL_CITY || flat.CITY || flat.city || null,
    state: flat.STATE || flat.state || null,
    zip: flat.ZIP || flat.POSTAL_CODE || flat.zip || flat.postal_code || null,
    job_title: flat.JOB_TITLE || flat.job_title || null,
    email_validation_status: bestValidation || null,
    email_last_seen: bestLastSeen || null,
    skiptrace_match_by: skiptraceMatchBy,
    company_industry: flat.COMPANY_INDUSTRY || flat.company_industry || flat.INDUSTRY || flat.industry || null,
    deliverability_score: deliverabilityScore,
    landing_url: flat.landing_url || flat.page_url || null,
    referrer: flat.referrer || null,
  }
}

/**
 * Extract the event type from a raw SuperPixel payload.
 * Checks: event, event_type, type (all candidate keys).
 */
export function extractEventType(raw: Record<string, any>): string {
  return raw.event || raw.event_type || raw.type || 'unknown'
}

/**
 * Extract IP address from a raw payload (different key names).
 */
export function extractIpAddress(raw: Record<string, any>): string | null {
  return raw.ip_address || raw.ip || null
}

/**
 * Unwrap SuperPixel webhook payload into an array of events.
 * Handles wrapped ({ result: [...] }), array, and single-object payloads.
 */
export function unwrapWebhookPayload(payload: any): Record<string, any>[] {
  if (Array.isArray(payload)) return payload
  if (payload?.result && Array.isArray(payload.result)) return payload.result
  return [payload]
}
