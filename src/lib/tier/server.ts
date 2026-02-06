/**
 * Server-Side Tier Checking
 * Cursive Platform
 *
 * Helpers for checking tier features and limits in API routes and server components.
 *
 * TIER PRECEDENCE:
 * 1. Service Subscriptions (new managed service tiers)
 * 2. Product Tiers (legacy SaaS subscription tiers)
 * 3. Free Tier (default)
 */

import { createClient } from '@/lib/supabase/server'
import type { ProductTierFeatures } from '@/types'

// Default free tier features
const DEFAULT_FEATURES: ProductTierFeatures = {
  campaigns: false,
  templates: false,
  ai_agents: false,
  people_search: true,
  integrations: false,
  api_access: false,
  white_label: false,
  dedicated_support: false,
  custom_domains: false,
  team_members: 1,
  max_campaigns: 0,
  max_templates: 0,
  max_email_accounts: 1,
}

export interface WorkspaceTierInfo {
  tierSlug: string
  tierName: string
  features: ProductTierFeatures
  dailyLeadLimit: number
  monthlyLeadLimit: number | null
  // Metadata for debugging
  source: 'service_tier' | 'product_tier' | 'free' // Which system provided the tier
  serviceTierId?: string // ID of service tier if active
  productTierId?: string // ID of product tier if active
}

/**
 * Map service tier platform_features to ProductTierFeatures
 * Uses same logic as /api/workspace/tier for consistency
 */
function mapServiceTierFeatures(platformFeatures: any): Partial<ProductTierFeatures> {
  return {
    // Core features
    campaigns: platformFeatures.campaigns || false,
    templates: platformFeatures.campaigns || false, // Templates enabled with campaigns
    ai_agents: platformFeatures.ai_agents || false,
    api_access: platformFeatures.api_access || false,
    integrations: platformFeatures.api_access || false, // Integrations enabled with API access

    // Limits (-1 = unlimited)
    team_members: platformFeatures.team_seats || 1,
    max_campaigns: platformFeatures.campaigns ? -1 : 0, // Unlimited campaigns if enabled
    max_templates: platformFeatures.campaigns ? -1 : 0, // Unlimited templates if campaigns enabled
    max_email_accounts: platformFeatures.campaigns ? -1 : 1, // Unlimited email accounts with campaigns

    // Enterprise features
    white_label: platformFeatures.white_label || false,
    custom_domains: platformFeatures.custom_integrations || false,

    // All service tiers get dedicated support
    dedicated_support: true,

    // People search is always available
    people_search: true,
  }
}

/**
 * Get tier info for a workspace
 * Checks both service subscriptions (new) and product tiers (legacy)
 * Service subscriptions take precedence when both exist
 */
export async function getWorkspaceTier(workspaceId: string): Promise<WorkspaceTierInfo> {
  const supabase = await createClient()

  // ============================================================================
  // STEP 1: Check for active service subscription (NEW SYSTEM)
  // ============================================================================

  const { data: serviceSubscription } = await supabase
    .from('service_subscriptions')
    .select(`
      *,
      service_tier:service_tiers (
        id,
        name,
        slug,
        platform_features
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .single()

  const serviceTier = serviceSubscription?.service_tier as {
    id: string
    name: string
    slug: string
    platform_features: any
  } | null

  // If service tier exists, use it (takes precedence)
  if (serviceTier && serviceTier.platform_features) {
    const platformFeatures = serviceTier.platform_features
    const features: ProductTierFeatures = {
      ...DEFAULT_FEATURES,
      ...mapServiceTierFeatures(platformFeatures),
    }

    // Extract daily lead limit from platform_features
    let dailyLeadLimit = 3 // Free tier default
    if (platformFeatures.daily_lead_limit !== undefined) {
      dailyLeadLimit = platformFeatures.daily_lead_limit === -1
        ? 999999 // Unlimited = very high number
        : platformFeatures.daily_lead_limit
    }

    return {
      tierSlug: serviceTier.slug,
      tierName: serviceTier.name,
      features,
      dailyLeadLimit,
      monthlyLeadLimit: null, // Service tiers don't have monthly limits (only daily)
      source: 'service_tier',
      serviceTierId: serviceTier.id,
    }
  }

  // ============================================================================
  // STEP 2: Fallback to legacy product tier (LEGACY SYSTEM)
  // ============================================================================

  const { data: tierInfo } = await supabase
    .from('workspace_tiers')
    .select(`
      *,
      product_tiers (
        id,
        name,
        slug,
        daily_lead_limit,
        monthly_lead_limit,
        features
      )
    `)
    .eq('workspace_id', workspaceId)
    .single()

  const productTier = tierInfo?.product_tiers as {
    id: string
    name: string
    slug: string
    daily_lead_limit: number
    monthly_lead_limit: number | null
    features: ProductTierFeatures
  } | null

  if (productTier) {
    // Merge features with overrides
    const features: ProductTierFeatures = {
      ...DEFAULT_FEATURES,
      ...(productTier.features || {}),
      ...(tierInfo?.feature_overrides || {}),
    }

    return {
      tierSlug: productTier.slug,
      tierName: productTier.name,
      features,
      dailyLeadLimit: tierInfo?.daily_lead_limit_override ?? productTier.daily_lead_limit ?? 3,
      monthlyLeadLimit: tierInfo?.monthly_lead_limit_override ?? productTier.monthly_lead_limit ?? null,
      source: 'product_tier',
      productTierId: productTier.id,
    }
  }

  // ============================================================================
  // STEP 3: Default to free tier
  // ============================================================================

  return {
    tierSlug: 'free',
    tierName: 'Free',
    features: DEFAULT_FEATURES,
    dailyLeadLimit: 3,
    monthlyLeadLimit: null,
    source: 'free',
  }
}

/**
 * Check if a workspace has a specific feature
 */
export async function workspaceHasFeature(
  workspaceId: string,
  feature: keyof ProductTierFeatures
): Promise<boolean> {
  const tier = await getWorkspaceTier(workspaceId)
  const value = tier.features[feature]

  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  return false
}

/**
 * Check if a workspace is within a specific limit
 */
export async function isWorkspaceWithinLimit(
  workspaceId: string,
  resource: 'leads' | 'campaigns' | 'templates' | 'team_members'
): Promise<{ withinLimit: boolean; used: number; limit: number | null }> {
  const supabase = await createClient()
  const tier = await getWorkspaceTier(workspaceId)

  let used = 0
  let limit: number | null = null

  switch (resource) {
    case 'leads': {
      // Check daily lead usage
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', `${today}T00:00:00Z`)

      used = count || 0
      limit = tier.dailyLeadLimit
      break
    }
    case 'campaigns': {
      const { count } = await supabase
        .from('email_campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)

      used = count || 0
      limit = tier.features.max_campaigns === -1 ? null : tier.features.max_campaigns
      break
    }
    case 'templates': {
      const { count } = await supabase
        .from('email_templates')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)

      used = count || 0
      limit = tier.features.max_templates === -1 ? null : tier.features.max_templates
      break
    }
    case 'team_members': {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)

      used = count || 0
      limit = tier.features.team_members === -1 ? null : tier.features.team_members
      break
    }
  }

  const withinLimit = limit === null || used < limit

  return { withinLimit, used, limit }
}

/**
 * Require a feature - throws if not available
 */
export async function requireFeature(
  workspaceId: string,
  feature: keyof ProductTierFeatures,
  errorMessage?: string
): Promise<void> {
  const hasFeature = await workspaceHasFeature(workspaceId, feature)

  if (!hasFeature) {
    const tier = await getWorkspaceTier(workspaceId)
    console.error(
      `[TierCheck] Feature '${String(feature)}' denied for workspace ${workspaceId} (tier: ${tier.tierSlug}, source: ${tier.source})`
    )
    throw new FeatureNotAvailableError(
      errorMessage || `This feature requires an upgrade from your ${tier.tierName} plan.`,
      feature,
      tier.tierSlug
    )
  }

}

/**
 * Require within limit - throws if exceeded
 */
export async function requireWithinLimit(
  workspaceId: string,
  resource: 'leads' | 'campaigns' | 'templates' | 'team_members',
  errorMessage?: string
): Promise<void> {
  const { withinLimit, used, limit } = await isWorkspaceWithinLimit(workspaceId, resource)

  if (!withinLimit) {
    console.error(
      `[TierCheck] Limit exceeded for workspace ${workspaceId}: ${resource} (used: ${used}, limit: ${limit})`
    )
    throw new LimitExceededError(
      errorMessage || `You've reached your limit of ${limit} ${resource.replace('_', ' ')}.`,
      resource,
      used,
      limit || 0
    )
  }

}

// ============================================================================
// ERRORS
// ============================================================================

export class FeatureNotAvailableError extends Error {
  constructor(
    message: string,
    public feature: keyof ProductTierFeatures,
    public currentTier: string
  ) {
    super(message)
    this.name = 'FeatureNotAvailableError'
  }
}

export class LimitExceededError extends Error {
  constructor(
    message: string,
    public resource: string,
    public used: number,
    public limit: number
  ) {
    super(message)
    this.name = 'LimitExceededError'
  }
}
