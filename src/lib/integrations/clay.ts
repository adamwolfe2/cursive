// Clay API Client
// Used for enriching company data with contact information

import { retryFetch, DEFAULT_TIMEOUT } from '@/lib/utils/retry'

// Configuration
const CLAY_TIMEOUT = 30000 // 30 seconds for enrichment requests
const CLAY_MAX_RETRIES = 2

export interface ClayEnrichmentRequest {
  domain: string
  company_name?: string
  filters?: {
    job_titles?: string[]
    seniority_levels?: string[]
    departments?: string[]
    locations?: string[]
  }
  limit?: number
}

export interface ClayContact {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email?: string
  verified_email?: boolean
  phone?: string
  title?: string
  seniority?: string
  department?: string
  linkedin_url?: string
  location?: string
  company_name?: string
  company_domain?: string
}

export interface ClayEnrichmentResponse {
  contacts: ClayContact[]
  company_info?: {
    name: string
    domain: string
    industry?: string
    employee_count?: number
    description?: string
    logo_url?: string
  }
  credits_used: number
}

export class ClayClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.CLAY_API_KEY || ''
    this.baseUrl = process.env.CLAY_API_URL || 'https://api.clay.com/v1'
  }

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error('CLAY_API_KEY environment variable is not set')
    }
  }

  /**
   * Enrich a company with contact data
   */
  async enrichCompany(
    request: ClayEnrichmentRequest
  ): Promise<ClayEnrichmentResponse> {
    this.ensureApiKey()
    try {
      const response = await retryFetch(
        `${this.baseUrl}/enrichment/company`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: request.domain,
            company_name: request.company_name,
            contact_filters: request.filters || {
              job_titles: [
                'CEO',
                'CTO',
                'VP',
                'Director',
                'Head of',
                'Manager',
              ],
              seniority_levels: ['executive', 'director', 'manager'],
            },
            max_contacts: request.limit || 5,
          }),
          timeout: CLAY_TIMEOUT,
        },
        { maxRetries: CLAY_MAX_RETRIES }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Clay API error: ${(error as any).message || response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      console.error('[Clay] Enrichment error:', error)
      throw new Error(`Failed to enrich company: ${error.message}`)
    }
  }

  /**
   * Find contacts for a specific domain
   */
  async findContacts(
    domain: string,
    filters?: ClayEnrichmentRequest['filters']
  ): Promise<ClayContact[]> {
    try {
      const response = await this.enrichCompany({
        domain,
        filters,
        limit: 10,
      })
      return response.contacts
    } catch (error: any) {
      console.error('[Clay] Find contacts error:', error)
      throw new Error(`Failed to find contacts: ${error.message}`)
    }
  }

  /**
   * Verify email addresses
   */
  async verifyEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
    this.ensureApiKey()
    try {
      const response = await retryFetch(
        `${this.baseUrl}/verification/email`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
          timeout: 15000, // Email verification should be quick
        },
        { maxRetries: CLAY_MAX_RETRIES }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Clay API error: ${(error as any).message || response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      console.error('[Clay] Email verification error:', error)
      return { valid: false, reason: error.message }
    }
  }

  /**
   * Batch enrich multiple companies
   */
  async batchEnrich(
    requests: ClayEnrichmentRequest[]
  ): Promise<ClayEnrichmentResponse[]> {
    this.ensureApiKey()
    try {
      const response = await retryFetch(
        `${this.baseUrl}/enrichment/batch`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: requests.map((req) => ({
              domain: req.domain,
              company_name: req.company_name,
              contact_filters: req.filters,
              max_contacts: req.limit || 5,
            })),
          }),
          timeout: 60000, // Batch operations may take longer
        },
        { maxRetries: CLAY_MAX_RETRIES }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Clay API error: ${(error as any).message || response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      console.error('[Clay] Batch enrichment error:', error)
      throw new Error(`Failed to batch enrich: ${error.message}`)
    }
  }

  /**
   * Get enrichment job status
   */
  async getJobStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    result?: ClayEnrichmentResponse
    error?: string
  }> {
    this.ensureApiKey()
    try {
      const response = await retryFetch(
        `${this.baseUrl}/jobs/${jobId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
        { maxRetries: CLAY_MAX_RETRIES }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Clay API error: ${(error as any).message || response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      console.error('[Clay] Job status error:', error)
      throw new Error(`Failed to get job status: ${error.message}`)
    }
  }

  /**
   * Check if Clay API is configured and reachable
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    if (!this.apiKey) {
      return { healthy: false, error: 'CLAY_API_KEY not configured' }
    }
    try {
      // Try a lightweight endpoint to check connectivity
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
