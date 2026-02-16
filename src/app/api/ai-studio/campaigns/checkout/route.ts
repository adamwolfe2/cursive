export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { getStripeClient } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

// Pricing configuration (amounts in cents)
const TIER_PRICING: Record<string, { price: number; leads: number; name: string }> = {
  starter: { price: 30000, leads: 20, name: 'Starter Campaign' },
  growth: { price: 100000, leads: 100, name: 'Growth Campaign' },
  scale: { price: 150000, leads: 200, name: 'Scale Campaign' },
}

const checkoutSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  tier: z.enum(['starter', 'growth', 'scale']),
  creativeIds: z.array(z.string().uuid()).min(1, 'At least one creative required'),
  profileIds: z.array(z.string().uuid()).optional().default([]),
  landingUrl: z.string().url('Invalid landing page URL'),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate input
    const body = await req.json()
    const validation = checkoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { workspaceId, tier, creativeIds, profileIds, landingUrl } = validation.data

    // 3. Verify workspace access
    if (workspaceId !== user.workspace_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 4. Get tier pricing
    const tierConfig = TIER_PRICING[tier]
    if (!tierConfig) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const supabase = await createClient()

    // 5. Verify creatives belong to user's workspace
    const { data: creatives, error: creativesError } = await supabase
      .from('ad_creatives')
      .select('id, brand_workspace_id, brand_workspaces!inner(workspace_id)')
      .in('id', creativeIds)

    if (creativesError || !creatives || creatives.length !== creativeIds.length) {
      return NextResponse.json(
        { error: 'One or more creatives not found or access denied' },
        { status: 400 }
      )
    }

    // Verify all creatives belong to user's workspace
    for (const creative of creatives) {
      const brandWorkspace = creative.brand_workspaces as unknown as { workspace_id: string }
      if (brandWorkspace.workspace_id !== user.workspace_id) {
        return NextResponse.json(
          { error: 'Creative access denied' },
          { status: 403 }
        )
      }
    }

    // 6. Get brand workspace ID from first creative
    const brandWorkspaceId = creatives[0].brand_workspace_id

    // 7. Create ad campaign record (pending payment)
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .insert({
        brand_workspace_id: brandWorkspaceId,
        objective: 'generate_leads',
        landing_url: landingUrl,
        target_icp_ids: profileIds,
        creative_ids: creativeIds,
        tier,
        tier_price: tierConfig.price,
        leads_guaranteed: tierConfig.leads,
        payment_status: 'pending',
        campaign_status: 'pending',
      })
      .select('id')
      .single()

    if (campaignError || !campaign) {
      safeError('[Campaign Checkout] Failed to create campaign:', campaignError)
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      )
    }

    // 8. Create Stripe checkout session
    const stripe = getStripeClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Cursive ${tierConfig.name}`,
              description: `${tierConfig.leads} guaranteed leads via Meta Ads campaign`,
              metadata: {
                campaign_id: campaign.id,
                tier,
              },
            },
            unit_amount: tierConfig.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'ad_campaign',
        campaign_id: campaign.id,
        workspace_id: workspaceId,
        user_id: user.id,
        tier,
      },
      success_url: `${baseUrl}/ai-studio/campaigns/${campaign.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/ai-studio/campaigns?payment=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout URL' },
        { status: 500 }
      )
    }

    // 9. Store Stripe session ID on campaign
    await supabase
      .from('ad_campaigns')
      .update({ stripe_session_id: session.id })
      .eq('id', campaign.id)

    return NextResponse.json({
      sessionUrl: session.url,
      sessionId: session.id,
      campaignId: campaign.id,
    })
  } catch (error) {
    safeError('[Campaign Checkout] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
