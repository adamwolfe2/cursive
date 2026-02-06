/**
 * Send Purchase Email
 * Inngest function for sending purchase confirmation emails with automatic retries
 *
 * Features:
 * - Automatic retries (3 attempts with exponential backoff)
 * - Rate limiting (50 emails/min)
 * - Dead letter queue for permanent failures
 * - Slack alerts for repeated failures
 */

import { inngest } from '@/inngest/client'
import { sendPurchaseConfirmationEmail, sendCreditPurchaseConfirmationEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { recordFailedOperation } from '@/lib/monitoring/failed-operations'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

/**
 * Send purchase confirmation email with retries
 */
export const sendPurchaseEmail = inngest.createFunction(
  {
    id: 'send-purchase-email',
    name: 'Send Purchase Confirmation Email',
    retries: 3, // Retry 3 times on failure
    rateLimit: {
      limit: 50, // 50 emails per minute
      period: '1m',
      key: 'event.data.userEmail' // Rate limit per email address
    }
  },
  { event: 'purchase/email.send' },
  async ({ event, step, attempt }) => {
    const { purchaseId, userEmail, userName, downloadUrl, totalLeads, totalPrice, expiresAt } = event.data

    safeLog(`[Purchase Email] Attempting to send email for purchase ${purchaseId} (attempt ${attempt}/${3})`)

    // Send the email
    const result = await step.run('send-email', async () => {
      const downloadExpiresAt = new Date(expiresAt)

      return await sendPurchaseConfirmationEmail(
        userEmail,
        userName,
        {
          totalLeads,
          totalPrice,
          purchaseId,
          downloadUrl,
          downloadExpiresAt,
        }
      )
    })

    // Check result
    if (!result.success) {
      const errorMessage = result.error || 'Unknown email error'

      safeError(`[Purchase Email] Failed to send email for purchase ${purchaseId}`, {
        error: errorMessage,
        attempt,
      })

      // On final retry failure, record in dead letter queue
      if (attempt === 3) {
        await step.run('record-failure', async () => {
          await recordFailedOperation({
            operationType: 'email',
            operationId: purchaseId,
            eventData: event.data,
            errorMessage,
            retryCount: attempt,
          })
        })

        // Send Slack alert for critical failure
        await step.run('alert-failure', async () => {
          await sendSlackAlert({
            type: 'email_failure',
            severity: 'critical',
            message: `Purchase email failed after 3 retries for purchase ${purchaseId}`,
            metadata: {
              purchaseId,
              userEmail,
              error: errorMessage,
            },
          })
        })
      }

      // Throw error to trigger Inngest retry
      throw new Error(`Email send failed: ${errorMessage}`)
    }

    safeLog(`[Purchase Email] Successfully sent email for purchase ${purchaseId}`, {
      messageId: result.messageId,
    })

    return {
      success: true,
      messageId: result.messageId,
      purchaseId,
    }
  }
)

/**
 * Send credit purchase confirmation email with retries
 */
export const sendCreditPurchaseEmail = inngest.createFunction(
  {
    id: 'send-credit-purchase-email',
    name: 'Send Credit Purchase Confirmation Email',
    retries: 3,
    rateLimit: {
      limit: 50,
      period: '1m',
      key: 'event.data.userEmail'
    }
  },
  { event: 'purchase/credit-email.send' },
  async ({ event, step, attempt }) => {
    const { creditPurchaseId, userEmail, userName, creditsAmount, totalPrice, packageName, newBalance } = event.data

    safeLog(`[Credit Purchase Email] Attempting to send email for credit purchase ${creditPurchaseId} (attempt ${attempt}/${3})`)

    // Send the email
    const result = await step.run('send-email', async () => {
      return await sendCreditPurchaseConfirmationEmail(
        userEmail,
        userName,
        {
          creditsAmount,
          totalPrice,
          packageName,
          newBalance,
        }
      )
    })

    // Check result
    if (!result.success) {
      const errorMessage = result.error || 'Unknown email error'

      safeError(`[Credit Purchase Email] Failed to send email for credit purchase ${creditPurchaseId}`, {
        error: errorMessage,
        attempt,
      })

      // On final retry failure, record in dead letter queue
      if (attempt === 3) {
        await step.run('record-failure', async () => {
          await recordFailedOperation({
            operationType: 'email',
            operationId: creditPurchaseId,
            eventData: event.data,
            errorMessage,
            retryCount: attempt,
          })
        })

        await step.run('alert-failure', async () => {
          await sendSlackAlert({
            type: 'email_failure',
            severity: 'critical',
            message: `Credit purchase email failed after 3 retries for purchase ${creditPurchaseId}`,
            metadata: {
              creditPurchaseId,
              userEmail,
              error: errorMessage,
            },
          })
        })
      }

      throw new Error(`Email send failed: ${errorMessage}`)
    }

    safeLog(`[Credit Purchase Email] Successfully sent email for credit purchase ${creditPurchaseId}`, {
      messageId: result.messageId,
    })

    return {
      success: true,
      messageId: result.messageId,
      creditPurchaseId,
    }
  }
)
