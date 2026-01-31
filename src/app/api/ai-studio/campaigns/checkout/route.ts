/**
 * Campaign Checkout API Route
 * POST /api/ai-studio/campaigns/checkout
 * Creates Stripe checkout session for Meta ads campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const checkoutSchema = z.object({
  workspaceId: z.string(),
  tier: z.enum(['starter', 'growth', 'scale']),
  creativeIds: z.array(z.string()).min(1, 'At least one creative required'),
  profileIds: z.array(z.string()).optional(),
  landingUrl: z.string().url('Invalid landing page URL'),
})

const PRICING_TIERS = {
  starter: { price: 300, leads: 20, name: 'Starter' },
  growth: { price: 1000, leads: 100, name: 'Growth' },
  scale: { price: 1500, leads: 200, name: 'Scale' },
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate input
    const body = await request.json()
    const { workspaceId, tier, creativeIds, profileIds, landingUrl } = checkoutSchema.parse(body)

    const supabase = await createClient()

    // 3. Verify workspace exists and user owns it
    const { data: workspace, error: workspaceError } = await supabase
      .from('brand_workspaces')
      .select('id, name, logo_url')
      .eq('id', workspaceId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // 3a. Validate creative IDs belong to this workspace
    const { data: validCreatives, error: creativesError } = await supabase
      .from('ad_creatives')
      .select('id')
      .in('id', creativeIds)
      .eq('brand_workspace_id', workspaceId)

    if (creativesError || !validCreatives || validCreatives.length !== creativeIds.length) {
      return NextResponse.json(
        { error: 'Invalid creative IDs - some creatives do not belong to this workspace' },
        { status: 400 }
      )
    }

    // 3b. Validate profile IDs belong to this workspace (if provided)
    if (profileIds && profileIds.length > 0) {
      const { data: validProfiles, error: profilesError } = await supabase
        .from('customer_profiles')
        .select('id')
        .in('id', profileIds)
        .eq('brand_workspace_id', workspaceId)

      if (profilesError || !validProfiles || validProfiles.length !== profileIds.length) {
        return NextResponse.json(
          { error: 'Invalid profile IDs - some profiles do not belong to this workspace' },
          { status: 400 }
        )
      }
    }

    // 4. Create campaign record (pending payment)
    const tierConfig = PRICING_TIERS[tier]
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .insert({
        brand_workspace_id: workspaceId,
        objective: 'generate_leads',
        landing_url: landingUrl,
        target_icp_ids: profileIds || [],
        creative_ids: creativeIds,
        tier,
        tier_price: tierConfig.price * 100, // Convert dollars to cents for storage
        leads_guaranteed: tierConfig.leads,
        payment_status: 'pending',
        campaign_status: 'pending',
      })
      .select()
      .single()

    if (campaignError) {
      throw new Error(`Failed to create campaign: ${campaignError.message}`)
    }

    // 5. Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tierConfig.name} Meta Ads Campaign`,
              description: `${tierConfig.leads} guaranteed leads for ${workspace.name}`,
              images: [workspace.logo_url || `${process.env.NEXT_PUBLIC_APP_URL}/cursive-logo.png`],
            },
            unit_amount: tierConfig.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        campaign_id: campaign.id,
        workspace_id: workspaceId,
        user_id: user.auth_user_id,
        tier,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ai-studio/campaigns/success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaign.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ai-studio/campaigns?workspace=${workspaceId}&canceled=true`,
    })

    // 6. Update campaign with Stripe session ID
    await supabase
      .from('ad_campaigns')
      .update({ stripe_session_id: session.id })
      .eq('id', campaign.id)

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
      campaignId: campaign.id,
    })

  } catch (error: any) {
    console.error('[Campaign Checkout] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
