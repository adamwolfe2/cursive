import Stripe from 'stripe'
import { handleServiceWebhookEvent } from '@/lib/stripe/service-webhooks'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  handleAffiliateInvoicePayment,
  handleAffiliateChurn,
} from '@/lib/affiliate/commission'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * Service subscription event types handled by this module
 */
export const SERVICE_SUBSCRIPTION_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const

/**
 * Handle service subscription events
 * Delegates to the service webhook handler and hooks in affiliate commission/churn logic
 */
export async function handleServiceSubscriptionEvent(event: Stripe.Event): Promise<void> {
  await handleServiceWebhookEvent(event)

  // Affiliate commission: hook into successful invoice payments
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string | null
    if (customerId) {
      const adminClient = createAdminClient()
      const { data: userData } = await adminClient
        .from('users')
        .select('workspace_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()
      if (userData?.workspace_id) {
        handleAffiliateInvoicePayment(userData.workspace_id, invoice)
          .catch((err) => safeError('[Stripe Webhook] Affiliate commission failed (non-fatal):', err))
      }
    }
  }

  // Affiliate churn: hook into subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string | null
    if (customerId) {
      const adminClient = createAdminClient()
      const { data: userData } = await adminClient
        .from('users')
        .select('workspace_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()
      if (userData?.workspace_id) {
        handleAffiliateChurn(userData.workspace_id)
          .catch((err) => safeError('[Stripe Webhook] Affiliate churn failed (non-fatal):', err))
      }
    }
  }
}
