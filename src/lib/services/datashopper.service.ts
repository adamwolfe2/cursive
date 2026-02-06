/**
 * DataShopper API Service
 *
 * Handles all interactions with DataShopper's visitor identification
 * and data enrichment platform.
 *
 * Usage flows:
 * 1. Visitor Identification: Install pixel → poll getVisitorResults() → enrich identified visitors
 * 2. Data Enrichment: Have email/phone/IP → call enrichBy*() → get 300+ data points
 * 3. Batch Enrichment: Have list of contacts → call batchEnrichBy*() → get enriched data
 */

import type {
  DataShopperAuthParams,
  DataShopperResponse,
  DataShopperIdentity,
  BatchEnrichResponse,
  BatchPiiRecord,
  EnrichByPiiParams,
  CreatePixelParams,
  PixelUtmFilters,
  PixelZipCodeFilters,
  CreateBlacklistParams,
  getPhoneTypeLabel,
} from '@/types/datashopper.types'

const BASE_URL_V2 = 'https://main.dashboard.datashopper.com/api/v2'
const BASE_URL_V1 = 'https://main.dashboard.datashopper.com/api/v1'

export interface DataShopperConfig {
  apiKey: string
  websiteSlug: string
}

export class DataShopperService {
  private config: DataShopperConfig

  constructor(config: DataShopperConfig) {
    this.config = config
  }

  // ============================================================================
  // V2 API - VISITOR RESULTS
  // ============================================================================

  /**
   * Get identified website visitors from pixel tracking
   * This is the primary method for getting leads from your website traffic
   */
  async getVisitorResults(params?: {
    search?: string
    start?: string // yyyy-mm-dd
    end?: string // yyyy-mm-dd
  }): Promise<DataShopperResponse> {
    const url = new URL(`${BASE_URL_V2}/results`)
    if (params?.search) url.searchParams.set('search', params.search)
    if (params?.start) url.searchParams.set('start', params.start)
    if (params?.end) url.searchParams.set('end', params.end)

    return this.request<DataShopperResponse>(url.toString(), 'GET')
  }

  // ============================================================================
  // V2 API - SINGLE ENRICHMENT
  // ============================================================================

  /**
   * Enrich a contact by email address
   */
  async enrichByEmail(email: string): Promise<DataShopperResponse> {
    return this.postV2('GetDataByEmail', { email })
  }

  /**
   * Enrich a contact by phone number
   */
  async enrichByPhone(phone: string): Promise<DataShopperResponse> {
    return this.postV2('GetDataByPhone', { phone })
  }

  /**
   * Enrich a contact by IP address
   */
  async enrichByIp(ip: string): Promise<DataShopperResponse> {
    return this.postV2('GetDataByIp', { ip })
  }

  /**
   * Enrich a contact by DataShopper's internal ID
   */
  async enrichById(id: string): Promise<DataShopperResponse> {
    return this.postV2('GetDataById', { id })
  }

  /**
   * Enrich a contact by MD5-hashed email
   */
  async enrichByMd5(md5: string): Promise<DataShopperResponse> {
    return this.postV2('GetDataByMd5', { md5 })
  }

  /**
   * Enrich a contact by mobile device ID (AAID or IDFA)
   */
  async enrichByDevice(deviceId: string): Promise<DataShopperResponse> {
    return this.postV2('GetDataByDevice', { deviceId })
  }

  /**
   * Enrich a contact by Vehicle Identification Number (VIN)
   */
  async enrichByVehicle(vin: string): Promise<DataShopperResponse> {
    return this.postV2('GetDataByVehicle', { vin })
  }

  /**
   * Enrich a contact by PII (name + address)
   */
  async enrichByPii(pii: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zip: string
  }): Promise<DataShopperResponse> {
    return this.postV2('GetDataByPii', pii)
  }

  // ============================================================================
  // V1 API - BATCH ENRICHMENT
  // ============================================================================

  /**
   * Batch enrich contacts by email addresses
   */
  async batchEnrichByEmail(emails: string[]): Promise<BatchEnrichResponse> {
    return this.postV1('GetDataBy/Email', { object_list: emails })
  }

  /**
   * Batch enrich contacts by phone numbers
   */
  async batchEnrichByPhone(phones: string[]): Promise<BatchEnrichResponse> {
    return this.postV1('GetDataBy/Phone', { object_list: phones })
  }

  /**
   * Batch enrich contacts by PII (name + address)
   * Each record needs a Sequence field for tracking
   */
  async batchEnrichByPii(records: BatchPiiRecord[]): Promise<BatchEnrichResponse> {
    return this.postV1('GetDataBy/Pii', { object_list: records })
  }

  /**
   * Batch enrich contacts by DataShopper IDs
   */
  async batchEnrichById(ids: string[]): Promise<BatchEnrichResponse> {
    return this.postV1('GetDataBy/Id', { object_list: ids })
  }

  /**
   * Batch enrich contacts by MD5-hashed emails
   */
  async batchEnrichByMd5(hashes: string[]): Promise<BatchEnrichResponse> {
    return this.postV1('GetDataBy/Md5', { object_list: hashes })
  }

  // ============================================================================
  // V1 API - PIXEL MANAGEMENT
  // ============================================================================

  /**
   * Create a new tracking pixel for a website
   */
  async createPixel(
    name: string,
    url: string,
    options?: {
      filter?: 'include' | 'exclude'
      routes?: string[]
    }
  ): Promise<{ success: boolean; data: { website: string } }> {
    return this.postV1('pixel', { name, url, ...options })
  }

  /**
   * Get all pixels for the account
   */
  async getAllPixels(): Promise<{ success: boolean; data: any[] }> {
    return this.request(`${BASE_URL_V1}/pixel`, 'GET')
  }

  /**
   * Get the JavaScript snippet for a pixel
   */
  async getPixelScript(slug: string): Promise<string> {
    const response = await this.request<{ success: boolean; data: string }>(
      `${BASE_URL_V1}/pixel/${slug}`,
      'GET'
    )
    return response.data
  }

  /**
   * Add or update UTM filters for a pixel
   */
  async setUtmFilters(filters: PixelUtmFilters): Promise<{ success: boolean }> {
    return this.postV1('pixel/utm-filters', filters)
  }

  /**
   * Add or update zip code filters for a pixel
   */
  async setZipCodeFilters(filters: PixelZipCodeFilters): Promise<{ success: boolean }> {
    return this.postV1('pixel/zip-codes', filters)
  }

  /**
   * Create a blacklist filter (emails or addresses to exclude)
   */
  async createBlacklist(params: {
    name: string
    type: 'email' | 'address'
    list: string[]
  }): Promise<{ success: boolean; data: { id: string } }> {
    return this.postV1('pixel/blacklist', params)
  }

  /**
   * Delete UTM filters
   */
  async deleteUtmFilters(): Promise<{ success: boolean }> {
    return this.request(`${BASE_URL_V1}/pixel/utm-filters`, 'DELETE')
  }

  /**
   * Delete zip code filters
   */
  async deleteZipCodeFilters(): Promise<{ success: boolean }> {
    return this.request(`${BASE_URL_V1}/pixel/zip-codes`, 'DELETE')
  }

  /**
   * Delete a blacklist
   */
  async deleteBlacklist(blacklistId: string): Promise<{ success: boolean }> {
    return this.request(`${BASE_URL_V1}/pixel/blacklist/${blacklistId}`, 'DELETE')
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get the primary (best) email for an identity
   */
  static getPrimaryEmail(identity: DataShopperIdentity): string | null {
    if (!identity.emails?.length) return null
    // Sort by rankOrder (1 is best), then by qualityLevel (higher is better)
    const sorted = [...identity.emails].sort((a, b) => {
      if (a.rankOrder !== b.rankOrder) return a.rankOrder - b.rankOrder
      return (b.qualityLevel || 0) - (a.qualityLevel || 0)
    })
    return sorted[0]?.email || null
  }

  /**
   * Get the primary (best) phone for an identity, excluding DNC phones
   */
  static getPrimaryPhone(identity: DataShopperIdentity): string | null {
    if (!identity.phones?.length) return null
    // Filter out DNC phones, sort by rankOrder, then by quality
    const sorted = [...identity.phones]
      .filter((p) => !p.dnc)
      .sort((a, b) => {
        if (a.rankOrder !== b.rankOrder) return a.rankOrder - b.rankOrder
        return (b.qualityLevel || 0) - (a.qualityLevel || 0)
      })
    return sorted[0]?.phone?.toString() || null
  }

  /**
   * Get the primary B2B company association
   */
  static getPrimaryCompany(identity: DataShopperIdentity): DataShopperIdentity['companies'][0] | null {
    if (!identity.companies?.length) return null
    return identity.companies[0]
  }

  /**
   * Extract all interest keys that are true
   */
  static getActiveInterests(data: DataShopperIdentity['data']): string[] {
    const interestKeys = [
      'carsInterest',
      'entertainmentInterest',
      'homeImprovementInterest',
      'diy',
      'fitness',
      'epicurean',
      'gardening',
      'golf',
      'healthyLivingInterest',
      'cooking',
      'photography',
      'selfImprovement',
      'homeDecor',
      'hunting',
      'motorcycles',
      'movies',
      'music',
      'outdoors',
      'campingHiking',
      'fishing',
      'travel',
      'travelBusiness',
      'travelPersonal',
      'travelCruises',
      'travelVacation',
      'travelForeign',
      'petOwner',
      'catOwner',
      'dogOwner',
      'magazineSubscriber',
      'books',
      'investments',
      'readingAvidReader',
      'readingFiction',
      'readingFinance',
      'readingScienceTechnology',
      'readingWorldNewsPolitics',
      'likelyCharitableDonor',
      'voter',
    ] as const

    return interestKeys.filter((key) => (data as any)[key] === true)
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async postV2<T>(endpoint: string, data: Record<string, any>): Promise<T> {
    return this.request<T>(`${BASE_URL_V2}/${endpoint}`, 'POST', data)
  }

  private async postV1<T>(endpoint: string, data: Record<string, any>): Promise<T> {
    return this.request<T>(`${BASE_URL_V1}/${endpoint}`, 'POST', data)
  }

  private async request<T>(
    url: string,
    method: 'GET' | 'POST' | 'DELETE',
    data?: Record<string, any>
  ): Promise<T> {
    const body = {
      api_key: this.config.apiKey,
      website: this.config.websiteSlug,
      ...data,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new DataShopperError(
        `DataShopper API error: ${response.status} ${response.statusText}`,
        response.status
      )
    }

    return response.json()
  }
}

export class DataShopperError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'DataShopperError'
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a DataShopper service instance from workspace settings
 */
export function createDataShopperService(apiKey: string, websiteSlug: string): DataShopperService {
  return new DataShopperService({ apiKey, websiteSlug })
}
