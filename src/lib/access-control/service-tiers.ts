import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import type { Database } from '@/types/supabase'

type ServiceTier = Database['public']['Tables']['service_tiers']['Row']
type PlatformFeatures = {
  lead_downloads?: boolean
  campaigns?: boolean
  ai_agents?: boolean
  api_access?: boolean
  team_seats?: number
  daily_lead_limit?: number
  white_label?: boolean
  custom_integrations?: boolean
}

export class ServiceTierAccessControl {
  private workspaceId: string
  private cachedTier: ServiceTier | null = null

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  /**
   * Get the active service tier for this workspace
   */
  async getActiveServiceTier(): Promise<ServiceTier | null> {
    if (this.cachedTier) {
      return this.cachedTier
    }

    const subscription = await serviceTierRepository.getWorkspaceActiveSubscription(this.workspaceId)

    if (!subscription) {
      return null
    }

    const tier = await serviceTierRepository.getTierById(subscription.service_tier_id)
    this.cachedTier = tier
    return tier
  }

  /**
   * Get platform features for this workspace
   */
  async getPlatformFeatures(): Promise<PlatformFeatures> {
    const tier = await this.getActiveServiceTier()

    if (!tier || !tier.platform_features) {
      // Default features for users without service subscription
      return {
        lead_downloads: false,
        campaigns: false,
        ai_agents: false,
        api_access: false,
        team_seats: 1,
        daily_lead_limit: 10
      }
    }

    return tier.platform_features as PlatformFeatures
  }

  /**
   * Check if workspace can access a specific feature
   */
  async canAccessFeature(feature: keyof PlatformFeatures): Promise<boolean> {
    const features = await this.getPlatformFeatures()
    const value = features[feature]

    // Boolean features
    if (typeof value === 'boolean') {
      return value
    }

    // Numeric limits (presence means enabled)
    if (typeof value === 'number') {
      return value > 0 || value === -1 // -1 means unlimited
    }

    return false
  }

  /**
   * Require a feature (throws if not available)
   */
  async requireFeature(feature: keyof PlatformFeatures): Promise<void> {
    const canAccess = await this.canAccessFeature(feature)

    if (!canAccess) {
      const tier = await this.getActiveServiceTier()
      const tierName = tier?.name || 'a service tier'

      throw new FeatureAccessError(
        `This feature requires ${tierName}. Please upgrade your service plan.`,
        feature
      )
    }
  }

  /**
   * Get a numeric limit for a feature
   */
  async getFeatureLimit(limitType: 'team_seats' | 'daily_lead_limit'): Promise<number> {
    const features = await this.getPlatformFeatures()
    return features[limitType] || 0
  }

  /**
   * Check if a limit has been reached
   */
  async isLimitReached(limitType: 'team_seats' | 'daily_lead_limit', currentUsage: number): Promise<boolean> {
    const limit = await this.getFeatureLimit(limitType)

    // -1 means unlimited
    if (limit === -1) {
      return false
    }

    return currentUsage >= limit
  }

  /**
   * Get recommended upgrade tier for a feature
   */
  async getRecommendedUpgradeForFeature(feature: keyof PlatformFeatures): Promise<ServiceTier | null> {
    const canAccess = await this.canAccessFeature(feature)

    if (canAccess) {
      return null // Already has access
    }

    // Get all public tiers
    const tiers = await serviceTierRepository.getAllPublicTiers()

    // Find cheapest tier that includes this feature
    for (const tier of tiers) {
      const tierFeatures = (tier.platform_features as PlatformFeatures) || {}
      const featureValue = tierFeatures[feature]

      if (typeof featureValue === 'boolean' && featureValue === true) {
        return tier
      }

      if (typeof featureValue === 'number' && (featureValue > 0 || featureValue === -1)) {
        return tier
      }
    }

    return null
  }

  /**
   * Get service tier slug (for routing/display)
   */
  async getTierSlug(): Promise<string | null> {
    const tier = await this.getActiveServiceTier()
    return tier?.slug || null
  }

  /**
   * Check if workspace has any active service subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    const tier = await this.getActiveServiceTier()
    return tier !== null
  }

  /**
   * Get tier display name
   */
  async getTierName(): Promise<string> {
    const tier = await this.getActiveServiceTier()
    return tier?.name || 'Free'
  }
}

/**
 * Custom error for feature access denial
 */
export class FeatureAccessError extends Error {
  public readonly feature: string

  constructor(message: string, feature: string) {
    super(message)
    this.name = 'FeatureAccessError'
    this.feature = feature
  }
}

/**
 * Helper function to create access control instance
 */
export function createAccessControl(workspaceId: string): ServiceTierAccessControl {
  return new ServiceTierAccessControl(workspaceId)
}

/**
 * Middleware-style helper to check feature access in API routes
 */
export async function requireServiceFeature(
  workspaceId: string,
  feature: keyof PlatformFeatures
): Promise<void> {
  const access = createAccessControl(workspaceId)
  await access.requireFeature(feature)
}
