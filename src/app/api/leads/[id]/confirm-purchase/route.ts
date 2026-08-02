export const maxDuration = 30

/**
 * Lead Purchase Confirmation API
 * POST /api/leads/[id]/confirm-purchase
 * Called after successful Stripe payment to record purchase and credit partner
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { unauthorized } from '@/lib/utils/api-error-handler'
import { getStripeClient } from '@/lib/stripe/client'
import { fulfilLeadPurchase } from '@/lib/marketplace/lead-fulfilment'
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

    const user = await getCurrentUser()
    if (!user) return unauthorized()

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
    if (user.id !== buyerId) {
      return NextResponse.json(
        { error: 'Authenticated user does not match buyer' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Fulfilment itself is shared with the payment_intent.succeeded webhook,
    // which now runs the same path if the buyer's browser never gets here.
    // This route keeps the auth checks above; the webhook has Stripe's
    // signature instead.
    const result = await fulfilLeadPurchase({
      supabase,
      paymentIntentId,
      leadId,
      buyerUserId: buyerId,
      buyerWorkspaceId: user.workspace_id,
      partnerId,
      amountInCents: paymentIntent.amount,
    })

    if (result.status === 'already_recorded') {
      return NextResponse.json({ success: true, alreadyRecorded: true })
    }

    if (result.status === 'double_sell') {
      // Fails loudly instead of lying, but the capture is not reversed —
      // refunding automatically is a money-moving side effect left for a
      // human to decide. See AUTONOMOUS_IMPROVEMENT_LOG.md.
      return NextResponse.json(
        {
          error:
            'This lead was purchased by someone else moments ago. Your payment has been flagged for refund — support has been notified.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json({ success: true, purchaseId: result.purchaseId })
  } catch (error) {
    safeError('[Confirm Purchase] Error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm purchase' },
      { status: 500 }
    )
  }
}
