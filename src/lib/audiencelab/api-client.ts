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
  install_url?: string
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

// --- Audience Builder types ---

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

export interface ALAudienceCreateRequest {
  name?: string
  filters: ALAudienceFilter
  description?: string
}

/** POST /audiences returns { audienceId: "uuid" } */
export interface ALAudienceCreateResponse {
  audienceId: string
  [key: string]: unknown
}

export interface ALAudiencePreviewRequest {
  filters: ALAudienceFilter
}

/** POST /audiences/preview returns { job_id, result: [...], count } */
export interface ALAudiencePreviewResponse {
  job_id?: string
  count: number
  result?: ALEnrichedProfile[]
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

class AudienceLabApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: unknown
  ) {
    super(message)
    this.name = 'AudienceLabApiError'
  }
}

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
 * API returns { job_id, result: [...], count }
 */
export async function previewAudience(
  params: ALAudiencePreviewRequest
): Promise<ALAudiencePreviewResponse> {
  return alFetch<ALAudiencePreviewResponse>('/audiences/preview', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * Create a named audience with filters. Returns an audienceId
 * that can be used to fetch paginated records.
 * API returns { audienceId: "uuid" }
 */
export async function createAudience(
  params: ALAudienceCreateRequest
): Promise<ALAudienceCreateResponse> {
  return alFetch<ALAudienceCreateResponse>('/audiences', {
    method: 'POST',
    body: JSON.stringify(params),
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
  return alFetch<ALAudienceRecordsResponse>(
    `/audiences/${audienceId}?${params.toString()}`,
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
  const webhookUrl = params.cursiveWebhookUrl ||
    'https://leads.meetcursive.com/api/webhooks/audiencelab/superpixel'

  return createPixel({
    websiteName: params.websiteName,
    websiteUrl: params.websiteUrl,
    webhookUrl,
  })
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
