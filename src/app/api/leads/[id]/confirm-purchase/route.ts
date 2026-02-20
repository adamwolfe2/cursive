/**
 * Lead Purchase Confirmation API
 * POST /api/leads/[id]/confirm-purchase
 * Called after successful Stripe payment to record purchase and credit partner
 */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'
import { PartnerRepository } from '@/lib/db/repositories/partner.repository'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'

const ConfirmPurchaseSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID required'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resolvedLeadId } = await params

    // Authenticate user
    const supabaseAuth = await createClient()
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const stripe = getStripeClient()
    const body = await request.json()
    const parsed = ConfirmPurchaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { paymentIntentId } = parsed.data

    // Verify payment succeeded with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not successful' },
        { status: 400 }
      )
    }

    // Verify metadata matches
    const leadId = paymentIntent.metadata.lead_id
    const partnerId = paymentIntent.metadata.partner_id
    const buyerId = paymentIntent.metadata.buyer_user_id

    if (leadId !== resolvedLeadId) {
      return NextResponse.json(
        { error: 'Lead ID mismatch' },
        { status: 400 }
      )
    }

    // Verify the authenticated user matches the buyer in the Stripe metadata
    const { data: buyerProfile } = await supabaseAuth
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (!buyerProfile || buyerProfile.id !== buyerId) {
      return NextResponse.json(
        { error: 'Authenticated user does not match buyer' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Check if already recorded (idempotency)
    const { data: existingPurchase } = await supabase
      .from('lead_purchases')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (existingPurchase) {
      return NextResponse.json({ success: true, alreadyRecorded: true })
    }

    // Use the actual Stripe payment amount (not hardcoded)
    const purchasePrice = paymentIntent.amount / 100 // Stripe uses cents
    const PARTNER_COMMISSION_RATE = 0.70
    const partnerCommission = partnerId !== 'none'
      ? Math.round(purchasePrice * PARTNER_COMMISSION_RATE * 100) / 100
      : 0
    const platformFee = Math.round((purchasePrice - partnerCommission) * 100) / 100

    // Record purchase using repository
    // This automatically credits the partner via credit_partner_for_sale() database function
    const partnerRepo = new PartnerRepository()
    const purchase = await partnerRepo.recordLeadPurchase({
      lead_id: leadId,
      buyer_user_id: buyerId,
      partner_id: partnerId !== 'none' ? partnerId : null,
      purchase_price: purchasePrice,
      partner_commission: partnerCommission,
      platform_fee: platformFee,
      stripe_payment_intent_id: paymentIntentId,
    })

    // Get buyer's workspace to assign lead
    const { data: buyer } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('id', buyerId)
      .maybeSingle()

    if (!buyer) {
      throw new Error('Buyer not found')
    }

    // Get the lead data needed for existence check
    const { data: leadData } = await supabase
      .from('leads')
      .select('id')
      .eq('id', leadId)
      .maybeSingle()

    if (!leadData) {
      throw new Error('Lead not found')
    }

    // Update lead: assign to buyer's workspace, guard against double-sell
    const { error: updateError, count: updatedCount } = await supabase
      .from('leads')
      .update({
        workspace_id: buyer.workspace_id, // Assign to buyer's workspace
        status: 'new', // Set as new lead in CRM
        assigned_user_id: buyerId, // Assign to the purchaser
        sold_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .is('sold_at', null) // Guard: only update if not already sold

    if (updateError) {
      safeError('[Confirm Purchase] Failed to update lead:', updateError)
      throw new Error('Failed to assign purchased lead to buyer')
    }

    return NextResponse.json({ success: true, purchaseId: purchase.id })
  } catch (error) {
    safeError('[Confirm Purchase] Error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm purchase' },
      { status: 500 }
    )
  }
}
