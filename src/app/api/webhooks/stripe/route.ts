import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { handleServiceWebhookEvent } from '@/lib/stripe/service-webhooks'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendCreditPurchaseConfirmationEmail,
  sendPurchaseConfirmationEmail,
  sendEmail,
} from '@/lib/email/service'
import { inngest } from '@/inngest/client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { TIMEOUTS, getDaysFromNow } from '@/lib/constants/timeouts'

// Validation schemas for webhook metadata
const creditPurchaseMetadataSchema = z.object({
  type: z.literal('credit_purchase'),
  credit_purchase_id: z.string().uuid('Invalid credit purchase ID'),
  workspace_id: z.string().uuid('Invalid workspace ID'),
  user_id: z.string().uuid('Invalid user ID'),
  credits: z.string().regex(/^\d+$/, 'Invalid credits format'),
})

const leadPurchaseMetadataSchema = z.object({
  type: z.literal('lead_purchase'),
  purchase_id: z.string().uuid('Invalid purchase ID'),
  workspace_id: z.string().uuid('Invalid workspace ID'),
  user_id: z.string().uuid('Invalid user ID'),
  lead_count: z.string().regex(/^\d+$/, 'Invalid lead count format'),
})

// Lazy-load Stripe
let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeClient) {
    if (!STRIPE_CONFIG.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeClient = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: STRIPE_CONFIG.apiVersion as Stripe.LatestApiVersion,
    })
  }
  return stripeClient
}

const webhookSecret = STRIPE_CONFIG.webhookSecret

// ============================================================================
// CHECKOUT SESSION HANDLERS
// ============================================================================

/**
 * Handle checkout.session.completed events
 * Routes to credit purchase or lead purchase handler based on metadata type
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const sessionFromEvent = event.data.object as Stripe.Checkout.Session

  // Retrieve the full session to ensure we have all metadata
  const session = await getStripe().checkout.sessions.retrieve(sessionFromEvent.id)

  const metadataType = session.metadata?.type

  if (!metadataType) {
    safeLog('[Stripe Webhook] checkout.session.completed missing metadata type, skipping')
    return
  }

  switch (metadataType) {
    case 'credit_purchase':
      await handleCreditPurchaseCompleted(session)
      break
    case 'lead_purchase':
      await handleLeadPurchaseCompleted(session)
      break
    default:
      safeLog(`[Stripe Webhook] Unknown checkout metadata type: ${metadataType}`)
  }
}

/**
 * Handle completed credit purchases
 * Marks purchase as completed, adds credits, sends confirmation email
 */
async function handleCreditPurchaseCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // Validate metadata with Zod
  const metadataValidation = creditPurchaseMetadataSchema.safeParse(session.metadata)

  if (!metadataValidation.success) {
    safeError('[Stripe Webhook] Invalid credit purchase metadata', {
      errors: metadataValidation.error.format(),
      metadata: session.metadata,
    })
    return
  }

  const { credit_purchase_id, workspace_id, user_id, credits } = metadataValidation.data

  const creditsAmount = parseInt(credits, 10)

  safeLog(`[Stripe Webhook] Processing credit purchase: ${credit_purchase_id}`)

  const repo = new MarketplaceRepository()
  const adminClient = createAdminClient()

  // IDEMPOTENCY: Check if already completed before adding credits
  const { data: existingPurchase } = await adminClient
    .from('credit_purchases')
    .select('id, status, completed_at')
    .eq('id', credit_purchase_id)
    .maybeSingle()

  if (existingPurchase?.status === 'completed') {
    safeLog(`[Stripe Webhook] Credit purchase ${credit_purchase_id} already completed, skipping`)
    return
  }

  // Mark the credit purchase record as completed
  const completedPurchase = await repo.completeCreditPurchase(credit_purchase_id)

  // Add credits to the workspace
  await repo.addCredits(workspace_id, creditsAmount, 'purchase')

  // Get the new balance
  const { data: creditsData } = await adminClient
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', workspace_id)
    .maybeSingle()

  const newBalance = creditsData?.balance ?? creditsAmount

  safeLog(`[Stripe Webhook] Credit purchase completed: ${credit_purchase_id}, credits added: ${creditsAmount}, new balance: ${newBalance}`)

  // Send confirmation email (don't fail purchase for email errors)
  try {
    const { data: userData } = await adminClient
      .from('users')
      .select('email, full_name')
      .eq('id', user_id)
      .maybeSingle()

    if (userData?.email) {
      await sendCreditPurchaseConfirmationEmail(
        userData.email,
        userData.full_name || 'Valued Customer',
        {
          creditsAmount,
          totalPrice: (session.amount_total || 0) / 100, // Stripe amounts are in cents
          packageName: completedPurchase.package_name || 'Credit Package',
          newBalance,
        }
      )
    }
  } catch (emailError) {
    safeError('[Stripe Webhook] Failed to send credit purchase confirmation email', emailError)
  }
}

/**
 * Handle completed lead purchases
 * Marks leads as sold, completes purchase, sends confirmation email
 * IDEMPOTENT: Handles duplicate webhook deliveries gracefully
 */
async function handleLeadPurchaseCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // Validate metadata with Zod
  const metadataValidation = leadPurchaseMetadataSchema.safeParse(session.metadata)

  if (!metadataValidation.success) {
    safeError('[Stripe Webhook] Invalid lead purchase metadata', {
      errors: metadataValidation.error.format(),
      metadata: session.metadata,
    })
    return
  }

  const { purchase_id, workspace_id, user_id, lead_count } = metadataValidation.data

  safeLog(`[Stripe Webhook] Processing lead purchase: ${purchase_id}`)

  const adminClient = createAdminClient()

  // RACE CONDITION FIX: Use atomic idempotent completion function
  // This handles duplicate webhook deliveries by checking purchase status first
  // If already completed, returns early without re-processing
  const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/marketplace/download/${purchase_id}`

  const { data: completionResult, error: completionError } = await adminClient.rpc(
    'complete_stripe_lead_purchase',
    {
      p_purchase_id: purchase_id,
      p_download_url: downloadUrl,
    }
  )

  if (completionError) {
    safeError('[Stripe Webhook] Failed to complete purchase', { error: completionError.message })
    throw new Error(`Failed to complete purchase: ${completionError.message}`)
  }

  if (!completionResult || completionResult.length === 0) {
    safeError('[Stripe Webhook] No result from completion function', { purchase_id })
    throw new Error('No result from completion function')
  }

  const result = completionResult[0]

  // Check if this was a duplicate webhook delivery
  if (result.already_completed) {
    safeLog(`[Stripe Webhook] Purchase already completed (idempotent): ${purchase_id}`)
    return // Early return - idempotent handling
  }

  if (!result.success) {
    safeError('[Stripe Webhook] Purchase completion returned failure', { purchase_id })
    throw new Error('Purchase completion failed')
  }

  safeLog(`[Stripe Webhook] Lead purchase completed: ${purchase_id}, leads sold: ${result.lead_ids_marked.length}`)

  // Send confirmation email (don't fail purchase for email errors)
  try {
    const { data: userData } = await adminClient
      .from('users')
      .select('email, full_name')
      .eq('id', user_id)
      .maybeSingle()

    if (userData?.email) {
      const downloadExpiresAt = getDaysFromNow(TIMEOUTS.DOWNLOAD_EXPIRY_DAYS)

      await sendPurchaseConfirmationEmail(
        userData.email,
        userData.full_name || 'Valued Customer',
        {
          totalLeads: parseInt(lead_count, 10),
          totalPrice: (session.amount_total || 0) / 100, // Stripe amounts are in cents
          purchaseId: purchase_id,
          downloadUrl,
          downloadExpiresAt,
        }
      )
    }
  } catch (emailError) {
    safeError('[Stripe Webhook] Failed to send lead purchase confirmation email', emailError)
  }
}

// ============================================================================
// CHARGE & CUSTOMER EVENT HANDLERS
// ============================================================================

/**
 * Handle charge.failed events
 * Logs failure details, notifies the user, and queues an Inngest event
 */
async function handleChargeFailed(event: Stripe.Event): Promise<void> {
  const charge = event.data.object as Stripe.Charge
  const customerId = charge.customer as string | null
  const amountFormatted = (charge.amount / 100).toFixed(2)
  const failureReason = charge.failure_message || charge.failure_code || 'Unknown'

  safeLog('[Stripe Webhook] Charge failed', {
    chargeId: charge.id,
    amount: amountFormatted,
    currency: charge.currency,
    customerId,
    failureReason,
  })

  if (!customerId) {
    safeLog('[Stripe Webhook] charge.failed has no customer ID, skipping user lookup')
    return
  }

  const adminClient = createAdminClient()

  // Look up user by Stripe customer ID
  const { data: userData } = await adminClient
    .from('users')
    .select('id, email, full_name, workspace_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (userData?.workspace_id) {
    // Create a billing notification for the user
    await adminClient.from('notifications').insert({
      workspace_id: userData.workspace_id,
      user_id: userData.id,
      type: 'system',
      category: 'warning',
      title: 'Payment failed',
      message: `A charge of $${amountFormatted} ${charge.currency.toUpperCase()} failed: ${failureReason}`,
      metadata: {
        billing_event: 'charge_failed',
        charge_id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        failure_reason: failureReason,
      },
      priority: 10,
    })
  }

  // Queue Inngest event for further processing
  try {
    await inngest.send({
      name: 'billing/charge-failed',
      data: {
        charge_id: charge.id,
        customer_id: customerId,
        amount: charge.amount,
        currency: charge.currency,
        failure_reason: failureReason,
        user_id: userData?.id || null,
        user_email: userData?.email || null,
      },
    } as any)
  } catch (inngestError) {
    safeError('[Stripe Webhook] Failed to queue billing/charge-failed Inngest event', inngestError)
  }
}

/**
 * Handle charge.refunded events
 * Logs refund details, looks up original purchase, and creates a notification
 */
async function handleChargeRefunded(event: Stripe.Event): Promise<void> {
  const charge = event.data.object as Stripe.Charge
  const customerId = charge.customer as string | null
  const amountRefunded = charge.amount_refunded
  const amountRefundedFormatted = (amountRefunded / 100).toFixed(2)
  const paymentIntentId = charge.payment_intent as string | null

  safeLog('[Stripe Webhook] Charge refunded', {
    chargeId: charge.id,
    amountRefunded: amountRefundedFormatted,
    currency: charge.currency,
    paymentIntentId,
    customerId,
    refundReason: charge.refunds?.data?.[0]?.reason || 'not_specified',
  })

  if (!customerId) {
    safeLog('[Stripe Webhook] charge.refunded has no customer ID, skipping user lookup')
    return
  }

  const adminClient = createAdminClient()

  // Look up user by Stripe customer ID
  const { data: userData } = await adminClient
    .from('users')
    .select('id, email, full_name, workspace_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  // Try to find original purchase by payment_intent ID
  if (paymentIntentId) {
    const { data: creditPurchase } = await adminClient
      .from('credit_purchases')
      .select('id, credits, status')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (creditPurchase) {
      safeLog('[Stripe Webhook] Refund is for credit purchase', {
        creditPurchaseId: creditPurchase.id,
        credits: creditPurchase.credits,
        status: creditPurchase.status,
      })
      // Note: Credit deduction on refund could be implemented here if needed
    } else {
      // Check the purchases table (lead purchases)
      const { data: leadPurchase } = await adminClient
        .from('purchases')
        .select('id, status')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()

      if (leadPurchase) {
        safeLog('[Stripe Webhook] Refund is for lead purchase', {
          purchaseId: leadPurchase.id,
          status: leadPurchase.status,
        })
      }
    }
  }

  // Create notification for the user
  if (userData?.workspace_id) {
    await adminClient.from('notifications').insert({
      workspace_id: userData.workspace_id,
      user_id: userData.id,
      type: 'system',
      category: 'info',
      title: 'Refund processed',
      message: `Refund processed: $${amountRefundedFormatted} ${charge.currency.toUpperCase()}`,
      metadata: {
        billing_event: 'charge_refunded',
        charge_id: charge.id,
        amount_refunded: amountRefunded,
        currency: charge.currency,
        payment_intent_id: paymentIntentId,
      },
      priority: 5,
    })
  }
}

/**
 * Handle charge.dispute.created events
 * Logs dispute details, creates high priority admin notification, sends alert email
 */
async function handleChargeDisputeCreated(event: Stripe.Event): Promise<void> {
  const dispute = event.data.object as Stripe.Dispute
  const amountFormatted = (dispute.amount / 100).toFixed(2)
  const evidenceDueBy = dispute.evidence_details?.due_by
    ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
    : 'Unknown'
  const evidenceDueByFormatted = dispute.evidence_details?.due_by
    ? new Date(dispute.evidence_details.due_by * 1000).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown'

  safeLog('[Stripe Webhook] Dispute created', {
    disputeId: dispute.id,
    chargeId: dispute.charge,
    amount: amountFormatted,
    currency: dispute.currency,
    reason: dispute.reason,
    evidenceDueBy,
  })

  const adminClient = createAdminClient()

  // Create a high-priority admin notification
  // Find an admin user to associate the notification with
  const { data: adminUsers } = await adminClient
    .from('users')
    .select('id, workspace_id')
    .eq('role', 'admin')
    .limit(1)

  if (adminUsers && adminUsers.length > 0) {
    const admin = adminUsers[0]
    await adminClient.from('notifications').insert({
      workspace_id: admin.workspace_id,
      user_id: admin.id,
      type: 'system',
      category: 'error',
      title: `Dispute filed: $${amountFormatted}`,
      message: `A chargeback/dispute has been filed for $${amountFormatted} ${dispute.currency.toUpperCase()}. Reason: ${dispute.reason}. Evidence due by ${evidenceDueByFormatted}.`,
      metadata: {
        billing_event: 'charge_dispute_created',
        dispute_id: dispute.id,
        charge_id: dispute.charge,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        evidence_due_by: evidenceDueBy,
      },
      priority: 20, // Highest priority
    })
  }

  // Send alert email to support
  const supportEmail = process.env.SUPPORT_EMAIL || 'hello@meetcursive.com'

  try {
    await sendEmail({
      to: supportEmail,
      subject: `[URGENT] Stripe Dispute Filed — $${amountFormatted} ${dispute.currency.toUpperCase()}`,
      html: `
        <h2>Stripe Dispute Alert</h2>
        <p>A chargeback/dispute has been filed and requires immediate attention.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; font-weight: bold;">Dispute ID:</td><td style="padding: 8px;">${dispute.id}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Charge ID:</td><td style="padding: 8px;">${dispute.charge}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Amount:</td><td style="padding: 8px;">$${amountFormatted} ${dispute.currency.toUpperCase()}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Reason:</td><td style="padding: 8px;">${dispute.reason}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Evidence Due By:</td><td style="padding: 8px;">${evidenceDueByFormatted}</td></tr>
        </table>
        <p><a href="https://dashboard.stripe.com/disputes/${dispute.id}">View in Stripe Dashboard</a></p>
      `,
      tags: [
        { name: 'category', value: 'billing' },
        { name: 'type', value: 'dispute_alert' },
      ],
    })
  } catch (emailError) {
    safeError('[Stripe Webhook] Failed to send dispute alert email', emailError)
  }
}

/**
 * Handle customer.deleted events
 * Logs deletion and clears stripe_customer_id from the user record
 */
async function handleCustomerDeleted(event: Stripe.Event): Promise<void> {
  const customer = event.data.object as Stripe.Customer
  const customerId = customer.id

  safeLog('[Stripe Webhook] Customer deleted', {
    customerId,
    email: customer.email,
  })

  const adminClient = createAdminClient()

  // Look up user by stripe_customer_id
  const { data: userData } = await adminClient
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (userData) {
    // Clear the stripe_customer_id from the user record
    const { error: updateError } = await adminClient
      .from('users')
      .update({ stripe_customer_id: null })
      .eq('id', userData.id)

    if (updateError) {
      safeError('[Stripe Webhook] Failed to clear stripe_customer_id for user', {
        userId: userData.id,
        error: updateError.message,
      })
    } else {
      safeLog('[Stripe Webhook] Cleared stripe_customer_id for user', {
        userId: userData.id,
        previousCustomerId: customerId,
      })
    }
  } else {
    safeLog('[Stripe Webhook] No user found for deleted customer', { customerId })
  }
}

// ============================================================================
// MAIN WEBHOOK ROUTE HANDLER
// ============================================================================

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      safeError('[Stripe Webhook] Missing signature')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    if (!webhookSecret) {
      safeError('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = getStripe().webhooks.constructEvent(
        body, signature, webhookSecret
      )
    } catch (err) {
      safeError('[Stripe Webhook] Signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // ========================================================================
    // IDEMPOTENCY CHECK - Prevent duplicate webhook processing
    // ========================================================================
    const adminClient = createAdminClient()
    const processingStartTime = Date.now()

    // Check if this event has already been processed
    const { data: existingEvent } = await adminClient
      .from('webhook_events')
      .select('id, processed_at')
      .eq('stripe_event_id', event.id)
      .maybeSingle()

    if (existingEvent) {
      safeLog('[Stripe Webhook] Duplicate event detected, skipping', {
        eventId: event.id,
        eventType: event.type,
        originallyProcessedAt: existingEvent.processed_at,
      })
      return NextResponse.json({
        received: true,
        duplicate: true,
        originallyProcessedAt: existingEvent.processed_at,
      })
    }

    // Record that we're processing this event
    // This prevents race conditions if duplicate webhooks arrive simultaneously
    const { error: insertError } = await adminClient
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event as any, // Store full payload for debugging
      })

    if (insertError) {
      // If insert fails due to unique constraint, another instance is processing it
      if (insertError.code === '23505') { // Postgres unique violation
        safeLog('[Stripe Webhook] Race condition detected, another instance processing', {
          eventId: event.id,
        })
        return NextResponse.json({
          received: true,
          duplicate: true,
          raceCondition: true,
        })
      }

      // Other insert errors are unexpected
      safeError('[Stripe Webhook] Failed to record webhook event', insertError)
      // Continue processing anyway - better to process twice than not at all
    }

    // ========================================================================
    // Process the webhook event
    // ========================================================================
    let processingError: Error | null = null

    try {
        // Handle service subscription events
      const serviceSubscriptionEvents = [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ]

      if (serviceSubscriptionEvents.includes(event.type)) {
        await handleServiceWebhookEvent(event)
      } else if (event.type === 'checkout.session.completed') {
        // Handle checkout session completed (credit purchases and lead purchases)
        // Process inline since Inngest callbacks hang on Vercel (Node.js serverless issue)
        await handleCheckoutSessionCompleted(event)
      } else if (event.type === 'charge.failed') {
        await handleChargeFailed(event)
      } else if (event.type === 'charge.refunded') {
        await handleChargeRefunded(event)
      } else if (event.type === 'charge.dispute.created') {
        await handleChargeDisputeCreated(event)
      } else if (event.type === 'customer.deleted') {
        await handleCustomerDeleted(event)
      } else {
        safeLog('[Stripe Webhook] Unhandled event type: ' + event.type)
      }
    } catch (err) {
      processingError = err instanceof Error ? err : new Error(String(err))
      safeError('[Stripe Webhook] Error processing event:', processingError)
    }

    // ========================================================================
    // Update webhook event record with processing results
    // ========================================================================
    const processingDuration = Date.now() - processingStartTime

    await adminClient
      .from('webhook_events')
      .update({
        processing_duration_ms: processingDuration,
        error_message: processingError?.message || null,
        resource_id: event.type === 'checkout.session.completed'
          ? (event.data.object as Stripe.Checkout.Session).metadata?.credit_purchase_id ||
            (event.data.object as Stripe.Checkout.Session).metadata?.purchase_id
          : null,
      })
      .eq('stripe_event_id', event.id)

    // If processing failed, return 500 so Stripe retries
    if (processingError) {
      return NextResponse.json(
        { error: 'Webhook processing failed', message: processingError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // Outer catch for unexpected errors (signature verification, etc.)
    safeError('[Stripe Webhook] Fatal error in webhook handler:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
