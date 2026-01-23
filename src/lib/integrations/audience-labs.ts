/**
 * Audience Labs API Integration
 *
 * Connects to Audience Labs API for bulk lead imports with routing support.
 */

const BASE_URL = process.env.AUDIENCE_LABS_API_URL || 'https://api.audiencelabs.com/v1'
const API_KEY = process.env.AUDIENCE_LABS_API_KEY

interface AudienceLabsLead {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  linkedin_url?: string
  job_title: string
  seniority?: string
  company_name: string
  company_domain?: string
  company_size?: string
  company_revenue?: string
  industry?: string
  location?: {
    city?: string
    state?: string
    country?: string
  }
  intent_score?: number
  tags?: string[]
}

interface SearchParams {
  industries?: string[]
  company_sizes?: string[]
  revenue_ranges?: string[]
  countries?: string[]
  states?: string[]
  seniority_levels?: string[]
  job_titles?: string[]
  limit?: number
  offset?: number
}

interface ImportJobResponse {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_records: number
  processed_records: number
  webhook_url?: string
}

export class AudienceLabsClient {
  /**
   * Search for leads matching criteria
   */
  static async searchLeads(params: SearchParams): Promise<AudienceLabsLead[]> {
    if (!API_KEY) {
      throw new Error('AUDIENCE_LABS_API_KEY not configured')
    }

    const response = await fetch(`${BASE_URL}/leads/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: {
          industries: params.industries,
          company_sizes: params.company_sizes,
          revenue_ranges: params.revenue_ranges,
          countries: params.countries,
          states: params.states,
          seniority_levels: params.seniority_levels,
          job_titles: params.job_titles
        },
        pagination: {
          limit: params.limit || 100,
          offset: params.offset || 0
        }
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Audience Labs API error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.leads || []
  }

  /**
   * Create bulk import job
   *
   * Submits a bulk import request and receives leads via webhook
   */
  static async createImportJob(
    params: SearchParams,
    webhookUrl: string
  ): Promise<ImportJobResponse> {
    if (!API_KEY) {
      throw new Error('AUDIENCE_LABS_API_KEY not configured')
    }

    const response = await fetch(`${BASE_URL}/imports/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: {
          industries: params.industries,
          company_sizes: params.company_sizes,
          revenue_ranges: params.revenue_ranges,
          countries: params.countries,
          states: params.states,
          seniority_levels: params.seniority_levels,
          job_titles: params.job_titles
        },
        delivery: {
          method: 'webhook',
          webhook_url: webhookUrl,
          batch_size: 100 // Deliver in batches of 100
        }
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Audience Labs API error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return {
      job_id: data.import_job_id,
      status: data.status,
      total_records: data.estimated_records,
      processed_records: 0,
      webhook_url: webhookUrl
    }
  }

  /**
   * Get import job status
   */
  static async getImportJobStatus(jobId: string): Promise<ImportJobResponse> {
    if (!API_KEY) {
      throw new Error('AUDIENCE_LABS_API_KEY not configured')
    }

    const response = await fetch(`${BASE_URL}/imports/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Audience Labs API error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return {
      job_id: data.import_job_id,
      status: data.status,
      total_records: data.total_records,
      processed_records: data.processed_records,
      webhook_url: data.webhook_url
    }
  }

  /**
   * Cancel import job
   */
  static async cancelImportJob(jobId: string): Promise<void> {
    if (!API_KEY) {
      throw new Error('AUDIENCE_LABS_API_KEY not configured')
    }

    const response = await fetch(`${BASE_URL}/imports/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Audience Labs API error: ${response.status} - ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Enrich a single lead
   */
  static async enrichLead(params: {
    email?: string
    linkedin_url?: string
    company_domain?: string
  }): Promise<AudienceLabsLead | null> {
    if (!API_KEY) {
      throw new Error('AUDIENCE_LABS_API_KEY not configured')
    }

    const response = await fetch(`${BASE_URL}/enrich/person`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: params.email,
        linkedin_url: params.linkedin_url,
        company_domain: params.company_domain
      })
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null // No data found
      }
      const error = await response.json().catch(() => ({}))
      throw new Error(`Audience Labs API error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.lead || null
  }

  /**
   * Get account credits/usage
   */
  static async getAccountInfo(): Promise<{
    credits_remaining: number
    credits_used_this_month: number
    plan: string
  }> {
    if (!API_KEY) {
      throw new Error('AUDIENCE_LABS_API_KEY not configured')
    }

    const response = await fetch(`${BASE_URL}/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Audience Labs API error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return {
      credits_remaining: data.credits.remaining,
      credits_used_this_month: data.credits.used_this_month,
      plan: data.plan.name
    }
  }

  /**
   * Verify webhook signature from Audience Labs
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}
