/**
 * Unified Lead Provider Service
 * Cursive Platform
 *
 * Abstracts multiple lead data providers (DataShopper, AudienceLabs) into a
 * unified interface with tier-based rate limiting and usage tracking.
 */

import { createClient } from '@/lib/supabase/server'
import { DataShopperClient, type DataShopperSearchParams, type DataShopperCompany } from '@/lib/integrations/datashopper'
// NOTE: AudienceLabs is now a CDP/webhook receiver, not a REST API.
// Leads flow in via SuperPixel/AudienceSync webhooks and batch imports.
// See src/lib/integrations/audience-labs.ts for architecture notes.

// ============================================================================
// TYPES
// ============================================================================

export type LeadProvider = 'datashopper' | 'audience_labs' | 'manual'

export interface LeadSearchFilters {
  // Topic/Keyword (for intent-based search)
  topic?: string
  keywords?: string[]

  // Industry targeting
  industries?: string[]

  // Company targeting
  companySizes?: string[]
  revenueRanges?: string[]
  technologies?: string[]

  // Location targeting
  countries?: string[]
  states?: string[]
  cities?: string[]

  // Person targeting
  seniorityLevels?: string[]
  jobTitles?: string[]
  departments?: string[]

  // Pagination
  limit?: number
  offset?: number
}

export interface LeadResult {
  id?: string
  provider: LeadProvider
  providerId?: string

  // Person data
  firstName: string
  lastName: string
  email?: string
  phone?: string
  jobTitle?: string
  seniorityLevel?: string
  department?: string
  linkedinUrl?: string

  // Company data
  companyName: string
  companyDomain?: string
  companyIndustry?: string
  companySize?: string
  companyRevenue?: string
  companyDescription?: string
  companyTechnologies?: string[]

  // Location
  city?: string
  state?: string
  country?: string

  // Intent/Scoring
  intentScore?: number
  intentSignals?: {
    signalType: string
    strength: 'high' | 'medium' | 'low'
    detectedAt: string
    source: string
  }[]

  // Metadata
  tags?: string[]
  fetchedAt: string
}

export interface LeadSearchResult {
  leads: LeadResult[]
  total: number
  provider: LeadProvider
  creditsUsed: number
  remainingCredits: number
}

export interface WorkspaceLeadLimits {
  dailyLimit: number
  dailyUsed: number
  dailyRemaining: number
  monthlyLimit: number | null
  monthlyUsed: number
  monthlyRemaining: number | null
  canFetch: boolean
  tierName: string
}

// ============================================================================
// LEAD PROVIDER SERVICE
// ============================================================================

export class LeadProviderService {
  private dataShopper: DataShopperClient

  constructor() {
    this.dataShopper = new DataShopperClient()
  }

  /**
   * Get workspace lead limits based on tier
   */
  async getWorkspaceLeadLimits(workspaceId: string): Promise<WorkspaceLeadLimits> {
    const supabase = await createClient()

    // Get workspace tier info
    const { data: tierInfo } = await supabase
      .from('workspace_tiers')
      .select(`
        daily_lead_limit_override,
        monthly_lead_limit_override,
        product_tiers (
          name,
          daily_lead_limit,
          monthly_lead_limit
        )
      `)
      .eq('workspace_id', workspaceId)
      .single()

    // Get today's usage
    const today = new Date().toISOString().split('T')[0]
    const { count: dailyUsed } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`)

    // Get this month's usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { count: monthlyUsed } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', startOfMonth.toISOString())

    // Calculate limits
    const tier = tierInfo?.product_tiers as { name: string; daily_lead_limit: number; monthly_lead_limit: number | null } | null
    const dailyLimit = tierInfo?.daily_lead_limit_override ?? tier?.daily_lead_limit ?? 3
    const monthlyLimit = tierInfo?.monthly_lead_limit_override ?? tier?.monthly_lead_limit ?? null

    const dailyRemaining = Math.max(0, dailyLimit - (dailyUsed || 0))
    const monthlyRemaining = monthlyLimit ? Math.max(0, monthlyLimit - (monthlyUsed || 0)) : null

    // Can fetch if within both limits
    const canFetch = dailyRemaining > 0 && (monthlyRemaining === null || monthlyRemaining > 0)

    return {
      dailyLimit,
      dailyUsed: dailyUsed || 0,
      dailyRemaining,
      monthlyLimit,
      monthlyUsed: monthlyUsed || 0,
      monthlyRemaining,
      canFetch,
      tierName: tier?.name || 'Free',
    }
  }

  /**
   * Search for leads using the best available provider
   */
  async searchLeads(
    workspaceId: string,
    filters: LeadSearchFilters,
    preferredProvider?: LeadProvider
  ): Promise<LeadSearchResult> {
    // Check limits first
    const limits = await this.getWorkspaceLeadLimits(workspaceId)

    if (!limits.canFetch) {
      throw new LeadLimitExceededError(
        `Lead limit exceeded. Daily: ${limits.dailyUsed}/${limits.dailyLimit}` +
        (limits.monthlyLimit ? `, Monthly: ${limits.monthlyUsed}/${limits.monthlyLimit}` : ''),
        limits
      )
    }

    // Cap the limit to remaining credits
    const effectiveLimit = Math.min(
      filters.limit || 50,
      limits.dailyRemaining,
      limits.monthlyRemaining ?? Infinity
    )

    // Choose provider
    const provider = preferredProvider || this.selectBestProvider(filters)

    let leads: LeadResult[]

    if (provider === 'datashopper') {
      leads = await this.searchDataShopper(filters, effectiveLimit)
    } else if (provider === 'audience_labs') {
      leads = await this.searchAudienceLabs(filters, effectiveLimit)
    } else {
      throw new Error(`Unknown provider: ${provider}`)
    }

    // Track usage
    await this.trackLeadUsage(workspaceId, leads.length, provider)

    return {
      leads,
      total: leads.length,
      provider,
      creditsUsed: leads.length,
      remainingCredits: limits.dailyRemaining - leads.length,
    }
  }

  /**
   * Search DataShopper for companies with intent signals
   */
  private async searchDataShopper(
    filters: LeadSearchFilters,
    limit: number
  ): Promise<LeadResult[]> {
    const params: DataShopperSearchParams = {
      topic: filters.topic || filters.keywords?.join(' ') || '',
      location: {
        country: filters.countries?.[0],
        state: filters.states?.[0],
        city: filters.cities?.[0],
      },
      industry: filters.industries,
      limit,
    }

    // Map company size to employee counts
    if (filters.companySizes?.length) {
      const sizeMap: Record<string, { min?: number; max?: number }> = {
        '1-10': { min: 1, max: 10 },
        '11-50': { min: 11, max: 50 },
        '51-200': { min: 51, max: 200 },
        '201-500': { min: 201, max: 500 },
        '501-1000': { min: 501, max: 1000 },
        '1001-5000': { min: 1001, max: 5000 },
        '5001+': { min: 5001 },
      }
      const size = sizeMap[filters.companySizes[0]]
      if (size) {
        params.companySize = size
      }
    }

    const response = await this.dataShopper.searchCompanies(params)

    return response.results.map((company): LeadResult => ({
      provider: 'datashopper',
      firstName: '', // DataShopper returns companies, not people
      lastName: '',
      companyName: company.name,
      companyDomain: company.domain,
      companyIndustry: company.industry,
      companySize: company.employee_count?.toString(),
      companyRevenue: company.revenue?.toString(),
      companyDescription: company.description,
      companyTechnologies: company.technologies,
      city: company.location?.city,
      state: company.location?.state,
      country: company.location?.country,
      intentScore: this.calculateIntentScoreNumeric(company.intent_signals),
      intentSignals: company.intent_signals?.map(s => ({
        signalType: s.signal_type,
        strength: s.signal_strength,
        detectedAt: s.detected_at,
        source: s.source,
      })),
      fetchedAt: new Date().toISOString(),
    }))
  }

  /**
   * AudienceLabs leads are received via webhooks, not searched via API.
   * This method is a no-op placeholder — AL leads arrive through:
   * - SuperPixel webhook → /api/webhooks/audiencelab/superpixel
   * - AudienceSync HTTP destination → /api/webhooks/audiencelab/audiencesync
   * - Batch imports → /api/audiencelab/import
   */
  private async searchAudienceLabs(
    _filters: LeadSearchFilters,
    _limit: number
  ): Promise<LeadResult[]> {
    // AudienceLabs is a CDP/webhook platform, not a search API.
    // Leads flow in via webhooks and are processed by Inngest.
    return []
  }

  /**
   * Select the best provider based on search criteria
   */
  private selectBestProvider(filters: LeadSearchFilters): LeadProvider {
    // If searching by topic/intent, use DataShopper
    if (filters.topic || filters.keywords?.length) {
      return 'datashopper'
    }

    // If searching for specific people (job titles, seniority), use AudienceLabs
    if (filters.jobTitles?.length || filters.seniorityLevels?.length) {
      return 'audience_labs'
    }

    // Default to AudienceLabs for person-level data
    return 'audience_labs'
  }

  /**
   * Calculate numeric intent score from signals
   */
  private calculateIntentScoreNumeric(
    signals?: DataShopperCompany['intent_signals']
  ): number {
    if (!signals || signals.length === 0) return 0

    let score = 0
    for (const signal of signals) {
      switch (signal.signal_strength) {
        case 'high':
          score += 30
          break
        case 'medium':
          score += 15
          break
        case 'low':
          score += 5
          break
      }
    }

    // Cap at 100
    return Math.min(100, score)
  }

  /**
   * Track lead usage for billing/analytics
   */
  private async trackLeadUsage(
    workspaceId: string,
    count: number,
    provider: LeadProvider
  ): Promise<void> {
    const supabase = await createClient()

    // Insert usage record
    const { error: insertError } = await supabase.from('lead_usage').insert({
      workspace_id: workspaceId,
      count,
      provider,
      created_at: new Date().toISOString(),
    })
    // Ignore if table doesn't exist yet
    if (insertError) console.warn('lead_usage insert skipped:', insertError.message)
  }

  /**
   * Enrich a single lead with additional data.
   * NOTE: AL enrichment happens server-side via SuperPixel resolution.
   * This method is a placeholder — enrichment data arrives via webhooks.
   */
  async enrichLead(_params: {
    email?: string
    linkedinUrl?: string
    companyDomain?: string
  }): Promise<LeadResult | null> {
    // AudienceLabs enrichment is server-side via SuperPixel, not on-demand API.
    // Enriched data arrives through webhook events.
    return null
  }

  /**
   * Get provider health status
   */
  async getProviderStatus(): Promise<{
    datashopper: { healthy: boolean; error?: string }
    audienceLabs: { healthy: boolean; error?: string }
  }> {
    const dsHealth = await this.dataShopper.healthCheck()

    // AL is a webhook receiver — check if we have recent events as a health proxy
    const alHealth: { healthy: boolean; error?: string } = {
      healthy: !!process.env.AUDIENCELAB_WEBHOOK_SECRET,
      error: process.env.AUDIENCELAB_WEBHOOK_SECRET ? undefined : 'AUDIENCELAB_WEBHOOK_SECRET not configured',
    }

    return {
      datashopper: dsHealth,
      audienceLabs: alHealth,
    }
  }
}

// ============================================================================
// ERRORS
// ============================================================================

export class LeadLimitExceededError extends Error {
  constructor(
    message: string,
    public limits: WorkspaceLeadLimits
  ) {
    super(message)
    this.name = 'LeadLimitExceededError'
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let leadProviderInstance: LeadProviderService | null = null

export function getLeadProviderService(): LeadProviderService {
  if (!leadProviderInstance) {
    leadProviderInstance = new LeadProviderService()
  }
  return leadProviderInstance
}
