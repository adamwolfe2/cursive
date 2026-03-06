/**
 * Inactive User Re-engagement
 *
 * Daily cron that identifies users who have gone dark (7+ days inactive)
 * and sends them a personalized re-engagement email showing how many
 * new leads have arrived since they last logged in.
 *
 * Targeting:
 *   - updated_at on users table is 7+ days old (no logins, no activity)
 *   - Account is older than 14 days (skip brand-new users still onboarding)
 *   - No re-engagement notification in the last 30 days (avoid spamming)
 *
 * Schedule: Daily at 11 AM CT (16:00 UTC)
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[InactiveReengagement]'

/** Users inactive for this many days qualify */
const INACTIVE_DAYS = 7

/** Accounts must be at least this old (skip brand-new users) */
const MIN_ACCOUNT_AGE_DAYS = 14

/** Don't re-send within this window */
const COOLDOWN_DAYS = 30

/** Process users in batches */
const BATCH_SIZE = 50

interface InactiveUser {
  id: string
  email: string
  full_name: string | null
  workspace_id: string
  updated_at: string
  created_at: string
}

export const inactiveUserReengagement = inngest.createFunction(
  {
    id: 'inactive-user-reengagement',
    name: 'Inactive User Re-engagement Emails',
    retries: 2,
    timeouts: { finish: '5m' },
  },
  { cron: '0 16 * * *' }, // 11 AM CT / 4 PM UTC daily
  async ({ step }) => {
    safeLog(`${LOG_PREFIX} Starting daily re-engagement scan`)

    // Step 1: Find inactive users who qualify
    const inactiveUsers = await step.run('find-inactive-users', async () => {
      const supabase = createAdminClient()

      const now = new Date()
      const inactiveCutoff = new Date(now.getTime() - INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString()
      const minAgeCutoff = new Date(now.getTime() - MIN_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString()

      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, full_name, workspace_id, updated_at, created_at')
        .eq('is_active', true)
        .not('workspace_id', 'is', null)
        .lt('updated_at', inactiveCutoff) // inactive for 7+ days
        .lt('created_at', minAgeCutoff)   // account older than 14 days
        .limit(200) // safety cap

      if (error) {
        safeError(`${LOG_PREFIX} Error fetching inactive users:`, error)
        throw new Error(`Failed to fetch inactive users: ${error.message}`)
      }

      safeLog(`${LOG_PREFIX} Found ${users?.length ?? 0} potentially inactive users`)
      return (users || []) as InactiveUser[]
    })

    if (inactiveUsers.length === 0) {
      safeLog(`${LOG_PREFIX} No inactive users found. Done.`)
      return { success: true, processed: 0, emailed: 0, skipped: 0 }
    }

    // Step 2: Filter out users who received a re-engagement email recently
    const eligibleUsers = await step.run('filter-recently-contacted', async () => {
      const supabase = createAdminClient()
      const cooldownCutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString()

      const eligible: InactiveUser[] = []

      // Process in batches to avoid oversized queries
      for (let i = 0; i < inactiveUsers.length; i += BATCH_SIZE) {
        const batch = inactiveUsers.slice(i, i + BATCH_SIZE)
        const userIds = batch.map((u) => u.id)

        // Check which users already received a re-engagement notification recently
        const { data: recentNotifications } = await supabase
          .from('notifications')
          .select('user_id')
          .in('user_id', userIds)
          .eq('type', 'system')
          .eq('title', 'Re-engagement email sent')
          .gte('created_at', cooldownCutoff)

        const recentlyContactedIds = new Set(
          (recentNotifications || []).map((n: any) => n.user_id)
        )

        for (const user of batch) {
          if (!recentlyContactedIds.has(user.id)) {
            eligible.push(user as InactiveUser)
          }
        }
      }

      safeLog(`${LOG_PREFIX} ${eligible.length} users eligible after cooldown filter (${inactiveUsers.length - eligible.length} skipped)`)
      return eligible
    })

    if (eligibleUsers.length === 0) {
      safeLog(`${LOG_PREFIX} All inactive users were recently contacted. Done.`)
      return { success: true, processed: inactiveUsers.length, emailed: 0, skipped: inactiveUsers.length }
    }

    // Step 3: Send re-engagement emails in batches
    let totalEmailed = 0
    let totalFailed = 0

    for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
      const batch = eligibleUsers.slice(i, i + BATCH_SIZE)
      const batchIndex = Math.floor(i / BATCH_SIZE)

      const batchResult = await step.run(`send-batch-${batchIndex}`, async () => {
        const supabase = createAdminClient()
        let emailed = 0
        let failed = 0

        for (const user of batch) {
          try {
            // Count new leads that arrived since user was last active
            const { count: newLeadCount } = await supabase
              .from('leads')
              .select('id', { count: 'exact', head: true })
              .eq('workspace_id', user.workspace_id)
              .gte('created_at', user.updated_at)

            const leadCount = newLeadCount ?? 0
            const userName = user.full_name || user.email.split('@')[0]
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'

            // Build and send the email
            const html = buildReengagementEmail({
              userName,
              newLeadCount: leadCount,
              leadsUrl: `${baseUrl}/leads`,
              settingsUrl: `${baseUrl}/settings`,
              baseUrl,
            })

            const result = await sendEmail({
              to: user.email,
              subject: 'We miss you \u2014 your leads are waiting',
              html,
              tags: [
                { name: 'category', value: 'reengagement' },
                { name: 'type', value: 'inactive_user' },
              ],
            })

            if (!result.success) {
              safeError(`${LOG_PREFIX} Failed to send to ${user.id}:`, result.error)
              failed++
              continue
            }

            // Record the notification so we don't re-send within the cooldown
            await supabase.from('notifications').insert({
              workspace_id: user.workspace_id,
              user_id: user.id,
              type: 'system',
              category: 'info',
              title: 'Re-engagement email sent',
              message: `Inactive re-engagement email sent. ${leadCount} new leads since last activity.`,
              metadata: {
                email_type: 'inactive_reengagement',
                new_lead_count: leadCount,
                inactive_since: user.updated_at,
              },
            })

            emailed++
          } catch (err) {
            safeError(`${LOG_PREFIX} Error processing user ${user.id}:`, err)
            failed++
          }
        }

        return { emailed, failed }
      })

      totalEmailed += batchResult.emailed
      totalFailed += batchResult.failed
    }

    safeLog(
      `${LOG_PREFIX} Complete. Emailed: ${totalEmailed}, Failed: ${totalFailed}, Skipped: ${inactiveUsers.length - eligibleUsers.length}`
    )

    return {
      success: true,
      processed: inactiveUsers.length,
      emailed: totalEmailed,
      failed: totalFailed,
      skipped: inactiveUsers.length - eligibleUsers.length,
    }
  }
)

// ============================================================
// EMAIL TEMPLATE
// ============================================================

function buildReengagementEmail({
  userName,
  newLeadCount,
  leadsUrl,
  settingsUrl,
  baseUrl,
}: {
  userName: string
  newLeadCount: number
  leadsUrl: string
  settingsUrl: string
  baseUrl: string
}): string {
  const leadMessage =
    newLeadCount > 0
      ? `<strong>${newLeadCount} new lead${newLeadCount === 1 ? '' : 's'}</strong> matched to your profile since you were last active.`
      : `New leads are being matched to your profile every day.`

  const statBlock =
    newLeadCount > 0
      ? `
        <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
          <div style="font-size: 40px; font-weight: 700; color: #4f46e5;">${newLeadCount}</div>
          <div style="font-size: 14px; color: #6366f1; margin-top: 4px;">new leads waiting for you</div>
        </div>
      `
      : `
        <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
          <div style="font-size: 16px; color: #4f46e5; font-weight: 600;">Fresh leads are ready for you</div>
          <div style="font-size: 14px; color: #6366f1; margin-top: 4px;">Log in to see what's new</div>
        </div>
      `

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your leads are waiting</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f5;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="preheader" style="display:none;max-width:0;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff;opacity:0;">
    ${newLeadCount > 0 ? `${newLeadCount} leads matched while you were away` : 'New leads are waiting for you'}
  </div>
  <div class="email-wrapper">
    <!-- Header -->
    <div style="padding: 40px 40px 32px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
      <img src="${baseUrl}/cursive-logo.png" alt="Cursive" style="height: 40px;" />
    </div>

    <!-- Body -->
    <div style="padding: 40px; color: #000000; font-size: 16px; line-height: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #000000;">
        We miss you, ${userName}!
      </h2>

      <p style="margin: 0 0 16px 0;">
        It's been a while since you logged in, and we wanted to let you know that
        ${leadMessage}
      </p>

      ${statBlock}

      <p style="margin: 0 0 24px 0;">
        Don't let these leads go cold. Log in now to review them, reach out, and
        start closing deals.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${leadsUrl}"
           style="display: inline-block; padding: 14px 40px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View My Leads
        </a>
      </div>

      <!-- Signature -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
        <p style="margin: 0 0 4px 0;">Best,</p>
        <p style="margin: 0; font-weight: 600;">The Cursive Team</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 32px 40px; text-align: center; color: #71717a; font-size: 14px; line-height: 20px;">
      <p style="margin: 0 0 8px 0;">Cursive</p>
      <p style="margin: 0;">
        <a href="${settingsUrl}" style="color: #71717a; text-decoration: underline;">Update Preferences</a>
        &middot;
        <a href="mailto:adam@meetcursive.com" style="color: #71717a; text-decoration: underline;">Contact Support</a>
      </p>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #a1a1aa;">
        You're receiving this because you have an active Cursive account.
        <a href="${settingsUrl}" style="color: #a1a1aa; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}
