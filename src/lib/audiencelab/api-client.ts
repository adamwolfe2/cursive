/**
 * AudienceLab REST API Client
 *
 * Thin client for the AL REST API (https://api.audiencelab.io).
 * Complements the existing webhook/push pipeline with pull capabilities:
 *
 * - Pixel provisioning: create pixels programmatically for B2B customers
 * - Audience listing: inventory available audiences
 * - On-demand enrichment: enrich/lookup profiles by filter criteria
 * - Audience builder: create segment queries and pull records at scale
 *
 * Auth: X-Api-Key header via AUDIENCELAB_ACCOUNT_API_KEY env var
 * Existing webhook pipeline remains the canonical ingestion path.
 *
 * Response shapes verified against live API (2026-02-10).
 */

import { fetchWithTimeout } from '@/lib/utils/retry'

// ============================================================================
// CONFIGURATION
// ============================================================================

const AL_API_BASE_URL = process.env.AUDIENCELAB_API_URL || 'https://api.audiencelab.io'
const AL_API_KEY = process.env.AUDIENCELAB_ACCOUNT_API_KEY || ''
const AL_API_TIMEOUT = 30000

// ============================================================================
// TYPES — Verified against live API responses
// ============================================================================

export interface ALPixelCreateRequest {
  websiteName: string
  websiteUrl: string
  webhookUrl?: string
}

export interface ALPixelCreateResponse {
  pixel_id: string
  install_url: string
  script?: string
  website_name: string
  website_url: string
  webhook_url?: string
  created_at?: string
}

/** Pixel object as returned by GET /pixels */
export interface ALPixel {
  id: string
  website_name: string
  website_url: string
  install_url?: string
  webhook_url?: string
  last_sync_status?: string
  last_sync_count?: number
  last_sync_start?: string
  last_sync_end?: string
  last_sync_duration?: number
  last_error_message?: string | null
}

/** Audience object as returned by GET /audiences */
export interface ALAudience {
  id: string
  name: string
  next_scheduled_refresh?: string | null
  refresh_interval?: string | null
  scheduled_refresh?: boolean
  webhook_url?: string | null
  [key: string]: unknown
}

/** Paginated list response (used by /pixels and /audiences) */
export interface ALPaginatedResponse<T> {
  data: T[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type ALAudienceListResponse = ALPaginatedResponse<ALAudience>

export interface ALEnrichFilter {
  email?: string
  first_name?: string
  last_name?: string
  company?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
}

export interface ALEnrichRequest {
  filter: ALEnrichFilter
  fields?: string[]
}

/** Enrich response: { timestamp, found, result: [...] } */
export interface ALEnrichResult {
  timestamp?: number
  found: number
  result: ALEnrichedProfile[]
}

/**
 * Enriched profile record from audience fetch or enrichment.
 * Uses UPPER_CASE field names matching AL's data format.
 */
export interface ALEnrichedProfile {
  // Identity
  UUID?: string
  FIRST_NAME?: string
  LAST_NAME?: string

  // Contact
  PERSONAL_EMAILS?: string
  BUSINESS_EMAIL?: string
  PERSONAL_PHONE?: string
  MOBILE_PHONE?: string
  MOBILE_PHONE_DNC?: string
  DIRECT_NUMBER?: string
  DIRECT_NUMBER_DNC?: string

  // Company
  COMPANY_NAME?: string
  COMPANY_DOMAIN?: string
  COMPANY_INDUSTRY?: string
  COMPANY_SIC?: string
  COMPANY_NAICS?: string
  COMPANY_ADDRESS?: string
  COMPANY_CITY?: string
  COMPANY_STATE?: string
  COMPANY_ZIP?: string
  COMPANY_PHONE?: string
  COMPANY_EMPLOYEE_COUNT?: string
  COMPANY_REVENUE?: string
  COMPANY_LINKEDIN_URL?: string

  // Personal
  JOB_TITLE?: string
  DEPARTMENT?: string
  SENIORITY_LEVEL?: string
  PERSONAL_ADDRESS?: string
  PERSONAL_CITY?: string
  PERSONAL_STATE?: string
  PERSONAL_ZIP?: string
  PERSONAL_ZIP4?: string

  // Demographics
  GENDER?: string
  AGE_RANGE?: string
  INCOME_RANGE?: string
  NET_WORTH?: string
  HOMEOWNER?: string
  MARRIED?: string
  CHILDREN?: string

  // Skiptrace
  SKIPTRACE_NAME?: string
  SKIPTRACE_ADDRESS?: string
  SKIPTRACE_CITY?: string
  SKIPTRACE_STATE?: string
  SKIPTRACE_ZIP?: string
  SKIPTRACE_MATCH_SCORE?: number | string
  SKIPTRACE_CREDIT_RATING?: string
  SKIPTRACE_WIRELESS_NUMBERS?: string
  SKIPTRACE_IP?: string
  SKIPTRACE_B2B_ADDRESS?: string
  SKIPTRACE_B2B_PHONE?: string
  SKIPTRACE_B2B_WEBSITE?: string

  // Verified
  PERSONAL_VERIFIED_EMAILS?: string | null
  BUSINESS_VERIFIED_EMAILS?: string | null
  SHA256_PERSONAL_EMAIL?: string
  SHA256_BUSINESS_EMAIL?: string

  // Catch-all for additional fields
  [key: string]: unknown
}

// --- Audience Segment API filter types (nested schema) ---
// Source: AudienceLab Audience Segment API (POST /audiences/preview + POST /audiences)

/** Business/professional targeting filters */
export interface ALAudienceBusinessFilter {
  jobTitle?: string[]
  seniority?: Array<'C-Suite' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor' | 'Entry Level'>
  department?: string[]
  /** Industry name strings — 130+ values available via GET /audiences/attributes/industries */
  industry?: string[]
  sic?: string[]
  naics?: string[]
  employeeCount?: { min?: number; max?: number }
  companyRevenue?: { min?: number; max?: number }
}

/** Financial targeting filters */
export interface ALAudienceFinancialFilter {
  incomeRange?: string[]  // e.g. ["$50K-$75K", "$75K-$100K", "$100K-$150K"]
  netWorth?: string[]
  credit_rating?: Array<'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor'>
}

/** Housing/property targeting filters */
export interface ALAudienceHousingFilter {
  homeowner?: boolean
  homeValue?: { min?: number; max?: number }
  lengthOfResidence?: number  // years at current address
}

/** Personal/demographic targeting filters */
export interface ALAudiencePersonalFilter {
  ageRange?: { min?: number; max?: number }
  gender?: Array<'M' | 'F'>
  ethnic_code?: string[]
  education?: string[]  // e.g. ["Bachelor's Degree", "Graduate Degree"]
}

/** Family/household targeting filters */
export interface ALAudienceFamilyFilter {
  married?: boolean
  children?: boolean
  numberOfChildren?: number
}

/** Geographic targeting filters — state uses 2-letter codes */
export interface ALAudienceLocationFilter {
  city?: string[]
  state?: string[]  // 2-letter codes: ["TX", "CA", "FL"]
  zip?: string[]
}

/**
 * Full nested filter set for the Audience Segment API.
 * Use this with previewAudience() and createAudience().
 * All fields are optional — omit to match all.
 */
export interface ALAudienceSegmentFilters {
  business?: ALAudienceBusinessFilter
  financial?: ALAudienceFinancialFilter
  housing?: ALAudienceHousingFilter
  personal?: ALAudiencePersonalFilter
  family?: ALAudienceFamilyFilter
  location?: ALAudienceLocationFilter
}

/**
 * @deprecated Use ALAudienceSegmentFilters with nested business/location/etc.
 * Kept for backward compatibility with legacy code.
 */
export interface ALAudienceFilter {
  segment?: string[] | number[]
  industries?: string[]
  departments?: string[]
  seniority?: string[]
  sic?: string[]
  city?: string[]
  state?: string[]
  zip?: string[]
  days_back?: number
  [key: string]: unknown
}

/**
 * POST /audiences — Create a named audience segment.
 * Returns { audienceId } for fetching paginated records.
 */
export interface ALAudienceCreateRequest {
  name: string
  filters: ALAudienceSegmentFilters
  description?: string
}

/** POST /audiences returns { audienceId: "uuid" } */
export interface ALAudienceCreateResponse {
  audienceId: string
  [key: string]: unknown
}

/**
 * POST /audiences/preview — Preview count + sample without creating.
 * days_back: 1–10 (required), limit: 0–500, score: include quality scores,
 * include_dnc: include DNC-flagged contacts.
 */
export interface ALAudiencePreviewRequest {
  days_back: number
  filters?: ALAudienceSegmentFilters
  /** Segment ID from al_segment_catalog. Sent as string to AL API. */
  segment?: number | string
  limit?: number  // 0–500 sample records to return
  score?: boolean
  include_dnc?: boolean
}

/** POST /audiences/preview returns { job_id, result: [...], count, field_coverage } */
export interface ALAudiencePreviewResponse {
  job_id?: string
  count: number
  result?: ALEnrichedProfile[]
  field_coverage?: Record<string, number>
  [key: string]: unknown
}

/** GET /audiences/{id} returns paginated records in { data: [...] } */
export interface ALAudienceRecordsResponse {
  data: ALEnrichedProfile[]
  total_records: number
  page: number
  page_size: number
  total_pages: number
  [key: string]: unknown
}

/** Attribute value shape from GET /audiences/attributes/{attr} */
export interface ALAttributeValue {
  id?: number | string
  name?: string
  b2b?: boolean
  [key: string]: unknown
}

// --- Batch Enrichment types ---

export interface ALBatchEnrichRecord {
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  company_domain?: string
  linkedin_url?: string
  [key: string]: unknown
}

export interface ALBatchEnrichRequest {
  records: ALBatchEnrichRecord[]
  fields?: string[]
}

export interface ALBatchEnrichResponse {
  jobId: string
  status: string
  total?: number
  [key: string]: unknown
}

export interface ALBatchEnrichStatusResponse {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total?: number
  processed?: number
  result?: ALEnrichedProfile[]
  [key: string]: unknown
}

// ============================================================================
// API CLIENT
// ============================================================================

export class AudienceLabApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: unknown
  ) {
    super(message)
    this.name = 'AudienceLabApiError'
  }
}

/**
 * Thrown when AL API returns a suspiciously large unfiltered audience response.
 * This indicates the server-side filters were ignored and all records are global.
 */
export class AudienceLabUnfilteredError extends Error {
  constructor(public totalRecords: number) {
    super(`Likely unfiltered AL response: ${totalRecords.toLocaleString()} records exceeds safety threshold`)
    this.name = 'AudienceLabUnfilteredError'
  }
}

/**
 * If total_records from fetchAudienceRecords() exceeds this threshold,
 * the API likely returned all global records without applying filters.
 * AL's total audience is ~500k — anything above 100k is treated as unfiltered.
 */
export const UNFILTERED_RECORDS_THRESHOLD = 100_000

/**
 * If a preview count from previewAudience() exceeds this threshold,
 * the segment is likely unfiltered. Skip processing to avoid garbage data.
 */
export const UNFILTERED_PREVIEW_THRESHOLD = 50_000

async function alFetch<T = unknown>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  if (!AL_API_KEY) {
    throw new Error('AUDIENCELAB_ACCOUNT_API_KEY not configured')
  }

  const { timeout = AL_API_TIMEOUT, ...fetchOptions } = options

  const url = `${AL_API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const response = await fetchWithTimeout(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': AL_API_KEY,
      ...fetchOptions.headers,
    },
    timeout,
  })

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = await response.text().catch(() => null)
    }
    throw new AudienceLabApiError(
      `AudienceLab API error: ${response.status} ${response.statusText}`,
      response.status,
      body
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

// ============================================================================
// PIXEL MANAGEMENT
// ============================================================================

/**
 * Create a new SuperPixel for a customer's website.
 * The returned pixel_id should be stored in audiencelab_pixels for routing.
 */
export async function createPixel(params: ALPixelCreateRequest): Promise<ALPixelCreateResponse> {
  return alFetch<ALPixelCreateResponse>('/pixels', {
    method: 'POST',
    body: JSON.stringify({
      websiteName: params.websiteName,
      websiteUrl: params.websiteUrl,
      webhookUrl: params.webhookUrl,
    }),
  })
}

/**
 * List all pixels on the account.
 * API returns { data: [...], page, page_size, total, total_pages }
 */
export async function listPixels(): Promise<ALPixel[]> {
  const response = await alFetch<ALPaginatedResponse<ALPixel>>('/pixels', {
    method: 'GET',
  })
  return response.data || []
}

// ============================================================================
// AUDIENCE MANAGEMENT
// ============================================================================

/**
 * List available audiences with optional pagination.
 * API returns { data: [...], page, page_size, total, total_pages }
 */
export async function listAudiences(params?: {
  page?: number
  page_size?: number
}): Promise<ALAudienceListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.page_size) searchParams.set('page_size', String(params.page_size))

  const query = searchParams.toString()
  const endpoint = query ? `/audiences?${query}` : '/audiences'

  return alFetch<ALAudienceListResponse>(endpoint, { method: 'GET' })
}

// ============================================================================
// ENRICHMENT
// ============================================================================

/**
 * Enrich/lookup profiles by filter criteria.
 * Returns matched profiles from AL's 280M+ consumer database.
 * API returns { timestamp, found, result: [...] }
 */
export async function enrich(params: ALEnrichRequest): Promise<ALEnrichResult> {
  return alFetch<ALEnrichResult>('/enrich', {
    method: 'POST',
    body: JSON.stringify({
      filter: params.filter,
      ...(params.fields && { fields: params.fields }),
    }),
  })
}

// ============================================================================
// AUDIENCE BUILDER (segment queries → pull leads at scale)
// ============================================================================

/**
 * Discover available attribute values for audience building.
 * API returns { attributes: { [attr]: { count, data: [...] } } }
 *
 * e.g., getAudienceAttributes('segments') → list of segment objects
 *       getAudienceAttributes('industries') → available industry strings
 */
export async function getAudienceAttributes(
  attribute: 'segments' | 'industries' | 'departments' | 'seniority' | 'sic' | string
): Promise<ALAttributeValue[]> {
  const response = await alFetch<Record<string, unknown>>(
    `/audiences/attributes/${attribute}`,
    { method: 'GET' }
  )

  // Actual shape: { attributes: { [attr]: { count, data: [...] } } }
  const attrs = response.attributes as Record<string, { count?: number; data?: ALAttributeValue[] }> | undefined
  if (attrs && attrs[attribute]?.data) {
    return attrs[attribute].data!
  }

  // Fallback: try other shapes in case API changes
  if (Array.isArray(response)) return response
  if ('data' in response && Array.isArray(response.data)) return response.data as ALAttributeValue[]
  return []
}

/**
 * Preview an audience query — returns count + sample without creating.
 * Use this to validate filters before committing to a full pull.
 *
 * Request shape: { days_back, filters?: { business?, location?, ... }, limit?, score?, include_dnc? }
 * Response: { job_id, count, result: [...], field_coverage }
 */
export async function previewAudience(
  params: ALAudiencePreviewRequest
): Promise<ALAudiencePreviewResponse> {
  // AL sub-account API only accepts: days_back, limit, segment (as string).
  // Extra fields (score, include_dnc, filters) cause JSON parse errors on sub-accounts.
  // When using segment-based queries, send ONLY the fields AL accepts.
  const body: Record<string, unknown> = {
    days_back: params.days_back,
  }

  if (params.limit !== undefined) body.limit = params.limit

  if (params.segment !== undefined) {
    // AL API expects segment as an array of strings: ["106328"]
    body.segment = [String(params.segment)]
  } else {
    // Filter-based preview — only add optional fields when NOT using segments
    if (params.filters) body.filters = params.filters
    if (params.score !== undefined) body.score = params.score
    if (params.include_dnc !== undefined) body.include_dnc = params.include_dnc
  }

  return alFetch<ALAudiencePreviewResponse>('/audiences/preview', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * Create a named audience with filters. Returns an audienceId
 * that can be used to fetch paginated records via fetchAudienceRecords().
 *
 * Request shape: { name, filters: { business?, location?, ... } }
 * Response: { audienceId: "uuid" }
 */
export async function createAudience(
  params: ALAudienceCreateRequest
): Promise<ALAudienceCreateResponse> {
  return alFetch<ALAudienceCreateResponse>('/audiences', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      filters: params.filters,
      ...(params.description && { description: params.description }),
    }),
  })
}

/**
 * Fetch paginated records from a created audience.
 * API returns { data: [...], total_records, page, page_size, total_pages }
 *
 * @param audienceId - The audience ID from createAudience()
 * @param page - 1-indexed page number
 * @param pageSize - Records per page (max 1000)
 */
export async function fetchAudienceRecords(
  audienceId: string,
  page = 1,
  pageSize = 500
): Promise<ALAudienceRecordsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(Math.min(pageSize, 1000)),
  })
  const response = await alFetch<ALAudienceRecordsResponse>(
    `/audiences/${audienceId}?${params.toString()}`,
    { method: 'GET' }
  )

  // Defense-in-depth: if AL returns a massive unfiltered audience, refuse to process it
  if (response.total_records >= UNFILTERED_RECORDS_THRESHOLD) {
    throw new AudienceLabUnfilteredError(response.total_records)
  }

  return response
}

// ============================================================================
// PIXEL V4 LOOKUP (Richer resolution data)
// ============================================================================

/**
 * Resolution object from the v4 pixel lookup API.
 * Includes DNC flags, department, career history, psychographics.
 */
export interface ALPixelResolutionV4 {
  // Personal
  FIRST_NAME?: string
  LAST_NAME?: string
  PERSONAL_ADDRESS?: string
  PERSONAL_CITY?: string
  PERSONAL_STATE?: string
  PERSONAL_ZIP?: string
  PERSONAL_ZIP4?: string
  AGE_RANGE?: string
  CHILDREN?: string
  GENDER?: string
  HOMEOWNER?: string
  MARRIED?: string
  NET_WORTH?: string
  INCOME_RANGE?: string

  // Contact — v4 consolidates phones into ALL_LANDLINES / ALL_MOBILES
  ALL_LANDLINES?: string
  LANDLINE_DNC?: string | boolean // "true"/"false" or boolean
  ALL_MOBILES?: string
  MOBILE_DNC?: string | boolean   // "true"/"false" or boolean
  PERSONAL_EMAILS?: string
  PERSONAL_VERIFIED_EMAILS?: string
  SHA256_PERSONAL_EMAIL?: string

  // Company
  COMPANY_NAME?: string
  COMPANY_DESCRIPTION?: string
  COMPANY_EMPLOYEE_COUNT?: string
  COMPANY_DOMAIN?: string
  COMPANY_ADDRESS?: string
  COMPANY_CITY?: string
  COMPANY_STATE?: string
  COMPANY_ZIP?: string
  COMPANY_PHONE?: string
  COMPANY_REVENUE?: string
  COMPANY_SIC?: string
  COMPANY_NAICS?: string
  COMPANY_INDUSTRY?: string

  // Professional
  BUSINESS_EMAIL?: string
  BUSINESS_VERIFIED_EMAILS?: string
  SHA256_BUSINESS_EMAIL?: string
  JOB_TITLE?: string
  HEADLINE?: string
  DEPARTMENT?: string
  SENIORITY_LEVEL?: string
  INFERRED_YEARS_EXPERIENCE?: string
  COMPANY_NAME_HISTORY?: string
  JOB_TITLE_HISTORY?: string

  // Education & Social
  EDUCATION_HISTORY?: string
  COMPANY_LINKEDIN_URL?: string
  INDIVIDUAL_LINKEDIN_URL?: string
  INDIVIDUAL_TWITTER_URL?: string
  INDIVIDUAL_FACEBOOK_URL?: string
  SKILLS?: string
  INTERESTS?: string

  [key: string]: unknown
}

export interface ALPixelEventV4 {
  pixel_id: string
  hem_sha256: string
  event_timestamp: string
  referrer_url?: string
  full_url?: string
  edid?: string
  resolution: ALPixelResolutionV4
}

export interface ALPixelEventsV4Response {
  total_records: number
  page_size: number
  page: number
  total_pages: number
  events: ALPixelEventV4[]
}

/**
 * Fetch v4 pixel events with richer resolution data (DNC flags, department,
 * career history, psychographics, URL tracking).
 *
 * @param pixelId - AudienceLab pixel UUID
 * @param page - 1-indexed page number
 * @param pageSize - Events per page (max 1000)
 */
export async function fetchPixelEventsV4(
  pixelId: string,
  page = 1,
  pageSize = 500
): Promise<ALPixelEventsV4Response> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(Math.min(pageSize, 1000)),
  })
  return alFetch<ALPixelEventsV4Response>(
    `/pixels/${pixelId}/v4?${params.toString()}`,
    { method: 'GET' }
  )
}

// ============================================================================
// BATCH ENRICHMENT
// ============================================================================

/**
 * Submit a batch enrichment job. Returns a jobId to poll for results.
 */
export async function createBatchEnrichment(
  params: ALBatchEnrichRequest
): Promise<ALBatchEnrichResponse> {
  return alFetch<ALBatchEnrichResponse>('/enrichments', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * Check status of a batch enrichment job.
 */
export async function getBatchEnrichmentStatus(
  jobId: string
): Promise<ALBatchEnrichStatusResponse> {
  return alFetch<ALBatchEnrichStatusResponse>(`/enrichments/${jobId}`, {
    method: 'GET',
  })
}

// ============================================================================
// CONVENIENCE: Full pixel provisioning for Cursive onboarding
// ============================================================================

/**
 * Provision a pixel for a new Cursive customer.
 * Creates the pixel in AL and returns all info needed for the customer.
 *
 * @param websiteName Customer's business name
 * @param websiteUrl Customer's website URL
 * @param cursiveWebhookUrl Webhook URL pointing to Cursive's superpixel handler
 * @returns Pixel creation result with install snippet
 */
export async function provisionCustomerPixel(params: {
  websiteName: string
  websiteUrl: string
  cursiveWebhookUrl?: string
}): Promise<ALPixelCreateResponse> {
  // Strip trailing slash — NEXT_PUBLIC_SITE_URL may have one, causing double-// in webhook URL
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://leads.meetcursive.com').replace(/\/$/, '')
  const webhookUrl = params.cursiveWebhookUrl ||
    `${baseUrl}/api/webhooks/audiencelab/superpixel`

  return createPixel({
    websiteName: params.websiteName,
    websiteUrl: params.websiteUrl,
    webhookUrl,
  })
}

// ============================================================================
// CONVENIENCE: Build audience filters from workspace targeting data
// ============================================================================

/**
 * Build ALAudienceSegmentFilters from a workspace's targeting preferences.
 * Used by the onboarding provisioner and the segment puller.
 *
 * @param industries Industry names from user_targeting.target_industries
 * @param states 2-letter state codes from user_targeting.target_states
 * @param cities Optional city names from user_targeting.target_cities
 * @param zips Optional ZIP codes from user_targeting.target_zips
 */
export function buildWorkspaceAudienceFilters(params: {
  industries?: string[]
  states?: string[]
  cities?: string[]
  zips?: string[]
}): ALAudienceSegmentFilters {
  const filters: ALAudienceSegmentFilters = {}

  if (params.industries?.length) {
    filters.business = { industry: params.industries }
  }

  const hasGeo = params.states?.length || params.cities?.length || params.zips?.length
  if (hasGeo) {
    filters.location = {}
    if (params.states?.length) filters.location.state = params.states
    if (params.cities?.length) filters.location.city = params.cities
    if (params.zips?.length) filters.location.zip = params.zips
  }

  return filters
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Quick check that the API key is valid and AL API is reachable.
 */
export async function healthCheck(): Promise<{ ok: boolean; error?: string }> {
  try {
    await listPixels()
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: message }
  }
}
