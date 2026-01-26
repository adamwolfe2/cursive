// DataShopper API Client
// Used for discovering companies with intent signals

import { retryFetch } from '@/lib/utils/retry'

// Configuration
const DATASHOPPER_TIMEOUT = 30000
const DATASHOPPER_MAX_RETRIES = 2

export interface DataShopperSearchParams {
  topic: string
  location?: {
    country?: string
    state?: string
    city?: string
  }
  companySize?: {
    min?: number
    max?: number
  }
  revenue?: {
    min?: number
    max?: number
  }
  industry?: string[]
  limit?: number
}

export interface DataShopperCompany {
  name: string
  domain: string
  website?: string
  description?: string
  industry?: string
  employee_count?: number
  revenue?: number
  location?: {
    city?: string
    state?: string
    country?: string
    address?: string
  }
  founded_year?: number
  technologies?: string[]
  social_profiles?: {
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  intent_signals?: {
    signal_type: string
    signal_strength: 'high' | 'medium' | 'low'
    detected_at: string
    source: string
  }[]
}

export interface DataShopperResponse {
  results: DataShopperCompany[]
  total: number
  page: number
  per_page: number
}

export class DataShopperClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.DATASHOPPER_API_KEY || ''
    this.baseUrl = process.env.DATASHOPPER_API_URL || 'https://api.datashopper.com/v1'
  }

  /**
   * Ensure API key is configured before making requests
   */
  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error('DATASHOPPER_API_KEY environment variable is not set')
    }
  }

  /**
   * Search for companies with intent signals for a specific topic
   */
  async searchCompanies(
    params: DataShopperSearchParams
  ): Promise<DataShopperResponse> {
    this.ensureApiKey()

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('topic', params.topic)
      queryParams.append('limit', String(params.limit || 50))

      if (params.location?.country) {
        queryParams.append('country', params.location.country)
      }
      if (params.location?.state) {
        queryParams.append('state', params.location.state)
      }
      if (params.location?.city) {
        queryParams.append('city', params.location.city)
      }

      if (params.companySize?.min) {
        queryParams.append('min_employees', String(params.companySize.min))
      }
      if (params.companySize?.max) {
        queryParams.append('max_employees', String(params.companySize.max))
      }

      if (params.revenue?.min) {
        queryParams.append('min_revenue', String(params.revenue.min))
      }
      if (params.revenue?.max) {
        queryParams.append('max_revenue', String(params.revenue.max))
      }

      if (params.industry && params.industry.length > 0) {
        params.industry.forEach((ind) => queryParams.append('industry', ind))
      }

      const response = await retryFetch(
        `${this.baseUrl}/companies/search?${queryParams}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: DATASHOPPER_TIMEOUT,
        },
        { maxRetries: DATASHOPPER_MAX_RETRIES }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(
          `DataShopper API error: ${(error as any).message || response.statusText}`
        )
      }

      return await response.json()
    } catch (error: any) {
      console.error('[DataShopper] Search error:', error)
      throw new Error(`Failed to search companies: ${error.message}`)
    }
  }

  /**
   * Get intent signals for a specific domain
   */
  async getIntentSignals(domain: string): Promise<DataShopperCompany['intent_signals']> {
    this.ensureApiKey()

    try {
      const response = await retryFetch(
        `${this.baseUrl}/companies/${encodeURIComponent(domain)}/intent`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: DATASHOPPER_TIMEOUT,
        },
        { maxRetries: DATASHOPPER_MAX_RETRIES }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(
          `DataShopper API error: ${(error as any).message || response.statusText}`
        )
      }

      const data = await response.json()
      return data.intent_signals || []
    } catch (error: any) {
      console.error('[DataShopper] Intent signals error:', error)
      throw new Error(`Failed to get intent signals: ${error.message}`)
    }
  }

  /**
   * Calculate intent score based on signals
   */
  calculateIntentScore(
    signals: DataShopperCompany['intent_signals']
  ): 'hot' | 'warm' | 'cold' {
    if (!signals || signals.length === 0) return 'cold'

    const highSignals = signals.filter((s) => s.signal_strength === 'high').length
    const mediumSignals = signals.filter((s) => s.signal_strength === 'medium').length
    const totalSignals = signals.length

    // Scoring logic:
    // Hot: 3+ high signals OR 2+ high + 3+ medium
    // Warm: 1+ high OR 4+ medium
    // Cold: everything else

    if (highSignals >= 3 || (highSignals >= 2 && mediumSignals >= 3)) {
      return 'hot'
    }

    if (highSignals >= 1 || mediumSignals >= 4) {
      return 'warm'
    }

    return 'cold'
  }

  /**
   * Check if DataShopper API is configured and reachable
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    if (!this.apiKey) {
      return { healthy: false, error: 'DATASHOPPER_API_KEY not configured' }
    }
    try {
      const response = await retryFetch(
        `${this.baseUrl}/health`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 5000,
        },
        { maxRetries: 1 }
      )
      return { healthy: response.ok }
    } catch (error: any) {
      return { healthy: false, error: error.message }
    }
  }
}
