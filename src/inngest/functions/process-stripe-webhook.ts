/**
 * Process Stripe Webhook
 * Inngest function for processing Stripe webhooks with automatic retries
 *
 * Features:
 * - Automatic retries (5 attempts with exponential backoff)
 * - Idempotent processing (handles duplicate webhook deliveries)
 * - Dead letter queue for permanent failures
 * - Slack alerts for repeated failures
 * - Triggers email sending via Inngest
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { recordFailedOperation } from '@/lib/monitoring/failed-operations'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

/**
 * Process Stripe checkout.session.completed webhook
 */
export const processStripeWebhook = inngest.createFunction(
  {
    id: 'process-stripe-webhook',
    name: 'Process Stripe Webhook',
    retries: 5, // Retry 5 times for webhooks (critical for payments)
  },
  { event: 'stripe/webhook.received' },
  async ({ event, step, attempt }) => {
    const { eventType, eventId, sessionId, metadata, amountTotal } = event.data

    safeLog(`[Stripe Webhook] Processing event ${eventType} (attempt ${attempt}/${5})`, {
      eventId,
      sessionId,
    })

    // Route to appropriate handler based on event type
    if (eventType === 'checkout.session.completed') {
      const metadataType = metadata?.type

      if (!metadataType) {
        safeLog('[Stripe Webhook] checkout.session.completed missing metadata type, skipping')
        return { success: true, skipped: true }
      }

      switch (metadataType) {
        case 'credit_purchase':
          return await processCreditPurchase({ event, step, attempt, metadata, amountTotal })
        case 'lead_purchase':
          return await processLeadPurchase({ event, step, attempt, metadata, sessionId })
        default:
          safeLog(`[Stripe Webhook] Unknown checkout metadata type: ${metadataType}`)
          return { success: true, skipped: true }
      }
    }

    // Other webhook types handled by existing service webhooks
    safeLog(`[Stripe Webhook] Event type ${eventType} not handled by this function`)
    return { success: true, skipped: true }
  }
)

/**
 * Process credit purchase completion
 */
async function processCreditPurchase({
  event,
  step,
  attempt,
  metadata,
  amountTotal,
}: {
  event: any
  step: any
  attempt: number
  metadata: any
  amountTotal?: number
}) {
  const { credit_purchase_id, workspace_id, user_id, credits } = metadata || {}

  if (!credit_purchase_id || !workspace_id || !user_id || !credits) {
    const errorMessage = 'Credit purchase missing required metadata fields'
    safeError('[Stripe Webhook] ' + errorMessage, {
      credit_purchase_id: !!credit_purchase_id,
      workspace_id: !!workspace_id,
      user_id: !!user_id,
      credits: !!credits,
    })
    throw new Error(errorMessage)
  }

  const creditsAmount = parseInt(credits, 10)
  if (isNaN(creditsAmount) || creditsAmount <= 0) {
    throw new Error(`Invalid credits amount in metadata: ${credits}`)
  }

  // Complete the purchase atomically
  const result = await step.run('complete-credit-purchase', async () => {
    const repo = new MarketplaceRepository()
    const adminClient = createAdminClient()

    // Mark the credit purchase record as completed
    const completedPurchase = await repo.completeCreditPurchase(credit_purchase_id)

    // Add credits to the workspace
    await repo.addCredits(workspace_id, creditsAmount, 'purchase')

    // Get the new balance
    const { data: creditsData } = await adminClient
      .from('workspace_credits')
      .select('balance')
      .eq('workspace_id', workspace_id)
      .single()

    const newBalance = creditsData?.balance ?? creditsAmount

    safeLog(`[Stripe Webhook] Credit purchase completed: ${credit_purchase_id}, credits added: ${creditsAmount}, new balance: ${newBalance}`)

    return {
      completedPurchase,
      newBalance,
      user_id,
    }
  })

  // Send confirmation email via Inngest (with its own retry logic)
  await step.run('queue-confirmation-email', async () => {
    const adminClient = createAdminClient()
    const { data: userData } = await adminClient
      .from('users')
      .select('email, full_name')
      .eq('id', result.user_id)
      .single()

    if (userData?.email) {
      await inngest.send({
        name: 'purchase/credit-email.send',
        data: {
          creditPurchaseId: credit_purchase_id,
          userEmail: userData.email,
          userName: userData.full_name || 'Valued Customer',
          creditsAmount,
          totalPrice: (amountTotal || 0) / 100, // Stripe amounts are in cents
          packageName: result.completedPurchase.package_name || 'Credit Package',
          newBalance: result.newBalance,
        },
      })
    }
  })

  // Sync customer to Cursive's GHL (non-blocking)
  await step.run('queue-ghl-onboard', async () => {
    const adminClient = createAdminClient()
    const { data: userData } = await adminClient
      .from('users')
      .select('email, full_name')
      .eq('id', result.user_id)
      .single()

    if (userData?.email) {
      await inngest.send({
        name: 'ghl-admin/onboard-customer',
        data: {
          user_id,
          user_email: userData.email,
          user_name: userData.full_name || 'Customer',
          workspace_id,
          purchase_type: 'credit_purchase',
          amount: (amountTotal || 0) / 100,
        },
      })

      // Emit pipeline lifecycle event
      await inngest.send({
        name: 'ghl/pipeline.update',
        data: {
          user_email: userData.email,
          workspace_id,
          lifecycle_event: 'credit_purchase',
          metadata: { amount: (amountTotal || 0) / 100, credits: creditsAmount },
        },
      })
    }
  })

  return {
    success: true,
    creditPurchaseId: credit_purchase_id,
    creditsAdded: creditsAmount,
    newBalance: result.newBalance,
  }
}

/**
 * Process lead purchase completion
 */
async function processLeadPurchase({
  event,
  step,
  attempt,
  metadata,
  sessionId,
}: {
  event: any
  step: any
  attempt: number
  metadata: any
  sessionId?: string
}) {
  const { purchase_id, workspace_id, user_id, lead_count } = metadata || {}

  if (!purchase_id || !workspace_id || !user_id || !lead_count) {
    const errorMessage = 'Lead purchase missing required metadata fields'
    safeError('[Stripe Webhook] ' + errorMessage, {
      purchase_id: !!purchase_id,
      workspace_id: !!workspace_id,
      user_id: !!user_id,
      lead_count: !!lead_count,
    })
    throw new Error(errorMessage)
  }

  // Complete the purchase using idempotent database function
  const result = await step.run('complete-lead-purchase', async () => {
    const adminClient = createAdminClient()
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
      throw new Error('No result from completion function')
    }

    const dbResult = completionResult[0]

    // Check if this was a duplicate webhook delivery (idempotent handling)
    if (dbResult.already_completed) {
      safeLog(`[Stripe Webhook] Purchase already completed (idempotent): ${purchase_id}`)
      return { ...dbResult, duplicate: true }
    }

    if (!dbResult.success) {
      throw new Error('Purchase completion returned failure')
    }

    safeLog(`[Stripe Webhook] Lead purchase completed: ${purchase_id}, leads sold: ${dbResult.lead_ids_marked.length}`)

    return { ...dbResult, duplicate: false, downloadUrl }
  })

  // If this was a duplicate, skip email sending
  if (result.duplicate) {
    return {
      success: true,
      purchaseId: purchase_id,
      duplicate: true,
    }
  }

  // Send confirmation email via Inngest (with its own retry logic)
  await step.run('queue-confirmation-email', async () => {
    const adminClient = createAdminClient()
    const { data: userData } = await adminClient
      .from('users')
      .select('email, full_name')
      .eq('id', user_id)
      .single()

    if (userData?.email) {
      const downloadExpiresAt = new Date()
      downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 90)

      await inngest.send({
        name: 'purchase/email.send',
        data: {
          purchaseId: purchase_id,
          userEmail: userData.email,
          userName: userData.full_name || 'Valued Customer',
          downloadUrl: result.downloadUrl,
          totalLeads: parseInt(lead_count, 10),
          totalPrice: metadata.amount_total ? metadata.amount_total / 100 : 0,
          expiresAt: downloadExpiresAt.toISOString(),
        },
      })
    }
  })

  // Sync customer to Cursive's GHL (non-blocking)
  await step.run('queue-ghl-onboard-lead', async () => {
    const adminClient = createAdminClient()
    const { data: userData } = await adminClient
      .from('users')
      .select('email, full_name')
      .eq('id', user_id)
      .single()

    if (userData?.email) {
      await inngest.send({
        name: 'ghl-admin/onboard-customer',
        data: {
          user_id,
          user_email: userData.email,
          user_name: userData.full_name || 'Customer',
          workspace_id,
          purchase_type: 'lead_purchase',
          amount: metadata.amount_total ? metadata.amount_total / 100 : 0,
        },
      })

      // Emit pipeline lifecycle event
      await inngest.send({
        name: 'ghl/pipeline.update',
        data: {
          user_email: userData.email,
          workspace_id,
          lifecycle_event: 'lead_purchase',
          metadata: { lead_count: parseInt(lead_count, 10) },
        },
      })
    }
  })

  return {
    success: true,
    purchaseId: purchase_id,
    leadsSold: result.lead_ids_marked.length,
  }
}

/**
 * Handle webhook failures
 * Records failures in dead letter queue and alerts on final failure
 */
export const handleWebhookFailure = inngest.createFunction(
  {
    id: 'handle-webhook-failure',
    name: 'Handle Stripe Webhook Failure',
  },
  { event: 'inngest/function.failed' },
  async ({ event, step }) => {
    // Only handle failures from our webhook processor
    if (event.data.function_id !== 'process-stripe-webhook') {
      return { skipped: true }
    }

    const { event: failedEvent, error, run_id } = event.data

    // Record in dead letter queue
    await step.run('record-failure', async () => {
      await recordFailedOperation({
        operationType: 'webhook',
        operationId: failedEvent.data.eventId || run_id,
        eventData: failedEvent.data,
        errorMessage: error?.message || 'Unknown error',
        errorStack: error?.stack,
        retryCount: 5, // Max retries reached
      })
    })

    // Send critical alert
    await step.run('alert-failure', async () => {
      await sendSlackAlert({
        type: 'webhook_failure',
        severity: 'critical',
        message: `Stripe webhook failed after 5 retries: ${failedEvent.data.eventType}`,
        metadata: {
          eventId: failedEvent.data.eventId,
          eventType: failedEvent.data.eventType,
          error: error?.message,
          runId: run_id,
        },
      })
    })

    return { success: true }
  }
)
