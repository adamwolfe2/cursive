/**
 * Audience Labs API Service
 *
 * Integrates with Audience Labs Persistent API to fetch leads from custom segments.
 * Documentation: https://github.com/adamwolfe2/cursive/blob/main/docs/audiencelab-faq.md
 */

const AUDIENCELAB_API_BASE = 'https://api.audiencelab.io'
const API_KEY = process.env.AUDIENCELAB_ACCOUNT_API_KEY

if (!API_KEY) {
  throw new Error('AUDIENCELAB_ACCOUNT_API_KEY not configured')
}

/**
 * Available audience from Audience Labs
 */
export interface AudienceLabAudience {
  id: string
  name: string
  next_scheduled_refresh: string | null
  refresh_interval: string | null
  scheduled_refresh: boolean
  webhook_url: string | null
}

/**
 * Lead data structure returned from Audience Labs
 * Note: Field names are in UPPERCASE as returned by the API
 */
export interface AudienceLabLead {
  FIRST_NAME?: string
  LAST_NAME?: string
  BUSINESS_VERIFIED_EMAILS?: string[]
  PERSONAL_VERIFIED_EMAILS?: string[]
  BUSINESS_EMAIL?: string
  PERSONAL_EMAILS?: string[]
  MOBILE_PHONE?: string
  DIRECT_NUMBER?: string
  PERSONAL_PHONE?: string
  COMPANY_PHONE?: string
  COMPANY_NAME?: string
  COMPANY_DOMAIN?: string
  JOB_TITLE?: string
  HEADLINE?: string
  COMPANY_CITY?: string
  COMPANY_STATE?: string
  COMPANY_ZIP?: string
  PERSONAL_CITY?: string
  PERSONAL_STATE?: string
  PERSONAL_ZIP?: string
  COMPANY_INDUSTRY?: string
  COMPANY_EMPLOYEE_COUNT?: string
  COMPANY_REVENUE?: string
  LINKEDIN_URL?: string
  COMPANY_LINKEDIN_URL?: string
  UUID?: string
  // ... many more fields available, these are the most commonly used
}

/**
 * Segment filter criteria for matching users to segments
 */
export interface SegmentCriteria {
  industries?: string[]  // e.g., ["roofing", "construction", "home_services"]
  locations?: string[]   // e.g., ["dallas", "fort_worth", "dfw"]
  titles?: string[]      // e.g., ["owner", "manager", "director"]
}

/**
 * List all available audiences from Audience Labs account
 *
 * @returns Array of all audiences available to this account
 */
export async function listAllAudiences(): Promise<AudienceLabAudience[]> {
  try {
    console.log('[AudienceLab] Fetching all audiences')

    const response = await fetch(`${AUDIENCELAB_API_BASE}/audiences`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[AudienceLab] Failed to list audiences:', error)
      return []
    }

    const result = await response.json()
    const audiences = result.data || result

    console.log('[AudienceLab] Found audiences:', audiences.length)
    return audiences
  } catch (error) {
    console.error('[AudienceLab] Error listing audiences:', error)
    return []
  }
}

/**
 * Score a lead's data completeness on a 0-100 scale.
 * Higher score = more enriched = higher priority for delivery.
 *
 * Scoring weights reflect the real-world value of each field for outreach:
 *   - Verified email is king (deliverable + GDPR-safe)
 *   - Mobile phone is next (direct dial / SMS)
 *   - Full name enables personalization
 *   - LinkedIn enables research before outreach
 *   - Company details provide context for the pitch
 */
export function scoreLeadCompleteness(lead: AudienceLabLead): number {
  let score = 0

  // === EMAIL (up to 30 pts) ===
  // Verified emails are deliverable — worth far more than raw/unverified
  if (lead.BUSINESS_VERIFIED_EMAILS && lead.BUSINESS_VERIFIED_EMAILS.length > 0) score += 30
  else if (lead.PERSONAL_VERIFIED_EMAILS && lead.PERSONAL_VERIFIED_EMAILS.length > 0) score += 25
  else if (lead.BUSINESS_EMAIL) score += 12

  // === NAME (up to 15 pts) ===
  if (lead.FIRST_NAME && lead.LAST_NAME) score += 15
  else if (lead.FIRST_NAME || lead.LAST_NAME) score += 5

  // === PHONE (up to 12 pts) ===
  // Mobile/direct lines are most valuable for outreach
  if (lead.MOBILE_PHONE) score += 12
  else if (lead.DIRECT_NUMBER) score += 10
  else if (lead.PERSONAL_PHONE) score += 8
  else if (lead.COMPANY_PHONE) score += 4

  // === COMPANY (up to 8 pts) ===
  if (lead.COMPANY_NAME) score += 8

  // === JOB TITLE (up to 7 pts) ===
  if (lead.JOB_TITLE) score += 7
  else if (lead.HEADLINE) score += 4

  // === LINKEDIN (up to 8 pts) ===
  // LinkedIn enables research, enrichment, and multi-channel outreach
  if (lead.LINKEDIN_URL) score += 8

  // === LOCATION (up to 5 pts) ===
  if (lead.COMPANY_CITY && lead.COMPANY_STATE) score += 5
  else if (lead.PERSONAL_CITY && lead.PERSONAL_STATE) score += 4
  else if (lead.COMPANY_STATE || lead.PERSONAL_STATE) score += 2

  // === COMPANY ENRICHMENT (up to 11 pts) ===
  if (lead.COMPANY_DOMAIN) score += 5
  if (lead.COMPANY_EMPLOYEE_COUNT) score += 3
  if (lead.COMPANY_REVENUE) score += 3

  return score  // max ~104, effectively 0-100
}

/**
 * Minimum completeness score for a lead to be delivered.
 * Score of 20 means at minimum: has an email OR (name + phone), etc.
 * Leads below this threshold are incomplete and not worth sending.
 */
const MIN_LEAD_SCORE = 20

/**
 * Fetch leads from an Audience Labs audience.
 * Automatically fetches a larger pool and returns the most enriched leads first.
 *
 * @param audienceId - The audience ID from Audience Labs
 * @param options - Pagination and filtering options
 * @returns Array of leads, sorted best-data-first, trimmed to pageSize
 */
export async function fetchLeadsFromSegment(
  audienceId: string,
  options: {
    page?: number
    pageSize?: number
    excludeIds?: string[]
  } = {}
): Promise<AudienceLabLead[]> {
  const {
    page = 1,
    pageSize = 50,
  } = options

  // Fetch 3x the requested amount so we can score and pick the best ones.
  // Capped at 500 to keep response times reasonable.
  const fetchSize = Math.min(pageSize * 3, 500)

  try {
    const url = new URL(`${AUDIENCELAB_API_BASE}/audiences/${audienceId}`)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('page_size', fetchSize.toString())

    console.log('[AudienceLab] Fetching leads for quality sort:', {
      audienceId,
      page,
      requested: pageSize,
      fetching: fetchSize,
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[AudienceLab] API error:', {
        status: response.status,
        statusText: response.statusText,
        error,
        audienceId,
      })

      if (response.status === 404) {
        console.warn('[AudienceLab] Audience not found:', audienceId)
        return []
      }

      throw new Error(`Audience Labs API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const rawLeads: AudienceLabLead[] = Array.isArray(data) ? data : (data.data || data.leads || [])

    // Score every lead and sort best-first
    const scoredLeads = rawLeads
      .map(lead => ({ lead, score: scoreLeadCompleteness(lead) }))
      .filter(({ score }) => score >= MIN_LEAD_SCORE)       // drop low-quality records
      .sort((a, b) => b.score - a.score)                   // best data first

    const topLeads = scoredLeads.slice(0, pageSize).map(({ lead }) => lead)

    const avgScore = scoredLeads.length > 0
      ? Math.round(scoredLeads.reduce((sum, { score }) => sum + score, 0) / scoredLeads.length)
      : 0

    console.log('[AudienceLab] Quality sort complete:', {
      audienceId,
      fetched: rawLeads.length,
      qualified: scoredLeads.length,
      returning: topLeads.length,
      avgScore,
      topScore: scoredLeads[0]?.score ?? 0,
    })

    return topLeads
  } catch (error) {
    console.error('[AudienceLab] Failed to fetch leads:', error)
    return []
  }
}

/**
 * Get segment ID for a user based on their industry and location
 *
 * NOTE: This is a placeholder implementation.
 * In production, you should:
 * 1. Create segments in Audience Labs Studio for each industry/location combo
 * 2. Store segment mappings in your database
 * 3. Query the mapping to get the correct segment ID
 *
 * Example mapping structure:
 * {
 *   "roofing_dallas": "SEGMENT_ID_123",
 *   "plumbing_houston": "SEGMENT_ID_456",
 *   "contractor_austin": "SEGMENT_ID_789"
 * }
 */
export function getSegmentIdForCriteria(
  industry: string,
  location: string
): string | null {
  // TODO: Replace with actual segment mapping from database
  const segmentMap: Record<string, string> = {
    'roofing_dallas': 'YOUR_ROOFING_DALLAS_SEGMENT_ID',
    'plumbing_houston': 'YOUR_PLUMBING_HOUSTON_SEGMENT_ID',
    'contractor_austin': 'YOUR_CONTRACTOR_AUSTIN_SEGMENT_ID',
    // Add more mappings as you create segments in Audience Labs
  }

  const key = `${industry.toLowerCase()}_${location.toLowerCase().replace(/\s+/g, '_')}`
  return segmentMap[key] || null
}

/**
 * Fetch daily leads for a user based on their profile
 *
 * @param userId - User ID
 * @param criteria - User's segment criteria (industry, location)
 * @param limit - Number of leads to fetch
 * @param excludeIds - Array of lead IDs already received (to avoid duplicates)
 * @returns Array of fresh leads
 */
export async function fetchDailyLeadsForUser(
  userId: string,
  criteria: {
    industry: string
    location: string
  },
  limit: number = 10,
  excludeIds: string[] = []
): Promise<AudienceLabLead[]> {
  const segmentId = getSegmentIdForCriteria(criteria.industry, criteria.location)

  if (!segmentId) {
    console.warn('[AudienceLab] No segment found for criteria:', criteria)
    return []
  }

  console.log('[AudienceLab] Fetching daily leads for user:', {
    userId,
    criteria,
    segmentId,
    limit,
  })

  const pageSize = Math.min(limit * 2, 100) // Fetch extra to account for filtering
  const leads = await fetchLeadsFromSegment(segmentId, {
    page: 1,
    pageSize,
    excludeIds,
  })

  // Filter out leads already received and limit to requested amount
  const filteredLeads = leads
    .filter(lead => {
      // Use the first verified email or domain as unique identifier
      const email = lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL
      const leadId = email || lead.COMPANY_DOMAIN || lead.UUID || ''
      return !excludeIds.includes(leadId)
    })
    .slice(0, limit)

  console.log('[AudienceLab] Filtered leads:', {
    total: leads.length,
    filtered: filteredLeads.length,
    limit,
  })

  return filteredLeads
}
