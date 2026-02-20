/**
 * Abandoned Cart Recovery
 *
 * Cron job (every 4 hours) that queries Stripe for abandoned checkout sessions
 * and sends recovery emails nudging users to complete their purchase.
 *
 * Targeting:
 *   - Stripe checkout sessions created in the last 24h
 *   - Status 'expired' or 'open', but older than 1 hour (give them time to finish)
 *   - Not already sent a recovery email for this checkout session ID
 *
 * Deduplication:
 *   Uses the notifications table with title 'Abandoned Cart Recovery Email Sent'
 *   and the checkout session ID stored in metadata.stripe_session_id.
 *
 * Safety:
 *   - Max 10 recovery emails per cron run to avoid spamming
 *   - Only sends to sessions with valid customer email
 *
 * Schedule: Every 4 hours (0 *​/4 * * *)
 */

import { inngest } from '../client'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import Stripe from 'stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
const LOG_PREFIX = '[AbandonedCart]'
const MAX_EMAILS_PER_RUN = 10
const NOTIFICATION_TITLE = 'Abandoned Cart Recovery Email Sent'

interface AbandonedSession {
  sessionId: string
  customerEmail: string
  customerName: string | null
  amountTotal: number | null
  currency: string
  metadata: Record<string, string>
  createdAt: number
}

/**
 * Build the abandoned cart recovery email HTML.
 */
function buildRecoveryEmailHtml(session: AbandonedSession): string {
  const firstName = session.customerName?.split(' ')[0] || 'there'
  const marketplaceUrl = `${APP_URL}/marketplace`

  // Format price if available
  const priceDisplay =
    session.amountTotal && session.amountTotal > 0
      ? `$${(session.amountTotal / 100).toFixed(2)}`
      : null

  // Determine what they were purchasing from metadata
  const purchaseType = session.metadata?.type || 'credit_purchase'
  const credits = session.metadata?.credits
  const leadCount = session.metadata?.lead_count

  let purchaseDescription = 'your lead credits'
  if (purchaseType === 'credit_purchase' && credits) {
    purchaseDescription = `${credits} lead credits`
  } else if (purchaseType === 'lead_purchase' && leadCount) {
    purchaseDescription = `${leadCount} leads`
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete your purchase</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    Your leads are waiting -- complete your purchase to start closing deals.
  </div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <img src="${APP_URL}/cursive-logo.png" alt="Cursive" style="height: 36px;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #111827; line-height: 30px;">
                Hey ${firstName}, your leads are waiting!
              </h1>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 24px;">
                It looks like you started a checkout for <strong>${purchaseDescription}</strong> but didn't finish.
                No worries -- your cart is ready when you are.
              </p>

              <!-- Purchase Summary -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 0 0 8px 0;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">
                            Your Order Summary
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="font-size: 15px; color: #374151;">
                                ${purchaseDescription.charAt(0).toUpperCase() + purchaseDescription.slice(1)}
                              </td>
                              <td align="right" style="font-size: 15px; font-weight: 600; color: #111827;">
                                ${priceDisplay || 'See details'}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Urgency Block -->
              <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; margin-bottom: 32px; text-align: center;">
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #4f46e5;">
                  Don't miss out on these leads
                </p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6366f1;">
                  Fresh leads are claimed quickly. Complete your purchase to lock them in.
                </p>
              </div>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${marketplaceUrl}" style="display: inline-block; padding: 14px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Complete Your Purchase
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0 0; font-size: 15px; color: #6b7280; line-height: 22px;">
                If you ran into any issues during checkout, just reply to this email and we'll help you out right away.
              </p>

              <!-- Signature -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 15px; color: #374151;">
                  Best,<br/>
                  The Cursive Team
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">
                Cursive &middot; AI-powered lead intelligence
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                <a href="mailto:adam@meetcursive.com" style="color: #9ca3af; text-decoration: underline;">Contact Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export const abandonedCartRecovery = inngest.createFunction(
  {
    id: 'abandoned-cart-recovery',
    name: 'Abandoned Cart Recovery Emails',
    retries: 2,
    concurrency: [{ limit: 1 }],
    timeouts: { finish: '5m' },
  },
  { cron: '0 */4 * * *' },
  async ({ step }) => {
    safeLog(`${LOG_PREFIX} Starting abandoned cart recovery check`)

    // Step 1: Query Stripe for abandoned checkout sessions from the last 24 hours
    const abandonedSessions = await step.run('fetch-abandoned-sessions', async () => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

      const now = Math.floor(Date.now() / 1000)
      const twentyFourHoursAgo = now - 24 * 60 * 60
      const oneHourAgo = now - 60 * 60

      const sessions: AbandonedSession[] = []

      // Fetch expired sessions from the last 24 hours
      const expiredSessions = await stripe.checkout.sessions.list({
        created: { gte: twentyFourHoursAgo, lte: oneHourAgo },
        status: 'expired',
        limit: 100,
        expand: ['data.customer'],
      })

      for (const session of expiredSessions.data) {
        const email = session.customer_details?.email || session.customer_email
        if (!email) continue

        sessions.push({
          sessionId: session.id,
          customerEmail: email,
          customerName: session.customer_details?.name || null,
          amountTotal: session.amount_total,
          currency: session.currency || 'usd',
          metadata: (session.metadata || {}) as Record<string, string>,
          createdAt: session.created,
        })
      }

      // Also fetch open sessions older than 1 hour (user left mid-checkout)
      const openSessions = await stripe.checkout.sessions.list({
        created: { gte: twentyFourHoursAgo, lte: oneHourAgo },
        status: 'open',
        limit: 100,
        expand: ['data.customer'],
      })

      for (const session of openSessions.data) {
        const email = session.customer_details?.email || session.customer_email
        if (!email) continue

        sessions.push({
          sessionId: session.id,
          customerEmail: email,
          customerName: session.customer_details?.name || null,
          amountTotal: session.amount_total,
          currency: session.currency || 'usd',
          metadata: (session.metadata || {}) as Record<string, string>,
          createdAt: session.created,
        })
      }

      safeLog(`${LOG_PREFIX} Found ${sessions.length} abandoned checkout sessions`)
      return sessions
    })

    if (abandonedSessions.length === 0) {
      safeLog(`${LOG_PREFIX} No abandoned sessions found. Done.`)
      return { sent: 0, skipped: 0, total: 0 }
    }

    // Step 2: Deduplicate — filter out sessions we've already sent recovery emails for
    const eligibleSessions = await step.run('deduplicate-sessions', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const eligible: AbandonedSession[] = []
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      for (const raw of abandonedSessions) {
        // Cast from Inngest Jsonify back to our type
        const session = raw as unknown as AbandonedSession
        if (!session.sessionId || !session.customerEmail) continue

        // Check if we already sent a recovery email for this session ID in the last 24h
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'system')
          .eq('title', NOTIFICATION_TITLE)
          .gte('created_at', twentyFourHoursAgo)
          .contains('metadata', { stripe_session_id: session.sessionId })

        if (count && count > 0) {
          // Already sent for this session, skip
          continue
        }

        eligible.push(session)

        // Enforce max emails per run
        if (eligible.length >= MAX_EMAILS_PER_RUN) {
          break
        }
      }

      safeLog(
        `${LOG_PREFIX} ${eligible.length} sessions eligible after dedup (${abandonedSessions.length - eligible.length} already contacted)`
      )
      return eligible
    })

    if (eligibleSessions.length === 0) {
      safeLog(`${LOG_PREFIX} All abandoned sessions already contacted. Done.`)
      return { sent: 0, skipped: abandonedSessions.length, total: abandonedSessions.length }
    }

    // Step 3: Send recovery emails
    const sendResult = await step.run('send-recovery-emails', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      let sent = 0
      let failed = 0

      for (const raw of eligibleSessions) {
        // Cast from Inngest Jsonify back to our type
        const session = raw as unknown as AbandonedSession
        if (!session.sessionId || !session.customerEmail) continue

        try {
          // Try to find the user in our system by email for workspace_id
          const { data: user } = await supabase
            .from('users')
            .select('id, workspace_id, full_name')
            .eq('email', session.customerEmail)
            .maybeSingle()

          // Use Stripe name, fall back to DB name, then email
          const displayName =
            session.customerName || user?.full_name || session.customerEmail.split('@')[0]

          const html = buildRecoveryEmailHtml({
            ...session,
            customerName: displayName,
          })

          const result = await sendEmail({
            to: session.customerEmail,
            subject: 'You left something behind -- your leads are waiting!',
            html,
            tags: [{ name: 'category', value: 'abandoned_cart' }],
          })

          if (!result.success) {
            safeError(
              `${LOG_PREFIX} Failed to send recovery email to ${session.customerEmail}`,
              result.error
            )
            failed++
            continue
          }

          // Record the sent email in notifications for deduplication
          // Use the user's workspace_id if we found them, otherwise use a system workspace
          const notificationPayload: Record<string, any> = {
            type: 'system' as const,
            category: 'info' as const,
            title: NOTIFICATION_TITLE,
            message: `Abandoned cart recovery email sent for checkout session.`,
            metadata: {
              stripe_session_id: session.sessionId,
              customer_email: session.customerEmail,
              amount_total: session.amountTotal,
              purchase_type: session.metadata?.type || 'unknown',
              email_sent_at: new Date().toISOString(),
              email_message_id: result.messageId,
            },
          }

          if (user?.workspace_id) {
            notificationPayload.workspace_id = user.workspace_id
            notificationPayload.user_id = user.id
          }

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notificationPayload)

          if (notifError) {
            safeError(
              `${LOG_PREFIX} Failed to record notification for session ${session.sessionId}`,
              notifError
            )
            // Email was still sent, count as success
          }

          sent++
          safeLog(
            `${LOG_PREFIX} Sent recovery email to ${session.customerEmail} for session ${session.sessionId}`
          )
        } catch (err) {
          safeError(
            `${LOG_PREFIX} Error processing session ${session.sessionId}`,
            err
          )
          failed++
        }
      }

      return { sent, failed }
    })

    safeLog(
      `${LOG_PREFIX} Complete. Sent: ${sendResult.sent}, Failed: ${sendResult.failed}, Skipped: ${abandonedSessions.length - eligibleSessions.length}`
    )

    return {
      sent: sendResult.sent,
      failed: sendResult.failed,
      skipped: abandonedSessions.length - eligibleSessions.length,
      total: abandonedSessions.length,
    }
  }
)
