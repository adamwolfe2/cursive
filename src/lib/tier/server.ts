/**
 * Server-Side Tier Checking
 * Cursive Platform
 *
 * Helpers for checking tier features and limits in API routes and server components.
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
}

/**
 * Get tier info for a workspace
 */
export async function getWorkspaceTier(workspaceId: string): Promise<WorkspaceTierInfo> {
  const supabase = await createClient()

  const { data: tierInfo } = await supabase
    .from('workspace_tiers')
    .select(`
      *,
      product_tiers (
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
    name: string
    slug: string
    daily_lead_limit: number
    monthly_lead_limit: number | null
    features: ProductTierFeatures
  } | null

  // Merge features with overrides
  const features: ProductTierFeatures = {
    ...DEFAULT_FEATURES,
    ...(productTier?.features || {}),
    ...(tierInfo?.feature_overrides || {}),
  }

  return {
    tierSlug: productTier?.slug || 'free',
    tierName: productTier?.name || 'Free',
    features,
    dailyLeadLimit: tierInfo?.daily_lead_limit_override ?? productTier?.daily_lead_limit ?? 3,
    monthlyLeadLimit: tierInfo?.monthly_lead_limit_override ?? productTier?.monthly_lead_limit ?? null,
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
