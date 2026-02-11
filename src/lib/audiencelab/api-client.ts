/**
 * AudienceLab REST API Client
 *
 * Thin client for the AL REST API (https://api.audiencelab.io).
 * Complements the existing webhook/push pipeline with pull capabilities:
 *
 * - Pixel provisioning: create pixels programmatically for B2B customers
 * - Audience listing: inventory available audiences
 * - On-demand enrichment: enrich/lookup profiles by filter criteria
 *
 * Auth: X-Api-Key header via AUDIENCELAB_ACCOUNT_API_KEY env var
 * Existing webhook pipeline remains the canonical ingestion path.
 */

import { fetchWithTimeout } from '@/lib/utils/retry'

// ============================================================================
// CONFIGURATION
// ============================================================================

const AL_API_BASE_URL = process.env.AUDIENCELAB_API_URL || 'https://api.audiencelab.io'
const AL_API_KEY = process.env.AUDIENCELAB_ACCOUNT_API_KEY || ''
const AL_API_TIMEOUT = 30000

// ============================================================================
// TYPES
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

export interface ALPixel {
  pixel_id: string
  website_name: string
  website_url: string
  webhook_url?: string
  created_at?: string
  status?: string
}

export interface ALAudience {
  id: string
  name: string
  description?: string
  size?: number
  status?: string
  created_at?: string
  updated_at?: string
}

export interface ALAudienceListResponse {
  audiences: ALAudience[]
  total?: number
  page?: number
  limit?: number
}

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

export interface ALEnrichResult {
  found: number
  results: ALEnrichedProfile[]
}

export interface ALEnrichedProfile {
  email?: string
  first_name?: string
  last_name?: string
  personal_emails?: string[]
  business_emails?: string[]
  phones?: string[]
  company_name?: string
  company_domain?: string
  job_title?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  gender?: string
  age?: string
  income_range?: string
  homeowner?: boolean
  [key: string]: unknown
}

// --- Audience Builder types ---

export interface ALAudienceFilter {
  segment?: string[]
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

export interface ALAudienceCreateResponse {
  id: string
  audienceId?: string
  name?: string
  status?: string
  size?: number
  created_at?: string
  [key: string]: unknown
}

export interface ALAudiencePreviewRequest {
  filters: ALAudienceFilter
}

export interface ALAudiencePreviewResponse {
  count: number
  sample?: ALEnrichedProfile[]
  [key: string]: unknown
}

export interface ALAudienceRecordsResponse {
  records: ALEnrichedProfile[]
  total?: number
  page: number
  page_size: number
  has_more?: boolean
  [key: string]: unknown
}

export interface ALAttributeValue {
  id?: string
  name?: string
  value?: string
  count?: number
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
  results?: ALEnrichedProfile[]
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
 */
export async function listPixels(): Promise<ALPixel[]> {
  const response = await alFetch<ALPixel[] | { pixels: ALPixel[] }>('/pixels', {
    method: 'GET',
  })
  // Handle both array and wrapped response formats
  return Array.isArray(response) ? response : response.pixels || []
}

// ============================================================================
// AUDIENCE MANAGEMENT
// ============================================================================

/**
 * List available audiences with optional pagination.
 */
export async function listAudiences(params?: {
  page?: number
  limit?: number
}): Promise<ALAudienceListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))

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
 * e.g., getAudienceAttributes('segments') → list of segment IDs
 *       getAudienceAttributes('industries') → available industries
 *       getAudienceAttributes('sic') → SIC codes
 */
export async function getAudienceAttributes(
  attribute: 'segments' | 'industries' | 'departments' | 'seniority' | 'sic' | string
): Promise<ALAttributeValue[]> {
  const response = await alFetch<ALAttributeValue[] | { data: ALAttributeValue[] } | { attributes: ALAttributeValue[] }>(
    `/audiences/attributes/${attribute}`,
    { method: 'GET' }
  )
  if (Array.isArray(response)) return response
  if ('data' in response && Array.isArray((response as any).data)) return (response as any).data
  if ('attributes' in response && Array.isArray((response as any).attributes)) return (response as any).attributes
  return []
}

/**
 * Preview an audience query — returns count + sample without creating.
 * Use this to validate filters before committing to a full pull.
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
