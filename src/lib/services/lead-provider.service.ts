/**
 * Unified Lead Provider Service
 * Cursive Platform
 *
 * Manages lead data flow with tier-based rate limiting and usage tracking.
 * Primary data source: AudienceLab (CDP/webhook receiver).
 * Leads flow in via SuperPixel/AudienceSync webhooks and batch imports.
 * See src/lib/integrations/audience-labs.ts for architecture notes.
 */

import { createClient } from '@/lib/supabase/server'
import { safeWarn } from '@/lib/utils/log-sanitizer'

// ============================================================================
// TYPES
// ============================================================================

export type LeadProvider = 'audience_labs' | 'manual'

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
  constructor() {
    // AudienceLab leads arrive via webhooks, no client initialization needed
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
    const rawTier = (tierInfo as any)?.product_tiers
    const tier = (Array.isArray(rawTier) ? rawTier[0] : rawTier) as { name: string; daily_lead_limit: number; monthly_lead_limit: number | null } | null
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

    // AudienceLab is the primary provider; leads arrive via webhooks
    const provider: LeadProvider = preferredProvider || 'audience_labs'

    let leads: LeadResult[]

    if (provider === 'audience_labs') {
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
    if (insertError) safeWarn('lead_usage insert skipped:', insertError.message)
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
    audienceLabs: { healthy: boolean; error?: string }
  }> {
    // AL is a webhook receiver — check if we have recent events as a health proxy
    const alHealth: { healthy: boolean; error?: string } = {
      healthy: !!process.env.AUDIENCELAB_WEBHOOK_SECRET,
      error: process.env.AUDIENCELAB_WEBHOOK_SECRET ? undefined : 'AUDIENCELAB_WEBHOOK_SECRET not configured',
    }

    return {
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
