/**
 * Workspace Tier API
 * GET /api/workspace/tier - Get current workspace tier info, features, and usage
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
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

    // Get workspace tier info
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
          features,
          price_monthly,
          price_yearly
        )
      `)
      .eq('workspace_id', user.workspace_id)
      .single()

    // Get today's lead usage
    const today = new Date().toISOString().split('T')[0]
    const { count: dailyLeadsUsed } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', user.workspace_id)
      .gte('created_at', `${today}T00:00:00Z`)

    // Get this month's lead usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { count: monthlyLeadsUsed } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', user.workspace_id)
      .gte('created_at', startOfMonth.toISOString())

    // Get team members count
    const { count: teamMembersUsed } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', user.workspace_id)

    // Get campaigns count
    const { count: campaignsUsed } = await supabase
      .from('email_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', user.workspace_id)

    // Get templates count
    const { count: templatesUsed } = await supabase
      .from('email_templates')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', user.workspace_id)

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

    // Merge default features with tier features and any overrides
    const features: ProductTierFeatures = {
      ...DEFAULT_FEATURES,
      ...(productTier?.features || {}),
      ...(tierInfo?.feature_overrides || {}),
    }

    // Calculate effective limits (with overrides)
    const dailyLimit = tierInfo?.daily_lead_limit_override ?? productTier?.daily_lead_limit ?? 3
    const monthlyLimit = tierInfo?.monthly_lead_limit_override ?? productTier?.monthly_lead_limit ?? null

    return NextResponse.json({
      success: true,
      tier: {
        id: productTier?.id || 'free',
        name: productTier?.name || 'Free',
        slug: productTier?.slug || 'free',
        features,
        priceMonthly: productTier?.price_monthly || 0,
        priceYearly: productTier?.price_yearly || 0,
      },
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
        emailAccountsUsed: 1, // TODO: Track actual email account count
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
    console.error('Get tier info error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get tier info' },
      { status: 500 }
    )
  }
}
