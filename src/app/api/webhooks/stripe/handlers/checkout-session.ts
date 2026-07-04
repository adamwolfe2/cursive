import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
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
import { createOrderFromCheckoutSession } from '@/lib/funnel/order.service'
import { provisionFunnelWorkspace } from '@/lib/funnel/workspace-provision'
import { sendFunnelConfirmationEmail } from '@/lib/email/templates/funnel-confirmation'
import { APP_URL } from '@/lib/config/urls'

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
    case 'funnel_order':
      await handleFunnelOrderCompleted(session)
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
        // Awaited — serverless freezes after the webhook returns, dropping any
        // un-awaited promise (the call is internally try/caught).
        await processAffiliateAttribution(affiliateRefCode, userId, userData.email, workspaceId)
          .catch((err) => safeError('[Stripe Webhook] Affiliate attribution fallback failed (non-fatal):', err))
      }
    } else {
      // Pay-first orders (funnel) have no account yet — attribute by buyer email.
      // Creates a 'lead' referral; the funnel invoice handler flips it to paying.
      const email = session.customer_details?.email || session.customer_email
      if (email) {
        const { processAffiliateAttributionByEmail } = await import('@/lib/affiliate/activation')
        await processAffiliateAttributionByEmail(affiliateRefCode, email)
          .catch((err) => safeError('[Stripe Webhook] Affiliate email attribution failed (non-fatal):', err))
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

  const adminClient = createAdminClient()

  // ATOMIC: Complete purchase + add credits in a single transaction
  // Prevents double-credit or lost-credit race conditions on webhook retries
  const { data: completionResult, error: completionError } = await adminClient.rpc(
    'complete_stripe_credit_purchase',
    {
      p_credit_purchase_id: credit_purchase_id,
      p_workspace_id: workspace_id,
      p_credits: creditsAmount,
      p_source: 'purchase',
    }
  )

  if (completionError) {
    safeError('[Stripe Webhook] Failed to complete credit purchase', { error: completionError.message })
    throw new Error(`Failed to complete credit purchase: ${completionError.message}`)
  }

  const result = completionResult?.[0] ?? completionResult

  if (result?.already_completed) {
    safeLog(`[Stripe Webhook] Credit purchase ${credit_purchase_id} already completed (idempotent), skipping`)
    return
  }

  const newBalance = result?.new_balance ?? creditsAmount

  safeLog(`[Stripe Webhook] Credit purchase completed: ${credit_purchase_id}, credits added: ${creditsAmount}, new balance: ${newBalance}`)

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

  // Send confirmation email (don't fail purchase for email errors)
  try {
    const { data: userData } = await adminClient
      .from('users')
      .select('email, full_name')
      .eq('id', user_id)
      .maybeSingle()

    // Get package name for email
    const { data: purchaseData } = await adminClient
      .from('credit_purchases')
      .select('package_name')
      .eq('id', credit_purchase_id)
      .maybeSingle()

    if (userData?.email) {
      await sendCreditPurchaseConfirmationEmail(
        userData.email,
        userData.full_name || 'Valued Customer',
        {
          creditsAmount,
          totalPrice: (session.amount_total || 0) / 100, // Stripe amounts are in cents
          packageName: purchaseData?.package_name || 'Credit Package',
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

  const { purchase_id, workspace_id: _workspace_id, user_id, lead_count } = metadataValidation.data

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

/**
 * Handle completed funnel order (VSL self-serve checkout for pixel + audience).
 * Creates the funnel_orders row, issues a portal token, and emails the buyer
 * the portal link. Idempotent — re-deliveries return the existing order.
 */
async function handleFunnelOrderCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const result = await createOrderFromCheckoutSession(session)

  if (!result) {
    // Hard fail — the webhook handler will report 500 to Stripe and retry,
    // surfacing the failure in Sentry. We never want to silently drop a paid order.
    throw new Error(`Funnel order creation failed for session ${session.id}`)
  }

  const { order, portalUrl } = result

  // Mark any pricing-gate email capture for this buyer as converted, so the
  // founder re-engagement cron never emails someone who actually bought.
  if (order.customer_email) {
    try {
      const supabase = createAdminClient()
      await supabase
        .from('funnel_email_captures')
        .update({ converted_at: new Date().toISOString() })
        .eq('email', order.customer_email.toLowerCase())
        .is('converted_at', null)
    } catch (err) {
      safeError('[funnel/checkout] capture conversion mark failed:', err)
    }
  }

  // Phase 2: auto-provision a dashboard workspace + login so the buyer can use
  // the full dashboard, not just the token portal. Non-fatal — the portal
  // delivers fulfillment regardless, so a provisioning hiccup never blocks a
  // paid order. dashboardUrl is only included in the email if this succeeds.
  let dashboardUrl: string | undefined
  try {
    const provisioned = await provisionFunnelWorkspace(order)
    if (provisioned) {
      const token = portalUrl.split('/funnel/')[1] ?? ''
      if (token) {
        dashboardUrl = `${APP_URL}/api/funnel/${token}/dashboard-login`
      }
    }
  } catch (provisionErr) {
    safeError('[Stripe Webhook] funnel workspace provision failed (non-fatal)', provisionErr)
  }

  // Confirmation email carries the buyer's durable portal + one-click dashboard
  // links. Since the checkout-success page no longer returns the portal token
  // (that leaked via Referer/history — P1 fix), this email is now the ONLY
  // durable delivery of the login link, so a silent drop locks a paying buyer
  // out of fulfillment. On failure we therefore (1) alert ops (matching the
  // credit branch) and (2) THROW so Stripe records a non-2xx and retries.
  //
  // Throwing is safe because the entire funnel path is idempotent:
  //   - createOrderFromCheckoutSession dedups on stripe_session_id (reissues
  //     the token if missing) — no duplicate order on retry
  //   - provisionFunnelWorkspace reuses an existing workspace / returns null for
  //     a pre-existing email — no duplicate workspace
  //   - affiliate attribution is UNIQUE(affiliate_id, referred_email) guarded
  //   - the funnel_email_captures mark is `.is('converted_at', null)` guarded
  // so a full webhook re-run re-attempts only the email.
  try {
    await sendFunnelConfirmationEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      portalUrl,
      dashboardUrl,
      offerSlug: order.offer_slug,
    })
  } catch (emailErr) {
    safeError('[Stripe Webhook] funnel-confirmation email failed', emailErr)
    await sendSlackAlert({
      type: 'stripe_payment',
      severity: 'critical',
      message: `Funnel confirmation email FAILED for order ${order.id} (${order.offer_slug}) — buyer has no portal/login link until this send succeeds. Webhook will 500 so Stripe retries.`,
      metadata: {
        order_id: order.id,
        offer: order.offer_slug,
        stripe_session_id: order.stripe_session_id,
      },
    }).catch((err) => safeError('[Stripe Webhook] Slack alert failed:', err))

    throw new Error(
      `Funnel confirmation email failed for order ${order.id} — retrying via Stripe`
    )
  }

  safeLog('[Stripe Webhook] Funnel order processed', {
    order_id: order.id,
    offer: order.offer_slug,
  })
}
