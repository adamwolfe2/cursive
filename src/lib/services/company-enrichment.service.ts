/**
 * Company Enrichment Service
 * Cursive Platform
 *
 * Unified service for enriching company data from multiple sources:
 * - Clearbit (company data + logo)
 * - Firecrawl (website scraping for branding)
 * - Tavily (fallback research)
 * - Logo.dev/Brandfetch (logo APIs)
 *
 * Used during onboarding to auto-fill company information from domain/website.
 */

import { createClient } from '@/lib/supabase/server'
import type { CompanyEnrichmentData } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

export interface CompanyEnrichmentResult {
  success: boolean
  source: 'clearbit' | 'firecrawl' | 'tavily' | 'logo_api' | 'manual' | 'combined'
  data: {
    // Basic info
    name?: string
    domain?: string
    description?: string

    // Logo & Branding
    logoUrl?: string
    faviconUrl?: string
    primaryColor?: string

    // Company details
    industry?: string
    industryGroup?: string
    subIndustry?: string
    employeeCount?: number
    employeeRange?: string
    annualRevenue?: number
    revenueRange?: string
    foundedYear?: number

    // Location
    location?: {
      streetNumber?: string
      streetName?: string
      city?: string
      state?: string
      stateCode?: string
      country?: string
      countryCode?: string
      postalCode?: string
    }

    // Social
    linkedinHandle?: string
    twitterHandle?: string
    facebookHandle?: string

    // Tech
    technologies?: string[]
    tags?: string[]
  }
  error?: string
  enrichedAt: string
}

export interface EnrichmentOptions {
  // Which sources to try
  useClearbit?: boolean
  useFirecrawl?: boolean
  useTavily?: boolean
  useLogoApi?: boolean

  // What to fetch
  fetchLogo?: boolean
  fetchCompanyData?: boolean

  // Caching
  useCache?: boolean
  cacheTtlMinutes?: number
}

// ============================================================================
// CLEARBIT API
// ============================================================================

const CLEARBIT_API_KEY = process.env.CLEARBIT_API_KEY

interface ClearbitCompany {
  name: string
  legalName?: string
  domain: string
  domainAliases?: string[]
  site?: {
    phoneNumbers?: string[]
    emailAddresses?: string[]
  }
  category?: {
    sector?: string
    industryGroup?: string
    industry?: string
    subIndustry?: string
    sicCode?: string
    naicsCode?: string
  }
  tags?: string[]
  description?: string
  foundedYear?: number
  location?: string
  timeZone?: string
  utcOffset?: number
  geo?: {
    streetNumber?: string
    streetName?: string
    subPremise?: string
    city?: string
    postalCode?: string
    state?: string
    stateCode?: string
    country?: string
    countryCode?: string
    lat?: number
    lng?: number
  }
  logo?: string
  facebook?: { handle?: string }
  linkedin?: { handle?: string }
  twitter?: { handle?: string; id?: string; bio?: string; followers?: number }
  crunchbase?: { handle?: string }
  emailProvider?: boolean
  type?: string
  ticker?: string
  identifiers?: { usEIN?: string }
  phone?: string
  metrics?: {
    alexaUsRank?: number
    alexaGlobalRank?: number
    employees?: number
    employeesRange?: string
    marketCap?: number
    raised?: number
    annualRevenue?: number
    estimatedAnnualRevenue?: string
    fiscalYearEnd?: number
  }
  tech?: string[]
  techCategories?: string[]
  parent?: { domain?: string }
  ultimateParent?: { domain?: string }
}

async function fetchClearbitCompany(domain: string): Promise<ClearbitCompany | null> {
  if (!CLEARBIT_API_KEY) {
    console.warn('CLEARBIT_API_KEY not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          Authorization: `Bearer ${CLEARBIT_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null // Company not found
      }
      throw new Error(`Clearbit API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Clearbit fetch error:', error)
    return null
  }
}

// ============================================================================
// LOGO APIS
// ============================================================================

/**
 * Fetch logo using Clearbit Logo API (free, no auth required)
 */
async function fetchClearbitLogo(domain: string): Promise<string | null> {
  const logoUrl = `https://logo.clearbit.com/${domain}`

  try {
    const response = await fetch(logoUrl, { method: 'HEAD' })
    if (response.ok) {
      return logoUrl
    }
    return null
  } catch {
    return null
  }
}

/**
 * Fetch logo using Google Favicon API (free fallback)
 */
function getGoogleFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

/**
 * Fetch logo using DuckDuckGo icons (free fallback)
 */
function getDuckDuckGoIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

// ============================================================================
// COMPANY ENRICHMENT SERVICE
// ============================================================================

export class CompanyEnrichmentService {
  /**
   * Enrich company data from domain
   */
  async enrichFromDomain(
    domain: string,
    options: EnrichmentOptions = {}
  ): Promise<CompanyEnrichmentResult> {
    const {
      useClearbit = true,
      useFirecrawl = true,
      useTavily = false,
      useLogoApi = true,
      fetchLogo = true,
      fetchCompanyData = true,
      useCache = true,
      cacheTtlMinutes = 60 * 24, // 24 hours
    } = options

    // Clean domain
    const cleanDomain = this.cleanDomain(domain)
    if (!cleanDomain) {
      return {
        success: false,
        source: 'manual',
        data: {},
        error: 'Invalid domain',
        enrichedAt: new Date().toISOString(),
      }
    }

    // Check cache first
    if (useCache) {
      const cached = await this.getCachedEnrichment(cleanDomain, cacheTtlMinutes)
      if (cached) {
        return cached
      }
    }

    let result: CompanyEnrichmentResult = {
      success: false,
      source: 'combined',
      data: { domain: cleanDomain },
      enrichedAt: new Date().toISOString(),
    }

    // Try Clearbit first (most comprehensive)
    if (useClearbit && fetchCompanyData) {
      const clearbitData = await fetchClearbitCompany(cleanDomain)
      if (clearbitData) {
        result = {
          success: true,
          source: 'clearbit',
          data: this.mapClearbitData(clearbitData),
          enrichedAt: new Date().toISOString(),
        }
      }
    }

    // Try to get logo if we don't have one
    if (fetchLogo && !result.data.logoUrl) {
      if (useLogoApi) {
        const logoUrl = await fetchClearbitLogo(cleanDomain)
        if (logoUrl) {
          result.data.logoUrl = logoUrl
          result.success = true
        }
      }

      // Fallback to favicon
      if (!result.data.logoUrl) {
        result.data.faviconUrl = getGoogleFaviconUrl(cleanDomain)
      }
    }

    // Try Firecrawl for additional branding data
    if (useFirecrawl && (!result.data.logoUrl || !result.data.description)) {
      try {
        const { FirecrawlService } = await import('@/lib/services/firecrawl.service')
        const websiteUrl = `https://${cleanDomain}`
        const firecrawlData = await FirecrawlService.scrapeWebsite(websiteUrl)

        if (firecrawlData) {
          // Merge with existing data (don't overwrite)
          result.data = {
            ...result.data,
            logoUrl: result.data.logoUrl || firecrawlData.logo_url || undefined,
            faviconUrl: result.data.faviconUrl || firecrawlData.favicon_url || undefined,
            name: result.data.name || firecrawlData.company_name || undefined,
            description: result.data.description || firecrawlData.description || undefined,
            primaryColor: result.data.primaryColor || firecrawlData.primary_color || undefined,
          }
          result.success = true
          result.source = result.source === 'clearbit' ? 'combined' : 'firecrawl'
        }
      } catch (error) {
        console.error('Firecrawl error:', error)
      }
    }

    // Try Tavily as last resort
    if (useTavily && !result.success) {
      try {
        const { TavilyService } = await import('@/lib/services/tavily.service')
        const tavilyData = await TavilyService.researchCompany(cleanDomain)

        if (tavilyData) {
          result.data = {
            ...result.data,
            name: result.data.name || tavilyData.company_name || undefined,
            description: result.data.description || tavilyData.description || undefined,
            logoUrl: result.data.logoUrl || tavilyData.logo_url || undefined,
            industry: result.data.industry || tavilyData.industry || undefined,
          }
          result.success = true
          result.source = 'tavily'
        }
      } catch (error) {
        console.error('Tavily error:', error)
      }
    }

    // Cache successful results
    if (result.success && useCache) {
      await this.cacheEnrichment(cleanDomain, result)
    }

    return result
  }

  /**
   * Fetch just the logo for a domain
   */
  async fetchLogo(domain: string): Promise<string | null> {
    const cleanDomain = this.cleanDomain(domain)
    if (!cleanDomain) return null

    // Try Clearbit Logo API first (free)
    const clearbitLogo = await fetchClearbitLogo(cleanDomain)
    if (clearbitLogo) return clearbitLogo

    // Try Firecrawl
    try {
      const { FirecrawlService } = await import('@/lib/services/firecrawl.service')
      const websiteUrl = `https://${cleanDomain}`
      const data = await FirecrawlService.scrapeWebsite(websiteUrl)
      if (data?.logo_url) return data.logo_url
    } catch {
      // Continue to fallback
    }

    // Return Google favicon as last resort
    return getGoogleFaviconUrl(cleanDomain)
  }

  /**
   * Enrich a workspace with company data
   */
  async enrichWorkspace(
    workspaceId: string,
    domain: string,
    options?: EnrichmentOptions
  ): Promise<CompanyEnrichmentResult> {
    const result = await this.enrichFromDomain(domain, options)

    if (result.success) {
      const supabase = await createClient()

      // Build the enrichment data structure
      const enrichmentData: CompanyEnrichmentData = {
        clearbit: result.source === 'clearbit' || result.source === 'combined'
          ? {
              name: result.data.name || '',
              domain: result.data.domain || domain,
              logo: result.data.logoUrl || null,
              description: result.data.description || null,
              founded_year: result.data.foundedYear || null,
              employees: result.data.employeeCount || null,
              employee_range: result.data.employeeRange || null,
              annual_revenue: result.data.annualRevenue || null,
              revenue_range: result.data.revenueRange || null,
              industry: result.data.industry || null,
              industry_group: result.data.industryGroup || null,
              sub_industry: result.data.subIndustry || null,
              tags: result.data.tags || [],
              tech: result.data.technologies || [],
              location: result.data.location
                ? {
                    street_number: result.data.location.streetNumber || null,
                    street_name: result.data.location.streetName || null,
                    city: result.data.location.city || null,
                    state: result.data.location.state || null,
                    state_code: result.data.location.stateCode || null,
                    country: result.data.location.country || null,
                    country_code: result.data.location.countryCode || null,
                    postal_code: result.data.location.postalCode || null,
                  }
                : null,
              linkedin_handle: result.data.linkedinHandle || null,
              twitter_handle: result.data.twitterHandle || null,
              facebook_handle: result.data.facebookHandle || null,
              crunchbase_handle: null,
              enriched_at: result.enrichedAt,
            }
          : undefined,
        enrichment_status: 'success',
        enrichment_error: null,
        last_enriched_at: result.enrichedAt,
      }

      // Update workspace
      const updateData: Record<string, unknown> = {
        company_enrichment_data: enrichmentData,
        onboarding_status: 'completed',
        onboarding_completed_at: new Date().toISOString(),
      }

      // Set logo if we found one
      if (result.data.logoUrl) {
        updateData.logo_url = result.data.logoUrl
      }

      // Set company details
      if (result.data.employeeRange) {
        updateData.company_size = result.data.employeeRange
      }
      if (result.data.revenueRange) {
        updateData.annual_revenue = result.data.revenueRange
      }
      if (result.data.industry) {
        updateData.industry_vertical = result.data.industry
      }

      await supabase
        .from('workspaces')
        .update(updateData)
        .eq('id', workspaceId)
    }

    return result
  }

  /**
   * Clean and validate domain
   */
  private cleanDomain(input: string): string | null {
    if (!input) return null

    let domain = input.trim().toLowerCase()

    // Remove protocol
    domain = domain.replace(/^https?:\/\//, '')

    // Remove www
    domain = domain.replace(/^www\./, '')

    // Remove path
    domain = domain.split('/')[0]

    // Remove port
    domain = domain.split(':')[0]

    // Basic validation
    if (!domain.includes('.')) return null
    if (domain.length < 4) return null

    return domain
  }

  /**
   * Map Clearbit response to our format
   */
  private mapClearbitData(data: ClearbitCompany): CompanyEnrichmentResult['data'] {
    return {
      name: data.name,
      domain: data.domain,
      description: data.description,
      logoUrl: data.logo || undefined,
      industry: data.category?.industry,
      industryGroup: data.category?.industryGroup,
      subIndustry: data.category?.subIndustry,
      employeeCount: data.metrics?.employees,
      employeeRange: data.metrics?.employeesRange,
      annualRevenue: data.metrics?.annualRevenue,
      revenueRange: data.metrics?.estimatedAnnualRevenue,
      foundedYear: data.foundedYear,
      location: data.geo
        ? {
            streetNumber: data.geo.streetNumber,
            streetName: data.geo.streetName,
            city: data.geo.city,
            state: data.geo.state,
            stateCode: data.geo.stateCode,
            country: data.geo.country,
            countryCode: data.geo.countryCode,
            postalCode: data.geo.postalCode,
          }
        : undefined,
      linkedinHandle: data.linkedin?.handle,
      twitterHandle: data.twitter?.handle,
      facebookHandle: data.facebook?.handle,
      technologies: data.tech,
      tags: data.tags,
    }
  }

  /**
   * Get cached enrichment result
   */
  private async getCachedEnrichment(
    domain: string,
    ttlMinutes: number
  ): Promise<CompanyEnrichmentResult | null> {
    try {
      const supabase = await createClient()

      const { data } = await supabase
        .from('company_enrichment_cache')
        .select('*')
        .eq('domain', domain)
        .single()

      if (!data) return null

      // Check TTL
      const cachedAt = new Date(data.cached_at)
      const now = new Date()
      const diffMinutes = (now.getTime() - cachedAt.getTime()) / (1000 * 60)

      if (diffMinutes > ttlMinutes) {
        return null // Cache expired
      }

      return data.enrichment_data as CompanyEnrichmentResult
    } catch {
      return null
    }
  }

  /**
   * Cache enrichment result
   */
  private async cacheEnrichment(
    domain: string,
    result: CompanyEnrichmentResult
  ): Promise<void> {
    try {
      const supabase = await createClient()

      await supabase.from('company_enrichment_cache').upsert(
        {
          domain,
          enrichment_data: result,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'domain' }
      )
    } catch (error) {
      console.error('Failed to cache enrichment:', error)
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let instance: CompanyEnrichmentService | null = null

export function getCompanyEnrichmentService(): CompanyEnrichmentService {
  if (!instance) {
    instance = new CompanyEnrichmentService()
  }
  return instance
}
