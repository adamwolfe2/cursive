// Marketplace Purchase API
// Purchase leads using credits or Stripe

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { COMMISSION_CONFIG } from '@/lib/services/commission.service'

const purchaseSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(100),
  paymentMethod: z.enum(['credits', 'stripe']).default('credits'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = purchaseSchema.parse(body)

    const repo = new MarketplaceRepository()

    // Get the leads being purchased
    const leads = await repo.getLeadsByIds(validated.leadIds)

    if (leads.length !== validated.leadIds.length) {
      return NextResponse.json(
        { error: 'Some leads are no longer available' },
        { status: 400 }
      )
    }

    // Calculate total price
    const totalPrice = leads.reduce(
      (sum, lead) => sum + (lead.marketplace_price || 0.05),
      0
    )

    if (validated.paymentMethod === 'credits') {
      // Check credit balance
      const credits = await repo.getWorkspaceCredits(userData.workspace_id)
      const balance = credits?.balance || 0

      if (balance < totalPrice) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: totalPrice,
            available: balance,
          },
          { status: 400 }
        )
      }

      // Create the purchase
      const purchase = await repo.createPurchase({
        buyerWorkspaceId: userData.workspace_id,
        buyerUserId: userData.id,
        leadIds: validated.leadIds,
        totalPrice,
        paymentMethod: 'credits',
        creditsUsed: totalPrice,
      })

      // Add purchase items with commission calculations
      // Note: Full commission calculation with bonuses happens via recordCommission
      const purchaseItems = leads.map((lead) => {
        const price = lead.marketplace_price || 0.05

        // Basic commission calculation using base rate
        // Full calculation with partner-specific bonuses happens in background
        const hasPartner = !!lead.partner_id
        const commissionRate = hasPartner ? COMMISSION_CONFIG.BASE_RATE : 0
        const commissionAmount = hasPartner ? price * commissionRate : 0

        return {
          leadId: lead.id,
          priceAtPurchase: price,
          intentScoreAtPurchase: lead.intent_score_calculated,
          freshnessScoreAtPurchase: lead.freshness_score,
          partnerId: lead.partner_id || undefined,
          commissionRate: hasPartner ? commissionRate : undefined,
          commissionAmount: hasPartner ? commissionAmount : undefined,
          commissionBonuses: [],
        }
      })

      await repo.addPurchaseItems(purchase.id, purchaseItems)

      // Deduct credits
      await repo.deductCredits(userData.workspace_id, totalPrice)

      // Mark leads as sold
      await repo.markLeadsSold(validated.leadIds)

      // Complete the purchase
      const completedPurchase = await repo.completePurchase(purchase.id)

      // Get full lead details for the buyer
      const purchasedLeads = await repo.getPurchasedLeads(purchase.id)

      return NextResponse.json({
        success: true,
        purchase: completedPurchase,
        leads: purchasedLeads,
        totalPrice,
        creditsRemaining: balance - totalPrice,
      })
    } else {
      // Stripe payment - create checkout session
      // For now, return a message that Stripe is not yet configured
      // TODO: Implement Stripe checkout for lead purchases
      return NextResponse.json(
        {
          error: 'Stripe payments for marketplace purchases coming soon',
          totalPrice,
          leadCount: leads.length,
        },
        { status: 501 }
      )
    }
  } catch (error) {
    console.error('Failed to process purchase:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to process purchase' },
      { status: 500 }
    )
  }
}

// Get purchase details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const purchaseId = request.nextUrl.searchParams.get('purchaseId')

    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID required' }, { status: 400 })
    }

    const repo = new MarketplaceRepository()
    const purchase = await repo.getPurchase(purchaseId)

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    const leads = await repo.getPurchasedLeads(purchaseId)

    return NextResponse.json({
      purchase,
      leads,
    })
  } catch (error) {
    console.error('Failed to get purchase:', error)
    return NextResponse.json(
      { error: 'Failed to get purchase' },
      { status: 500 }
    )
  }
}
