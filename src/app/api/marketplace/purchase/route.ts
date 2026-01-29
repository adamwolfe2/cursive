// Marketplace Purchase API
// Purchase leads using credits or Stripe

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { COMMISSION_CONFIG } from '@/lib/services/commission.service'
import { sendPurchaseConfirmationEmail } from '@/lib/email/service'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

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
      .select('id, workspace_id, full_name, email')
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

      // Send purchase confirmation email
      try {
        const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/marketplace/download/${purchase.id}`
        const downloadExpiresAt = new Date()
        downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 90) // 90 days from now

        await sendPurchaseConfirmationEmail(
          userData.email || user.email!,
          userData.full_name || 'Valued Customer',
          {
            totalLeads: leads.length,
            totalPrice,
            purchaseId: purchase.id,
            downloadUrl,
            downloadExpiresAt,
          }
        )
      } catch (emailError) {
        console.error('[Purchase] Failed to send confirmation email:', emailError)
        // Don't fail the purchase if email fails
      }

      return NextResponse.json({
        success: true,
        purchase: completedPurchase,
        leads: purchasedLeads,
        totalPrice,
        creditsRemaining: balance - totalPrice,
      })
    } else {
      // Stripe payment - create checkout session
      const adminClient = createAdminClient()

      // Create pending purchase record
      const purchase = await repo.createPurchase({
        buyerWorkspaceId: userData.workspace_id,
        buyerUserId: userData.id,
        leadIds: validated.leadIds,
        totalPrice,
        paymentMethod: 'stripe',
        creditsUsed: 0,
        status: 'pending',
      })

      // Add purchase items with commission calculations
      const purchaseItems = leads.map((lead) => {
        const price = lead.marketplace_price || 0.05
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

      // Get app URL for redirect
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Lead Purchase (${leads.length} leads)`,
                description: `Purchase of ${leads.length} marketplace leads`,
              },
              unit_amount: Math.round(totalPrice * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'lead_purchase',
          purchase_id: purchase.id,
          workspace_id: userData.workspace_id,
          user_id: userData.id,
          lead_count: String(leads.length),
        },
        success_url: `${origin}/marketplace/history?success=true&purchase=${purchase.id}`,
        cancel_url: `${origin}/marketplace?canceled=true`,
      })

      // Store Stripe session ID on purchase
      await adminClient
        .from('marketplace_purchases')
        .update({
          stripe_session_id: session.id,
        })
        .eq('id', purchase.id)

      return NextResponse.json({
        success: true,
        checkoutUrl: session.url,
        purchaseId: purchase.id,
        totalPrice,
        leadCount: leads.length,
      })
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

    // Get user data with workspace
    const { data: userData } = await supabase
      .from('users')
      .select('id, workspace_id, full_name, email')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'User workspace not found' }, { status: 403 })
    }

    const purchaseId = request.nextUrl.searchParams.get('purchaseId')

    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID required' }, { status: 400 })
    }

    const repo = new MarketplaceRepository()
    // SECURITY: Validate purchase belongs to user's workspace
    const purchase = await repo.getPurchase(purchaseId, userData.workspace_id)

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
