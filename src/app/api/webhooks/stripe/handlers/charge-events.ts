import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/service'
import { inngest } from '@/inngest/client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

/**
 * Handle charge.failed events
 * Logs failure details, notifies the user, and queues an Inngest event
 */
export async function handleChargeFailed(event: Stripe.Event): Promise<void> {
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
export async function handleChargeRefunded(event: Stripe.Event): Promise<void> {
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
export async function handleChargeDisputeCreated(event: Stripe.Event): Promise<void> {
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
  // Find a platform admin (not a random customer admin) to route this to
  const { data: platformAdmin } = await adminClient
    .from('platform_admins')
    .select('email')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const platformAdminUser = platformAdmin
    ? await adminClient
        .from('users')
        .select('id, workspace_id')
        .eq('email', platformAdmin.email)
        .maybeSingle()
        .then(({ data }) => data)
    : null

  const notificationTarget = platformAdminUser

  if (notificationTarget) {
    await adminClient.from('notifications').insert({
      workspace_id: notificationTarget.workspace_id,
      user_id: notificationTarget.id,
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
