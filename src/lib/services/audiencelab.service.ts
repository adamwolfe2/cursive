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
 * Lead data structure returned from Audience Labs
 */
export interface AudienceLabLead {
  first_name?: string
  last_name?: string
  business_verified_email?: string
  mobile?: string
  company_name?: string
  domain?: string
  title?: string
  city?: string
  state?: string
  country?: string
  industry?: string
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
 * Fetch leads from an Audience Labs segment
 *
 * @param segmentId - The segment ID from Audience Labs Studio
 * @param options - Pagination and filtering options
 * @returns Array of leads from the segment
 */
export async function fetchLeadsFromSegment(
  segmentId: string,
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

  try {
    const url = new URL(`${AUDIENCELAB_API_BASE}/segments/${segmentId}`)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('page_size', pageSize.toString())

    console.log('[AudienceLab] Fetching leads:', {
      segmentId,
      page,
      pageSize,
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
    })

    console.log('[AudienceLab] API response:', {
      status: response.status,
      statusText: response.statusText,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[AudienceLab] API error:', {
        status: response.status,
        statusText: response.statusText,
        error,
        segmentId,
      })

      // If 404, the segment doesn't exist - return empty array to prevent cron failures
      if (response.status === 404) {
        console.warn('[AudienceLab] Segment not found - returning empty array:', segmentId)
        return []
      }

      throw new Error(`Audience Labs API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // Handle different response formats (array vs object with data property)
    const leads = Array.isArray(data) ? data : (data.data || data.leads || [])

    console.log('[AudienceLab] Successfully fetched leads:', {
      segmentId,
      count: leads.length,
      sampleFields: leads[0] ? Object.keys(leads[0]).join(', ') : 'none',
    })

    return leads
  } catch (error) {
    console.error('[AudienceLab] Failed to fetch leads:', error)
    // Return empty array instead of throwing to prevent cron job failures
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
      const leadId = lead.business_verified_email || lead.domain || ''
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
