// Marketplace Purchase API
// Purchase leads using credits or Stripe

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { COMMISSION_CONFIG, calculateCommission } from '@/lib/services/commission.service'
import { sendPurchaseConfirmationEmail } from '@/lib/email/service'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const purchaseSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(100),
  paymentMethod: z.enum(['credits', 'stripe']).default('credits'),
  idempotencyKey: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  let idempotencyKey: string | undefined
  let workspaceId: string | undefined

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

    workspaceId = userData.workspace_id

    // RATE LIMITING: Check purchase rate limit (10 per minute per user)
    const rateLimitResult = await withRateLimit(
      request,
      'marketplace-purchase',
      `user:${user.id}`
    )
    if (rateLimitResult) {
      return rateLimitResult
    }

    const body = await request.json()
    const validated = purchaseSchema.parse(body)
    idempotencyKey = validated.idempotencyKey

    // IDEMPOTENCY: Check if request already processed
    if (validated.idempotencyKey) {
      const adminClient = createAdminClient()
      const { data: existingKey } = await adminClient
        .from('api_idempotency_keys')
        .select('status, response_data, completed_at')
        .eq('idempotency_key', validated.idempotencyKey)
        .eq('workspace_id', userData.workspace_id)
        .eq('endpoint', '/api/marketplace/purchase')
        .single()

      if (existingKey) {
        // Request already processed - return cached response
        if (existingKey.status === 'completed' && existingKey.response_data) {
          console.log(`Idempotent request detected: ${validated.idempotencyKey}`)
          return NextResponse.json(existingKey.response_data)
        }

        // Request currently processing - return conflict
        if (existingKey.status === 'processing') {
          return NextResponse.json(
            { error: 'Request already in progress. Please try again shortly.' },
            { status: 409 }
          )
        }

        // Request failed previously - allow retry (don't return early)
      } else {
        // Create new idempotency key record
        await adminClient.from('api_idempotency_keys').insert({
          idempotency_key: validated.idempotencyKey,
          workspace_id: userData.workspace_id,
          endpoint: '/api/marketplace/purchase',
          status: 'processing',
        })
      }
    }

    const repo = new MarketplaceRepository()

    // Get the leads being purchased
    const leads = await repo.getLeadsByIds(validated.leadIds)

    if (leads.length !== validated.leadIds.length) {
      return NextResponse.json(
        { error: 'Some leads are no longer available' },
        { status: 400 }
      )
    }

    // Fetch partner data for commission calculation with bonuses
    const uniquePartnerIds = [...new Set(leads.map(l => l.partner_id).filter(Boolean))] as string[]
    const partnersMap = new Map<string, any>()

    if (uniquePartnerIds.length > 0) {
      const { data: partners } = await supabase
        .from('partners')
        .select('id, verification_pass_rate, bonus_commission_rate, base_commission_rate')
        .in('id', uniquePartnerIds)

      if (partners) {
        partners.forEach(p => partnersMap.set(p.id, p))
      }
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

      // Add purchase items with commission calculations including bonuses
      const purchaseItems = leads.map((lead) => {
        const price = lead.marketplace_price || 0.05

        // Calculate commission with bonuses if lead has a partner
        if (lead.partner_id && partnersMap.has(lead.partner_id)) {
          const partner = partnersMap.get(lead.partner_id)!
          const commissionCalc = calculateCommission({
            salePrice: price,
            partner: {
              id: partner.id,
              verification_pass_rate: partner.verification_pass_rate || 0,
              bonus_commission_rate: partner.bonus_commission_rate || 0,
              base_commission_rate: partner.base_commission_rate,
            },
            leadCreatedAt: new Date(lead.created_at),
            saleDate: new Date(),
          })

          return {
            leadId: lead.id,
            priceAtPurchase: price,
            intentScoreAtPurchase: lead.intent_score_calculated,
            freshnessScoreAtPurchase: lead.freshness_score,
            partnerId: lead.partner_id,
            commissionRate: commissionCalc.rate,
            commissionAmount: commissionCalc.amount,
            commissionBonuses: commissionCalc.bonuses,
          }
        }

        // No partner = no commission
        return {
          leadId: lead.id,
          priceAtPurchase: price,
          intentScoreAtPurchase: lead.intent_score_calculated,
          freshnessScoreAtPurchase: lead.freshness_score,
          partnerId: undefined,
          commissionRate: undefined,
          commissionAmount: undefined,
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

      const response = {
        success: true,
        purchase: completedPurchase,
        leads: purchasedLeads,
        totalPrice,
        creditsRemaining: balance - totalPrice,
      }

      // Update idempotency key with successful response
      if (validated.idempotencyKey) {
        const adminClient = createAdminClient()
        await adminClient
          .from('api_idempotency_keys')
          .update({
            status: 'completed',
            response_data: response,
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', validated.idempotencyKey)
          .eq('workspace_id', userData.workspace_id)
      }

      return NextResponse.json(response)
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

      // Add purchase items with commission calculations including bonuses
      const purchaseItems = leads.map((lead) => {
        const price = lead.marketplace_price || 0.05

        // Calculate commission with bonuses if lead has a partner
        if (lead.partner_id && partnersMap.has(lead.partner_id)) {
          const partner = partnersMap.get(lead.partner_id)!
          const commissionCalc = calculateCommission({
            salePrice: price,
            partner: {
              id: partner.id,
              verification_pass_rate: partner.verification_pass_rate || 0,
              bonus_commission_rate: partner.bonus_commission_rate || 0,
              base_commission_rate: partner.base_commission_rate,
            },
            leadCreatedAt: new Date(lead.created_at),
            saleDate: new Date(),
          })

          return {
            leadId: lead.id,
            priceAtPurchase: price,
            intentScoreAtPurchase: lead.intent_score_calculated,
            freshnessScoreAtPurchase: lead.freshness_score,
            partnerId: lead.partner_id,
            commissionRate: commissionCalc.rate,
            commissionAmount: commissionCalc.amount,
            commissionBonuses: commissionCalc.bonuses,
          }
        }

        // No partner = no commission
        return {
          leadId: lead.id,
          priceAtPurchase: price,
          intentScoreAtPurchase: lead.intent_score_calculated,
          freshnessScoreAtPurchase: lead.freshness_score,
          partnerId: undefined,
          commissionRate: undefined,
          commissionAmount: undefined,
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

      const response = {
        success: true,
        checkoutUrl: session.url,
        purchaseId: purchase.id,
        totalPrice,
        leadCount: leads.length,
      }

      // Update idempotency key with Stripe session info
      if (validated.idempotencyKey) {
        const adminClient = createAdminClient()
        await adminClient
          .from('api_idempotency_keys')
          .update({
            status: 'completed',
            response_data: response,
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', validated.idempotencyKey)
          .eq('workspace_id', userData.workspace_id)
      }

      return NextResponse.json(response)
    }
  } catch (error) {
    console.error('Failed to process purchase:', error)

    // Mark idempotency key as failed to allow retry
    if (idempotencyKey && workspaceId) {
      try {
        const adminClient = createAdminClient()
        await adminClient
          .from('api_idempotency_keys')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotencyKey)
          .eq('workspace_id', workspaceId)
      } catch (idempotencyError) {
        console.error('Failed to update idempotency key:', idempotencyError)
      }
    }

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
