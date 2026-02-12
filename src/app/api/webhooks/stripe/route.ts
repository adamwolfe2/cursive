import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { handleServiceWebhookEvent } from '@/lib/stripe/service-webhooks'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendCreditPurchaseConfirmationEmail,
  sendPurchaseConfirmationEmail,
} from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { TIMEOUTS, getDaysFromNow } from '@/lib/constants/timeouts'

export const runtime = 'edge'

// Lazy-load Stripe with Web Crypto provider for Edge runtime
let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeClient) {
    if (!STRIPE_CONFIG.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeClient = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: STRIPE_CONFIG.apiVersion as Stripe.LatestApiVersion,
      httpClient: Stripe.createFetchHttpClient(),
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
  const { credit_purchase_id, workspace_id, user_id, credits } = session.metadata || {}

  if (!credit_purchase_id || !workspace_id || !user_id || !credits) {
    safeError('[Stripe Webhook] Credit purchase missing required metadata fields', {
      credit_purchase_id: !!credit_purchase_id,
      workspace_id: !!workspace_id,
      user_id: !!user_id,
      credits: !!credits,
    })
    return
  }

  const creditsAmount = parseInt(credits, 10)
  if (isNaN(creditsAmount) || creditsAmount <= 0) {
    safeError('[Stripe Webhook] Invalid credits amount in metadata', { credits })
    return
  }

  safeLog(`[Stripe Webhook] Processing credit purchase: ${credit_purchase_id}`)

  const repo = new MarketplaceRepository()

  // Mark the credit purchase record as completed
  const completedPurchase = await repo.completeCreditPurchase(credit_purchase_id)

  // Add credits to the workspace
  await repo.addCredits(workspace_id, creditsAmount, 'purchase')

  // Get the new balance using admin client (webhook has no user auth context)
  const adminClient = createAdminClient()
  const { data: creditsData } = await adminClient
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', workspace_id)
    .single()

  const newBalance = creditsData?.balance ?? creditsAmount

  safeLog(`[Stripe Webhook] Credit purchase completed: ${credit_purchase_id}, credits added: ${creditsAmount}, new balance: ${newBalance}`)

  // Send confirmation email (don't fail purchase for email errors)
  try {
    const { data: userData } = await adminClient
      .from('users')
      .select('email, full_name')
      .eq('id', user_id)
      .single()

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
  const { purchase_id, workspace_id, user_id, lead_count } = session.metadata || {}

  if (!purchase_id || !workspace_id || !user_id || !lead_count) {
    safeError('[Stripe Webhook] Lead purchase missing required metadata fields', {
      purchase_id: !!purchase_id,
      workspace_id: !!workspace_id,
      user_id: !!user_id,
      lead_count: !!lead_count,
    })
    return
  }

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
      .single()

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

    // Verify webhook signature (async for Edge runtime Web Crypto compatibility)
    let event: Stripe.Event

    try {
      const cryptoProvider = Stripe.createSubtleCryptoProvider()
      event = await getStripe().webhooks.constructEventAsync(
        body, signature, webhookSecret, undefined, cryptoProvider
      )
    } catch (err) {
      safeError('[Stripe Webhook] Signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

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
      return NextResponse.json({ received: true })
    }

    // Handle checkout session completed (credit purchases and lead purchases)
    // Process inline since Inngest callbacks hang on Vercel (Node.js serverless issue)
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutSessionCompleted(event)
      return NextResponse.json({ received: true })
    }

    safeLog('[Stripe Webhook] Unhandled event type: ' + event.type)
    return NextResponse.json({ received: true, unhandled: true })
  } catch (error) {
    safeError('[Stripe Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
