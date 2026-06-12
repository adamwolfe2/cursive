/**
 * Funnel-specific Stripe subscription event handlers.
 *
 * Wired into src/app/api/webhooks/stripe/handlers/subscription-events.ts.
 * Branches on subscription.metadata.type === 'funnel_order' so funnel
 * subscriptions never hit the service-tier handler (they have no workspace).
 *
 * Lifecycle covered:
 *   customer.subscription.deleted   → cancelAndDisableOrder() + cancellation email
 *   customer.subscription.updated   → past_due / active transitions
 *   invoice.payment_failed          → past_due flag + dunning email
 *   invoice.payment_succeeded       → return to active if was past_due
 */

import type Stripe from 'stripe'
import {
  cancelAndDisableOrder,
  findOrderByStripeSubscriptionId,
  findOrderByStripeCustomerId,
  setSubscriptionState,
  type FunnelOrder,
} from './order.service'
import { sendFunnelSubscriptionCancelledEmail } from '@/lib/email/templates/funnel-subscription-cancelled'
import { sendFunnelPaymentFailedEmail } from '@/lib/email/templates/funnel-payment-failed'
import {
  handleAffiliateFunnelInvoice,
  handleAffiliateFunnelChurn,
} from '@/lib/affiliate/commission'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

/**
 * Returns true if this event was for a funnel subscription and the funnel
 * handler took ownership. The dispatcher should NOT also fire the service
 * handler when this returns true.
 */
export async function handleFunnelSubscriptionEvent(
  event: Stripe.Event
): Promise<boolean> {
  switch (event.type) {
    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)

    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)

    case 'invoice.payment_failed':
      return await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)

    case 'invoice.payment_succeeded':
      return await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)

    case 'customer.subscription.created':
      // Already handled at checkout.session.completed time; nothing to do.
      // Return true if it's a funnel sub so dispatcher knows to skip service handler.
      return isFunnelSubscription(event.data.object as Stripe.Subscription)
  }

  return false
}

function isFunnelSubscription(sub: Stripe.Subscription): boolean {
  return sub.metadata?.type === 'funnel_order'
}

// ─── customer.subscription.deleted ─────────────────────────────────────

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<boolean> {
  if (!isFunnelSubscription(sub)) return false

  const order = await findOrderByStripeSubscriptionId(sub.id)
  if (!order) {
    safeError('[funnel/sub] deleted: no funnel order for sub', { sub_id: sub.id })
    return true // Still ours — just orphaned
  }

  if (order.subscription_state === 'cancelled') {
    safeLog('[funnel/sub] already cancelled, idempotent skip', { order_id: order.id })
    return true
  }

  const cancelled = await cancelAndDisableOrder(order.id)
  if (!cancelled) {
    safeError('[funnel/sub] cancelAndDisableOrder returned null', { order_id: order.id })
    return true
  }

  // Affiliate churn — decrement the partner's active-paying count (non-fatal).
  handleAffiliateFunnelChurn({
    customer_email: cancelled.customer_email,
    workspace_id: cancelled.workspace_id ?? null,
    affiliate_partner_code: cancelled.affiliate_partner_code ?? null,
  }).catch((err) => safeError('[funnel/sub] affiliate churn failed (non-fatal):', err))

  // Send the cancellation confirmation — non-fatal if it fails
  try {
    await sendFunnelSubscriptionCancelledEmail({
      to: cancelled.customer_email,
      customerName: cancelled.customer_name,
      offerLabel: cancelled.offer_slug,
    })
  } catch (emailErr) {
    safeError('[funnel/sub] cancellation email failed:', emailErr)
  }

  sendSlackAlert({
    type: 'pipeline_update',
    severity: 'info',
    message: `Funnel buyer cancelled: ${cancelled.customer_email} (${cancelled.offer_slug})`,
    metadata: {
      order_id: cancelled.id,
      email: cancelled.customer_email,
      offer: cancelled.offer_slug,
      pixel_id: cancelled.pixel_audiencelab_id,
    },
  }).catch((err) => safeError('[funnel/sub] cancel slack alert failed:', err))

  return true
}

// ─── customer.subscription.updated ─────────────────────────────────────

async function handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<boolean> {
  if (!isFunnelSubscription(sub)) return false

  const order = await findOrderByStripeSubscriptionId(sub.id)
  if (!order) return true

  // Map Stripe status → our internal state
  const nextState = mapStripeStatus(sub.status)
  if (nextState === order.subscription_state) return true // idempotent

  // For 'cancelled' transitions via updated event, run the full disable
  // path (so the deleted event becomes a no-op if it arrives later).
  if (nextState === 'cancelled') {
    await cancelAndDisableOrder(order.id)
    return true
  }

  await setSubscriptionState(order.id, nextState)
  safeLog('[funnel/sub] state transition', {
    order_id: order.id,
    from: order.subscription_state,
    to: nextState,
  })
  return true
}

// ─── invoice.payment_failed ────────────────────────────────────────────

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<boolean> {
  const subId = (invoice.subscription as string | null) ?? null
  const order = subId ? await findOrderByStripeSubscriptionId(subId) : null
  if (!order) return false // not a funnel order

  // Flip to past_due if not already cancelled
  if (order.subscription_state === 'cancelled') return true
  await setSubscriptionState(order.id, 'past_due')

  // Send dunning email — non-fatal
  try {
    await sendFunnelPaymentFailedEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    })
  } catch (emailErr) {
    safeError('[funnel/sub] past_due email failed:', emailErr)
  }

  sendSlackAlert({
    type: 'stripe_payment',
    severity: 'warning',
    message: `Funnel buyer card failed: ${order.customer_email}`,
    metadata: {
      order_id: order.id,
      email: order.customer_email,
      offer: order.offer_slug,
      invoice_url: invoice.hosted_invoice_url ?? '',
    },
  }).catch((err) => safeError('[funnel/sub] past_due slack alert failed:', err))

  return true
}

// ─── invoice.payment_succeeded ─────────────────────────────────────────

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<boolean> {
  const subId = (invoice.subscription as string | null) ?? null
  const order = subId ? await findOrderByStripeSubscriptionId(subId) : null
  if (!order) return false

  if (order.subscription_state === 'past_due') {
    await setSubscriptionState(order.id, 'active')
    safeLog('[funnel/sub] past_due → active (payment recovered)', {
      order_id: order.id,
    })
  }

  // Affiliate commission — every successful funnel invoice (incl. renewals)
  // pays the attributed partner at their live ramp rate (non-fatal).
  handleAffiliateFunnelInvoice(
    {
      customer_email: order.customer_email,
      offer_slug: order.offer_slug,
      workspace_id: order.workspace_id ?? null,
      affiliate_partner_code: order.affiliate_partner_code ?? null,
    },
    invoice
  ).catch((err) => safeError('[funnel/sub] affiliate commission failed (non-fatal):', err))

  return true
}

// ─── Helpers ───────────────────────────────────────────────────────────

function mapStripeStatus(status: Stripe.Subscription.Status): FunnelOrder['subscription_state'] {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'paused':
      return 'paused'
    case 'canceled':
      return 'cancelled'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    default:
      return 'active'
  }
}

export { findOrderByStripeCustomerId }
