/**
 * Workspace Tier API
 * GET /api/workspace/tier - Get current workspace tier info, features, and usage
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import type { ProductTierFeatures } from '@/types'

/** Type for service tier platform_features JSONB column */
interface ServiceTierPlatformFeatures {
  lead_downloads?: boolean
  campaigns?: boolean
  ai_agents?: boolean
  api_access?: boolean
  team_seats?: number
  daily_lead_limit?: number
  white_label?: boolean
  custom_integrations?: boolean
}

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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Run all independent queries in parallel to reduce latency
    const [
      serviceSubscription,
      { data: tierInfo },
      { count: dailyLeadsUsed },
      { count: monthlyLeadsUsed },
      { count: teamMembersUsed },
      { count: campaignsUsed },
      { count: templatesUsed },
      { count: emailAccountsUsed },
    ] = await Promise.all([
      serviceTierRepository.getWorkspaceActiveSubscription(user.workspace_id),
      supabase
        .from('workspace_tiers')
        .select(`
          *,
          product_tiers (
            id, name, slug, daily_lead_limit, monthly_lead_limit,
            features, price_monthly, price_yearly
          )
        `)
        .eq('workspace_id', user.workspace_id)
        .single(),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .gte('created_at', `${today}T00:00:00Z`),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id),
      supabase
        .from('email_campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id),
      supabase
        .from('email_templates')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id),
      supabase
        .from('email_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id),
    ])

    // Fetch service tier details if subscription exists (depends on first query)
    let serviceTierData = null
    if (serviceSubscription) {
      serviceTierData = await serviceTierRepository.getTierById(serviceSubscription.service_tier_id)
    }

    // Build response
    const productTier = tierInfo?.product_tiers as {
      id: string
      name: string
      slug: string
      daily_lead_limit: number
      monthly_lead_limit: number | null
      features: ProductTierFeatures
      price_monthly: number
      price_yearly: number
    } | null

    // Merge features: service tier takes precedence over product tier
    let features: ProductTierFeatures = {
      ...DEFAULT_FEATURES,
      ...(productTier?.features || {}),
      ...(tierInfo?.feature_overrides || {}),
    }

    // If service tier exists, map its platform_features to ProductTierFeatures
    if (serviceTierData && (serviceTierData as any).platform_features) {
      const platformFeatures = (serviceTierData as any).platform_features as ServiceTierPlatformFeatures
      features = {
        ...features,
        campaigns: platformFeatures.campaigns || false,
        templates: platformFeatures.campaigns || false, // Templates enabled with campaigns
        ai_agents: platformFeatures.ai_agents || false,
        api_access: platformFeatures.api_access || false,
        integrations: platformFeatures.api_access || false, // Integrations enabled with API access
        team_members: platformFeatures.team_seats || 1,
        max_campaigns: platformFeatures.campaigns ? -1 : 0, // Unlimited campaigns if enabled
        max_templates: platformFeatures.campaigns ? -1 : 0, // Unlimited templates if campaigns enabled
        white_label: platformFeatures.white_label || false,
        custom_domains: platformFeatures.custom_integrations || false,
        dedicated_support: true, // All service tiers get dedicated support
      }
    }

    // Calculate effective limits
    let dailyLimit = tierInfo?.daily_lead_limit_override ?? productTier?.daily_lead_limit ?? 3
    let monthlyLimit = tierInfo?.monthly_lead_limit_override ?? productTier?.monthly_lead_limit ?? null

    // Service tier limits override product tier limits
    if (serviceTierData && (serviceTierData as any).platform_features) {
      const platformFeatures = (serviceTierData as any).platform_features as ServiceTierPlatformFeatures
      if (platformFeatures.daily_lead_limit !== undefined) {
        dailyLimit = platformFeatures.daily_lead_limit === -1 ? 999999 : platformFeatures.daily_lead_limit
      }
    }

    // Determine which tier to display (service tier takes precedence)
    const displayTier = serviceTierData || productTier
    const tierName = serviceTierData?.name || productTier?.name || 'Free'
    const tierSlug = serviceTierData?.slug || productTier?.slug || 'free'

    return NextResponse.json({
      success: true,
      tier: {
        id: displayTier?.id || 'free',
        name: tierName,
        slug: tierSlug,
        features,
        priceMonthly: productTier?.price_monthly || 0,
        priceYearly: productTier?.price_yearly || 0,
      },
      serviceTier: serviceTierData ? {
        id: serviceTierData.id,
        name: serviceTierData.name,
        slug: serviceTierData.slug,
        monthlyPrice: (serviceSubscription as any)?.monthly_price,
      } : null,
      limits: {
        daily: dailyLimit,
        monthly: monthlyLimit,
      },
      usage: {
        dailyLeadsUsed: dailyLeadsUsed || 0,
        monthlyLeadsUsed: monthlyLeadsUsed || 0,
        teamMembersUsed: teamMembersUsed || 1,
        campaignsUsed: campaignsUsed || 0,
        templatesUsed: templatesUsed || 0,
        emailAccountsUsed: emailAccountsUsed || 0,
      },
      subscription: tierInfo
        ? {
            status: tierInfo.subscription_status,
            billingCycle: tierInfo.billing_cycle,
            trialEndsAt: tierInfo.trial_ends_at,
            currentPeriodEnd: tierInfo.current_period_end,
            cancelAtPeriodEnd: tierInfo.cancel_at_period_end,
          }
        : null,
    })
  } catch (error: any) {
    console.error('[Workspace Tier] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get tier info' },
      { status: 500 }
    )
  }
}
