/**
 * Abandoned Onboarding Recovery
 *
 * Daily cron that identifies users who signed up but haven't completed
 * key onboarding steps, and sends them a recovery email to re-engage.
 *
 * Checks for users who:
 *   1. Created their account 24h - 7d ago
 *   2. Haven't set targeting preferences, OR haven't installed a pixel,
 *      OR haven't received any enriched leads
 *   3. Haven't already received this recovery email
 *
 * Schedule: Daily at 10 AM CT (15:00 UTC)
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AbandonedOnboarding]'
const BATCH_SIZE = 50
const NOTIFICATION_TITLE = 'Onboarding Recovery Email Sent'
import { APP_URL } from '@/lib/config/urls'

interface IncompleteUser {
  id: string
  email: string
  full_name: string | null
  workspace_id: string
  created_at: string
  missingSteps: string[]
}

/**
 * Build the recovery email HTML for a user based on their missing onboarding steps.
 */
function buildRecoveryEmailHtml(user: IncompleteUser): string {
  const firstName = user.full_name?.split(' ')[0] || 'there'
  const dashboardUrl = `${APP_URL}/dashboard`
  const targetingUrl = `${APP_URL}/leads/preferences`
  const pixelUrl = `${APP_URL}/settings/pixel`
  const leadsUrl = `${APP_URL}/leads`

  const stepItems = user.missingSteps.map((step) => {
    let label = ''
    let url = dashboardUrl
    switch (step) {
      case 'targeting':
        label = 'Set your targeting preferences (industries, locations)'
        url = targetingUrl
        break
      case 'pixel':
        label = 'Install your website visitor pixel'
        url = pixelUrl
        break
      case 'leads':
        label = 'Get your first enriched leads'
        url = leadsUrl
        break
    }
    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="28" valign="top" style="padding-right: 12px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #d1d5db; text-align: center; line-height: 22px; color: #9ca3af; font-size: 14px;">&#x2013;</div>
              </td>
              <td>
                <p style="margin: 0; font-size: 15px; color: #374151;">${label}</p>
                <a href="${url}" style="font-size: 13px; color: #4f46e5; text-decoration: none;">Complete this step &rarr;</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finish setting up Cursive</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    You're almost there -- just a few steps to start getting leads.
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
                Hey ${firstName}, you're almost there!
              </h1>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 24px;">
                You signed up for Cursive but haven't finished setting things up yet. Complete these steps to start receiving high-quality leads tailored to your business:
              </p>

              <!-- Steps checklist -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 32px;">
                ${stepItems}
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0 0; font-size: 15px; color: #6b7280; line-height: 22px;">
                It only takes a few minutes to get set up. If you have any questions, just reply to this email and we'll help you get started.
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
              <p style="margin:4px 0 0;font-size:12px;"><a href="${APP_URL}/settings/notifications" style="color:#9ca3af;text-decoration:underline;">Manage email preferences</a> &middot; <a href="mailto:hello@meetcursive.com" style="color:#9ca3af;text-decoration:underline;">Contact support</a></p>
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

export const abandonedOnboardingRecovery = inngest.createFunction(
  {
    id: 'abandoned-onboarding-recovery',
    name: 'Abandoned Onboarding Recovery Emails',
    retries: 2,
    concurrency: [{ limit: 1 }],
    timeouts: { finish: '5m' },
  },
  { cron: '0 15 * * *' }, // 10 AM CT / 3 PM UTC daily
  async ({ step }) => {
    safeLog(`${LOG_PREFIX} Starting daily abandoned onboarding check`)

    // Step 1: Find users who created accounts 24h - 7d ago and haven't completed onboarding
    const incompleteUsers = await step.run('find-incomplete-users', async () => {
      const supabase = createAdminClient()

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Get users created in the 24h - 7d window
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, workspace_id, created_at')
        .lt('created_at', oneDayAgo)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true })
        .limit(500)

      if (usersError) {
        safeError(`${LOG_PREFIX} Failed to query users`, usersError)
        throw new Error(`Failed to query users: ${usersError.message}`)
      }

      if (!users || users.length === 0) {
        safeLog(`${LOG_PREFIX} No users in the 24h-7d window`)
        return []
      }

      safeLog(`${LOG_PREFIX} Found ${users.length} users in the 24h-7d window`)

      const incomplete: IncompleteUser[] = []

      for (const user of users) {
        const missingSteps: string[] = []

        // Check 1: Has targeting preferences been set?
        const { data: targeting } = await supabase
          .from('user_targeting')
          .select('id, target_industries, target_states')
          .eq('user_id', user.id)
          .maybeSingle()

        if (
          !targeting ||
          (!targeting.target_industries?.length && !targeting.target_states?.length)
        ) {
          missingSteps.push('targeting')
        }

        // Check 2: Has a pixel been installed?
        const { count: pixelCount } = await supabase
          .from('audiencelab_pixels')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', user.workspace_id)
          .eq('is_active', true)

        if (!pixelCount || pixelCount === 0) {
          missingSteps.push('pixel')
        }

        // Check 3: Has at least one enriched lead?
        const { count: leadCount } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', user.workspace_id)

        if (!leadCount || leadCount === 0) {
          missingSteps.push('leads')
        }

        // Only include if at least one step is incomplete
        if (missingSteps.length === 0) continue

        // Check: Has this user already received the recovery email?
        // Look for an existing notification with our specific title
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', user.workspace_id)
          .eq('user_id', user.id)
          .eq('type', 'system')
          .eq('title', NOTIFICATION_TITLE)

        if (notifCount && notifCount > 0) {
          // Already sent, skip
          continue
        }

        incomplete.push({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          workspace_id: user.workspace_id,
          created_at: user.created_at,
          missingSteps,
        })
      }

      safeLog(`${LOG_PREFIX} Found ${incomplete.length} incomplete users to email`)
      return incomplete
    })

    if (incompleteUsers.length === 0) {
      safeLog(`${LOG_PREFIX} No incomplete users found. Done.`)
      return { sent: 0, skipped: 0 }
    }

    // Step 2: Process in batches of BATCH_SIZE
    let totalSent = 0
    let totalSkipped = 0
    const batches = Math.ceil(incompleteUsers.length / BATCH_SIZE)

    for (let batchIdx = 0; batchIdx < batches; batchIdx++) {
      const batchStart = batchIdx * BATCH_SIZE
      const batchUsers = incompleteUsers.slice(batchStart, batchStart + BATCH_SIZE)

      const batchResult = await step.run(`send-batch-${batchIdx}`, async () => {
        const supabase = createAdminClient()
        let sent = 0
        let skipped = 0

        for (const user of batchUsers) {
          try {
            // Record dedup notification BEFORE sending to prevent duplicate emails on retry.
            // If Inngest retries this step after a partial run, the dedup record ensures
            // we don't re-send to users that were already emailed.
            const { data: insertedNotif, error: notifError } = await supabase
              .from('notifications')
              .insert({
                workspace_id: user.workspace_id,
                user_id: user.id,
                type: 'system',
                category: 'action_required',
                title: NOTIFICATION_TITLE,
                message: `Recovery email sent. Missing steps: ${user.missingSteps.join(', ')}`,
                action_url: `${APP_URL}/dashboard`,
                action_label: 'Complete Setup',
                priority: 0,
                metadata: {
                  missing_steps: user.missingSteps,
                  email_sent_at: new Date().toISOString(),
                },
              })
              .select('id')
              .maybeSingle()

            if (notifError) {
              if (notifError.code === '23505') {
                // Unique constraint — already sent, skip
                skipped++
                continue
              }
              safeError(`${LOG_PREFIX} Failed to create notification record for ${user.email}`, notifError)
              skipped++
              continue
            }

            // Send the recovery email
            const html = buildRecoveryEmailHtml(user)
            const result = await sendEmail({
              to: user.email,
              subject: "You're almost there -- finish setting up Cursive",
              html,
              tags: [
                { name: 'category', value: 'onboarding' },
                { name: 'type', value: 'abandoned_recovery' },
              ],
            })

            if (!result.success) {
              safeError(`${LOG_PREFIX} Failed to send email to ${user.email}`, result.error)
              // Delete the dedup record so a future retry can attempt this user again
              if (insertedNotif?.id) {
                await supabase.from('notifications').delete().eq('id', insertedNotif.id)
              }
              skipped++
              continue
            }

            sent++
            safeLog(`${LOG_PREFIX} Sent recovery email to ${user.email} (missing: ${user.missingSteps.join(', ')})`)
          } catch (err) {
            safeError(`${LOG_PREFIX} Error processing user ${user.email}`, err)
            skipped++
          }
        }

        return { sent, skipped }
      })

      totalSent += batchResult.sent
      totalSkipped += batchResult.skipped
    }

    safeLog(`${LOG_PREFIX} Complete. Sent: ${totalSent}, Skipped: ${totalSkipped}`)

    return {
      sent: totalSent,
      skipped: totalSkipped,
      totalEligible: incompleteUsers.length,
    }
  }
)
