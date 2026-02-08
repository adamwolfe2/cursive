/**
 * Universal Inngest Failure Handler
 *
 * Catches ALL Inngest function failures and:
 *   1. Sends Slack alert with function name, error details, run ID
 *   2. Records to dead letter queue for manual review
 *   3. Escalates critical functions (Stripe, GHL, lead delivery) to email
 *
 * This ensures NOTHING fails silently — every error is visible in Slack.
 */

import { inngest } from '../client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { recordFailedOperation } from '@/lib/monitoring/failed-operations'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

// Functions that are CRITICAL — failures get escalated to email
const CRITICAL_FUNCTIONS = new Set([
  'process-stripe-webhook',
  'ghl-onboard-customer',
  'ghl-create-subaccount',
  'ghl-deliver-leads',
  'dfy-onboarding-sequence',
  'send-purchase-email',
  'send-credit-purchase-email',
])

// Functions to SKIP (they have their own failure handling)
const SKIP_FUNCTIONS = new Set([
  'handle-webhook-failure', // Already handles Stripe failures
  'universal-failure-handler', // Don't alert on our own failures
])

export const universalFailureHandler = inngest.createFunction(
  {
    id: 'universal-failure-handler',
    name: 'Universal Failure Handler',
    retries: 1,
  },
  { event: 'inngest/function.failed' },
  async ({ event, step }) => {
    const functionId = event.data.function_id
    const error = event.data.error
    const runId = event.data.run_id

    // Skip functions that handle their own failures
    if (SKIP_FUNCTIONS.has(functionId)) {
      return { skipped: true, reason: 'has_own_handler' }
    }

    const isCritical = CRITICAL_FUNCTIONS.has(functionId)
    const severity = isCritical ? 'critical' : 'error'

    safeError(`[Failure Handler] ${functionId} failed`, {
      error: error?.message,
      runId,
    })

    // Step 1: Send Slack alert
    await step.run('send-slack-alert', async () => {
      await sendSlackAlert({
        type: 'inngest_failure',
        severity,
        message: `${isCritical ? 'CRITICAL: ' : ''}Inngest function failed: ${functionId}`,
        metadata: {
          function: functionId,
          error: error?.message || 'Unknown error',
          run_id: runId,
          event_name: event.data.event?.name || 'unknown',
          workspace_id: event.data.event?.data?.workspace_id || 'N/A',
          dashboard: `https://app.inngest.com/env/production/functions/${functionId}`,
        },
      })
    })

    // Step 2: Record in dead letter queue
    await step.run('record-in-dlq', async () => {
      try {
        await recordFailedOperation({
          operationType: 'job',
          operationId: runId,
          eventData: {
            function_id: functionId,
            event_name: event.data.event?.name,
            event_data: event.data.event?.data,
          },
          errorMessage: error?.message || 'Unknown error',
          errorStack: error?.stack,
          retryCount: event.data.attempt || 0,
        })
      } catch (dlqError) {
        safeError('[Failure Handler] Failed to record in DLQ', dlqError)
      }
    })

    // Step 3: Email escalation for critical functions
    if (isCritical) {
      await step.run('escalate-to-email', async () => {
        try {
          const { sendEmail } = await import('@/lib/email/resend-client')

          await sendEmail({
            to: 'adam@meetcursive.com',
            subject: `[CRITICAL] ${functionId} failed — immediate attention needed`,
            html: `
              <div style="font-family: -apple-system, sans-serif; max-width: 600px;">
                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 20px;">
                  <h2 style="color: #dc2626; margin: 0 0 8px 0;">Critical Function Failure</h2>
                  <p style="margin: 0; color: #991b1b;">This function is part of the revenue/delivery pipeline and requires immediate attention.</p>
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; font-weight: bold;">Function:</td><td><code>${functionId}</code></td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Error:</td><td style="color: #dc2626;">${error?.message || 'Unknown'}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Run ID:</td><td><code>${runId}</code></td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Event:</td><td>${event.data.event?.name || 'unknown'}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Workspace:</td><td>${event.data.event?.data?.workspace_id || 'N/A'}</td></tr>
                </table>

                <p style="margin-top: 20px;">
                  <a href="https://app.inngest.com/env/production/functions/${functionId}" style="padding: 10px 20px; background: #111827; color: white; border-radius: 6px; text-decoration: none;">
                    View in Inngest Dashboard
                  </a>
                </p>
              </div>
            `,
          })
        } catch {
          // Email is best-effort
        }
      })
    }

    return {
      handled: true,
      functionId,
      severity,
      escalated: isCritical,
    }
  }
)
