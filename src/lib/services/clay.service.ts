/**
 * Clay Enrichment Service
 * Cursive Platform
 *
 * Integration with Clay API for lead enrichment.
 * Clay provides company and contact data enrichment.
 */

export interface ClayEnrichmentRequest {
  email?: string
  first_name?: string
  last_name?: string
  company_name?: string
  company_domain?: string
  linkedin_url?: string
}

export interface ClayEnrichmentResponse {
  success: boolean
  data?: {
    // Person data
    first_name?: string
    last_name?: string
    email?: string
    email_verified?: boolean
    phone?: string
    phone_verified?: boolean
    linkedin_url?: string
    linkedin_headline?: string
    linkedin_connections?: number
    job_title?: string
    job_seniority?: string

    // Company data
    company_name?: string
    company_domain?: string
    company_website?: string
    company_linkedin?: string
    company_size?: string
    company_revenue?: string
    company_founded?: number
    company_industry?: string
    company_description?: string
    company_location?: {
      city?: string
      state?: string
      country?: string
    }
  }
  error?: string
  credits_used?: number
}

const CLAY_API_URL = 'https://api.clay.com/v1'

/**
 * Enrich a lead using Clay API
 */
export async function enrichLeadWithClay(
  request: ClayEnrichmentRequest
): Promise<ClayEnrichmentResponse> {
  const apiKey = process.env.CLAY_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'Clay API key not configured',
    }
  }

  try {
    // Clay uses a table-based enrichment model
    // We'll use their people enrichment endpoint
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const response = await fetch(`${CLAY_API_URL}/enrich/person`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: request.email,
        first_name: request.first_name,
        last_name: request.last_name,
        company: request.company_name,
        domain: request.company_domain,
        linkedin_url: request.linkedin_url,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.text()
      return {
        success: false,
        error: `Clay API error: ${response.status} - ${error}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        email_verified: data.email_verified,
        phone: data.phone,
        phone_verified: data.phone_verified,
        linkedin_url: data.linkedin_url,
        linkedin_headline: data.linkedin_headline,
        linkedin_connections: data.linkedin_connections,
        job_title: data.job_title || data.title,
        job_seniority: data.seniority,
        company_name: data.company?.name,
        company_domain: data.company?.domain,
        company_website: data.company?.website,
        company_linkedin: data.company?.linkedin_url,
        company_size: data.company?.size || formatEmployeeCount(data.company?.employees),
        company_revenue: formatRevenue(data.company?.estimated_revenue),
        company_founded: data.company?.founded_year,
        company_industry: data.company?.industry,
        company_description: data.company?.description,
        company_location: data.company?.location,
      },
      credits_used: 1,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Clay enrichment failed',
    }
  }
}

/**
 * Enrich company data using Clay
 */
export async function enrichCompanyWithClay(
  domain: string
): Promise<ClayEnrichmentResponse> {
  const apiKey = process.env.CLAY_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'Clay API key not configured',
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const response = await fetch(`${CLAY_API_URL}/enrich/company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ domain }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.text()
      return {
        success: false,
        error: `Clay API error: ${response.status} - ${error}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        company_name: data.name,
        company_domain: data.domain,
        company_website: data.website,
        company_linkedin: data.linkedin_url,
        company_size: formatEmployeeCount(data.employees),
        company_revenue: formatRevenue(data.estimated_revenue),
        company_founded: data.founded_year,
        company_industry: data.industry,
        company_description: data.description,
        company_location: data.location,
      },
      credits_used: 1,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Clay company enrichment failed',
    }
  }
}

/**
 * Format employee count to readable string
 */
function formatEmployeeCount(count?: number): string | undefined {
  if (!count) return undefined

  if (count < 10) return '1-10'
  if (count < 50) return '11-50'
  if (count < 200) return '51-200'
  if (count < 500) return '201-500'
  if (count < 1000) return '501-1000'
  if (count < 5000) return '1001-5000'
  if (count < 10000) return '5001-10000'
  return '10000+'
}

/**
 * Format revenue to readable string
 */
function formatRevenue(revenue?: number): string | undefined {
  if (!revenue) return undefined

  if (revenue < 1000000) return '<$1M'
  if (revenue < 10000000) return '$1M-$10M'
  if (revenue < 50000000) return '$10M-$50M'
  if (revenue < 100000000) return '$50M-$100M'
  if (revenue < 500000000) return '$100M-$500M'
  if (revenue < 1000000000) return '$500M-$1B'
  return '$1B+'
}

/**
 * Batch enrich multiple leads
 */
export async function batchEnrichLeads(
  leads: ClayEnrichmentRequest[]
): Promise<ClayEnrichmentResponse[]> {
  // Clay has rate limits, so we process in batches with delays
  const results: ClayEnrichmentResponse[] = []
  const batchSize = 10
  const delayMs = 1000

  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((lead) => enrichLeadWithClay(lead))
    )
    results.push(...batchResults)

    // Delay between batches to respect rate limits
    if (i + batchSize < leads.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}
