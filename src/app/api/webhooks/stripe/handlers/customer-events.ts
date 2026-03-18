import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

/**
 * Handle customer.deleted events
 * Logs deletion and clears stripe_customer_id from the user record
 */
export async function handleCustomerDeleted(event: Stripe.Event): Promise<void> {
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
