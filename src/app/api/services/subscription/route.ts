import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'

/**
 * GET /api/services/subscription
 * Get the workspace's active service subscription with tier details
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData || !userData.workspace_id) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const workspaceId = userData.workspace_id

    // Get active subscription
    const subscription = await serviceTierRepository.getWorkspaceActiveSubscription(workspaceId)

    if (!subscription) {
      return NextResponse.json({
        has_subscription: false,
        subscription: null,
        tier: null
      })
    }

    // Get tier details
    const tier = await serviceTierRepository.getTierById(subscription.service_tier_id)

    // Get recent deliveries
    const deliveries = await serviceTierRepository.getSubscriptionDeliveries(subscription.id)
    const recentDeliveries = deliveries.slice(0, 5)

    const sub = subscription as any

    return NextResponse.json({
      has_subscription: true,
      subscription: {
        id: sub.id,
        status: sub.status,
        monthly_price: sub.monthly_price,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        onboarding_completed: sub.onboarding_completed,
        created_at: sub.created_at
      },
      tier: tier ? {
        id: tier.id,
        slug: tier.slug,
        name: tier.name,
        description: tier.description,
        features: tier.features,
        platform_features: (tier as any).platform_features
      } : null,
      recent_deliveries: recentDeliveries.map((d: any) => ({
        id: d.id,
        delivery_type: d.delivery_type,
        status: d.status,
        delivery_period_start: d.delivery_period_start,
        delivery_period_end: d.delivery_period_end,
        delivered_at: d.delivered_at
      }))
    })
  } catch (error) {
    console.error('[API] Error fetching service subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
