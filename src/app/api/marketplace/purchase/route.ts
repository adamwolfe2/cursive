// Marketplace Purchase API
// Purchase leads using credits or Stripe


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { COMMISSION_CONFIG, calculateCommission } from '@/lib/services/commission.service'
import { sendPurchaseConfirmationEmail } from '@/lib/email/service'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { getStripeClient } from '@/lib/stripe/client'
import { TIMEOUTS, getDaysFromNow } from '@/lib/constants/timeouts'
import { safeError } from '@/lib/utils/log-sanitizer'

const purchaseSchema = z.object({
  leadIds: z.array(z.string().uuid('Invalid lead ID format'))
    .min(1, 'At least one lead ID is required')
    .max(100, 'Cannot purchase more than 100 leads at once'),
  paymentMethod: z.enum(['credits', 'stripe'], {
    errorMap: () => ({ message: 'Payment method must be either credits or stripe' })
  }).default('credits'),
  idempotencyKey: z.string().uuid('Invalid idempotency key format').optional(),
})

const purchaseQuerySchema = z.object({
  purchaseId: z.string().uuid('Invalid purchase ID format'),
})

export async function POST(request: NextRequest) {
  let idempotencyKey: string | undefined
  let workspaceId: string | undefined

  try {
    const user = await getCurrentUser()

    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    workspaceId = user.workspace_id

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
    const parseResult = purchaseSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const validated = parseResult.data
    idempotencyKey = validated.idempotencyKey

    // IDEMPOTENCY: Check if request already processed
    if (validated.idempotencyKey) {
      const adminClient = createAdminClient()
      const { data: existingKey } = await adminClient
        .from('api_idempotency_keys')
        .select('status, response_data, completed_at')
        .eq('idempotency_key', validated.idempotencyKey)
        .eq('workspace_id', user.workspace_id)
        .eq('endpoint', '/api/marketplace/purchase')
        .maybeSingle()

      if (existingKey) {
        if (existingKey.status === 'completed' && existingKey.response_data) {
          return NextResponse.json(existingKey.response_data)
        }

        if (existingKey.status === 'processing') {
          return NextResponse.json(
            { error: 'Request already in progress. Please try again shortly.' },
            { status: 409 }
          )
        }
      } else {
        await adminClient.from('api_idempotency_keys').insert({
          idempotency_key: validated.idempotencyKey,
          workspace_id: user.workspace_id,
          endpoint: '/api/marketplace/purchase',
          status: 'processing',
        })
      }
    }

    const repo = new MarketplaceRepository()
    const adminClient = createAdminClient()

    // RACE CONDITION FIX: Use atomic validation with row-level locks
    let leads: any[]
    try {
      const { data: lockedLeads, error: lockError } = await adminClient.rpc(
        'validate_and_lock_leads_for_purchase',
        {
          p_lead_ids: validated.leadIds,
          p_buyer_workspace_id: user.workspace_id,
        }
      )

      if (lockError) {
        if (lockError.message.includes('no longer available') || lockError.code === '55P03') {
          return NextResponse.json(
            { error: 'Some leads are no longer available for purchase. They may have just been purchased by another user.' },
            { status: 409 }
          )
        }
        throw lockError
      }

      if (!lockedLeads || lockedLeads.length !== validated.leadIds.length) {
        return NextResponse.json(
          { error: 'Some leads are no longer available for purchase' },
          { status: 400 }
        )
      }

      leads = lockedLeads
    } catch (error: any) {
      safeError('Failed to validate and lock leads:', error)
      return NextResponse.json(
        { error: 'Failed to validate lead availability' },
        { status: 500 }
      )
    }

    // Fetch partner data for commission calculation with bonuses
    const uniquePartnerIds = [...new Set(leads.map(l => l.partner_id).filter(Boolean))] as string[]
    const partnersMap = new Map<string, any>()

    if (uniquePartnerIds.length > 0) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
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
      const credits = await repo.getWorkspaceCredits(user.workspace_id)
      const balance = credits?.balance || 0

      if (balance < totalPrice) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: totalPrice,
            available: balance,
          },
          { status: 402 }
        )
      }

      const purchase = await repo.createPurchase({
        buyerWorkspaceId: user.workspace_id,
        buyerUserId: user.id,
        leadIds: validated.leadIds,
        totalPrice,
        paymentMethod: 'credits',
        creditsUsed: totalPrice,
      })

      const purchaseItems = leads.map((lead) => {
        const price = lead.marketplace_price || 0.05

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

      // RACE CONDITION FIX: Use atomic function for credit deduction + lead marking + completion
      const { data: completionResult, error: completionError } = await adminClient.rpc(
        'complete_credit_lead_purchase',
        {
          p_purchase_id: purchase.id,
          p_workspace_id: user.workspace_id,
          p_credit_amount: totalPrice,
        }
      )

      if (completionError || !completionResult || completionResult.length === 0) {
        safeError('Failed to complete purchase:', completionError)
        return NextResponse.json(
          { error: 'Failed to complete purchase' },
          { status: 500 }
        )
      }

      const result = completionResult[0]
      if (!result.success) {
        return NextResponse.json(
          { error: result.error_message || 'Failed to complete purchase' },
          { status: 400 }
        )
      }

      const completedPurchase = await repo.getPurchase(purchase.id, user.workspace_id)
      if (!completedPurchase) {
        throw new Error('Failed to retrieve completed purchase')
      }

      const purchasedLeads = await repo.getPurchasedLeads(purchase.id, user.workspace_id)

      try {
        const { inngest } = await import('@/inngest/client')
        const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/marketplace/download/${purchase.id}`
        const downloadExpiresAt = getDaysFromNow(TIMEOUTS.DOWNLOAD_EXPIRY_DAYS)

        await inngest.send({
          name: 'purchase/email.send',
          data: {
            purchaseId: purchase.id,
            userEmail: user.email!,
            userName: user.full_name || 'Valued Customer',
            downloadUrl,
            totalLeads: leads.length,
            totalPrice,
            expiresAt: downloadExpiresAt.toISOString(),
          },
        })
      } catch (emailError) {
        safeError('[Purchase] Failed to queue confirmation email:', emailError)
      }

      if (purchasedLeads && purchasedLeads.length > 0) {
        try {
          const { inngest: inngestClient } = await import('@/inngest/client')
          // Batch all webhook events in a single Inngest call instead of N separate calls
          await inngestClient.send(
            purchasedLeads.map((lead) => ({
              name: 'outbound-webhook/deliver' as const,
              data: {
                workspace_id: user.workspace_id,
                event_type: 'lead.purchased',
                payload: {
                  event: 'lead.purchased',
                  timestamp: new Date().toISOString(),
                  purchase_id: purchase.id,
                  lead: {
                    id: lead.id,
                    first_name: lead.first_name,
                    last_name: lead.last_name,
                    email: lead.email,
                    phone: lead.phone,
                    company_name: lead.company_name,
                    company_industry: lead.company_industry,
                  },
                },
              },
            }))
          )
        } catch (webhookError) {
          safeError('[Purchase] Failed to queue outbound webhook:', webhookError)
        }
      }

      const response = {
        success: true,
        purchase: completedPurchase,
        leads: purchasedLeads,
        totalPrice,
        creditsRemaining: result.new_credit_balance,
      }

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
          .eq('workspace_id', user.workspace_id)
      }

      return NextResponse.json(response)
    } else {
      // Stripe payment - create checkout session
      const stripe = getStripeClient()
      const adminClient = createAdminClient()

      const purchase = await repo.createPurchase({
        buyerWorkspaceId: user.workspace_id,
        buyerUserId: user.id,
        leadIds: validated.leadIds,
        totalPrice,
        paymentMethod: 'stripe',
        creditsUsed: 0,
      } as any)

      const purchaseItems = leads.map((lead) => {
        const price = lead.marketplace_price || 0.05

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

      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
              unit_amount: Math.round(totalPrice * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'lead_purchase',
          purchase_id: purchase.id,
          workspace_id: user.workspace_id,
          user_id: user.id,
          lead_count: String(leads.length),
        },
        success_url: `${origin}/marketplace/history?success=true&purchase=${purchase.id}`,
        cancel_url: `${origin}/marketplace?canceled=true`,
      })

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
          .eq('workspace_id', user.workspace_id)
      }

      return NextResponse.json(response)
    }
  } catch (error) {
    safeError('Failed to process purchase:', error)

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
        safeError('Failed to update idempotency key:', idempotencyError)
      }
    }

    return handleApiError(error)
  }
}

// Get purchase details
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'User workspace not found' }, { status: 403 })
    }

    const queryResult = purchaseQuerySchema.safeParse({
      purchaseId: request.nextUrl.searchParams.get('purchaseId'),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: queryResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { purchaseId } = queryResult.data

    const repo = new MarketplaceRepository()
    const purchase = await repo.getPurchase(purchaseId, user.workspace_id)

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    const leads = await repo.getPurchasedLeads(purchaseId, user.workspace_id)

    return NextResponse.json({
      purchase,
      leads,
    })
  } catch (error) {
    safeError('Failed to get purchase:', error)
    return handleApiError(error)
  }
}
