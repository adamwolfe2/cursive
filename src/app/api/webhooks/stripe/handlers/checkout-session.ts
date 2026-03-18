import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendCreditPurchaseConfirmationEmail,
  sendPurchaseConfirmationEmail,
} from '@/lib/email/service'
import { inngest } from '@/inngest/client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { TIMEOUTS, getDaysFromNow } from '@/lib/constants/timeouts'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import {
  getStripe,
  creditPurchaseMetadataSchema,
  leadPurchaseMetadataSchema,
} from './types'

/**
 * Handle checkout.session.completed events
 * Routes to credit purchase or lead purchase handler based on metadata type
 */
export async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
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
    case 'service_subscription':
      // Subscription lifecycle is handled via customer.subscription.created event.
      // checkout.session.completed just provides confirmation; no extra action needed here.
      safeLog('[Stripe Webhook] Service subscription checkout completed, subscription events will handle provisioning')
      break
    default:
      safeLog(`[Stripe Webhook] Unknown checkout metadata type: ${metadataType}`)
  }

  // Affiliate attribution fallback: runs after primary handler for all checkout types
  // Idempotent — UNIQUE(affiliate_id, referred_email) makes duplicate calls safe
  const affiliateRefCode = session.metadata?.affiliate_ref_code
  if (affiliateRefCode) {
    const workspaceId = session.metadata?.workspace_id
    const userId = session.metadata?.user_id
    if (workspaceId && userId) {
      // Look up user email from workspace/user IDs
      const adminClientForAffiliate = createAdminClient()
      const { data: userData } = await adminClientForAffiliate
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle()
      if (userData?.email) {
        const { processAffiliateAttribution } = await import('@/lib/affiliate/activation')
        processAffiliateAttribution(affiliateRefCode, userId, userData.email, workspaceId)
          .catch((err) => safeError('[Stripe Webhook] Affiliate attribution fallback failed (non-fatal):', err))
      }
    }
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
    Sentry.captureException(new Error('Invalid credit purchase metadata'), {
      tags: { source: 'stripe_webhook', error_type: 'invalid_credit_metadata' },
      extra: {
        stripe_session_id: session.id,
        validation_errors: metadataValidation.error.format(),
      },
    })
    // Alert ops — this payment will NOT be processed without manual intervention
    await sendSlackAlert({
      type: 'stripe_payment',
      severity: 'critical',
      message: `Credit purchase webhook dropped: Stripe session ${session.id} has invalid metadata and could not be processed.`,
      metadata: {
        session_id: session.id,
        amount: session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'unknown',
        validation_errors: JSON.stringify(metadataValidation.error.format()),
      },
    }).catch((err) => safeError('[Stripe Webhook] Slack alert failed:', err)) // Never fail the webhook handler over an alert
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

  // Emit Inngest event for downstream automation (e.g. email sequences, analytics)
  await inngest.send({
    name: 'marketplace/credit-purchased',
    data: {
      workspace_id,
      credits_purchased: creditsAmount,
      amount_paid_cents: session.amount_total ?? 0,
      stripe_session_id: session.id,
    },
  })

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
    Sentry.captureException(new Error('Invalid lead purchase metadata'), {
      tags: { source: 'stripe_webhook', error_type: 'invalid_lead_metadata' },
      extra: {
        stripe_session_id: session.id,
        validation_errors: metadataValidation.error.format(),
      },
    })
    // Alert ops — this payment will NOT be processed without manual intervention
    await sendSlackAlert({
      type: 'stripe_payment',
      severity: 'critical',
      message: `Lead purchase webhook dropped: Stripe session ${session.id} has invalid metadata and could not be processed.`,
      metadata: {
        session_id: session.id,
        amount: session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'unknown',
        validation_errors: JSON.stringify(metadataValidation.error.format()),
      },
    }).catch((err) => safeError('[Stripe Webhook] Slack alert failed:', err)) // Never fail the webhook handler over an alert
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
