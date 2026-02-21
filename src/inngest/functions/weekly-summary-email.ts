/**
 * Weekly Summary Email
 *
 * Sends a branded "Your Week in Review" digest email to all active workspaces
 * every Monday at 9 AM CT (14:00 UTC). Includes lead stats, enrichment counts,
 * credit usage, and top lead source for the past 7 days.
 *
 * Skips workspaces with:
 *   - No primary user email
 *   - Zero activity in the past week
 *   - Already received a summary this week (dedup via notifications table)
 *
 * Schedule: Monday 9 AM CT = 0 14 * * 1 (UTC)
 */

import { inngest } from '../client'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
const LOG_PREFIX = '[WeeklySummary]'
const BATCH_SIZE = 50

// ============================================================
// TYPES
// ============================================================

interface WorkspaceWithUser {
  workspace_id: string
  workspace_name: string
  user_id: string
  user_email: string
  user_name: string
  daily_credit_limit: number
  daily_credits_used: number
}

interface WeeklyStats {
  leadsReceived: number
  leadsEnriched: number
  creditsUsed: number
  creditsRemaining: number
  topSource: string | null
}

// ============================================================
// INNGEST FUNCTION
// ============================================================

export const weeklySummaryEmail = inngest.createFunction(
  {
    id: 'weekly-summary-email',
    name: 'Weekly Summary Email',
    retries: 2,
    timeouts: { finish: '5m' },
  },
  { cron: '0 14 * * 1' }, // Monday 9 AM CT = 14:00 UTC
  async ({ step }) => {
    safeLog(`${LOG_PREFIX} Starting weekly summary email run`)

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Step 1: Find active workspaces with recent activity
    const activeWorkspaces = await step.run('find-active-workspaces', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      // Get all active users with workspace info who have been active in the last 30 days
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, full_name, workspace_id, daily_credit_limit, daily_credits_used, updated_at')
        .eq('is_active', true)
        .not('workspace_id', 'is', null)
        .not('email', 'is', null)
        .gte('updated_at', thirtyDaysAgo)
        .order('workspace_id')

      if (error) {
        safeError(`${LOG_PREFIX} Error fetching active users:`, error)
        throw new Error(`Failed to fetch active users: ${error.message}`)
      }

      if (!users || users.length === 0) {
        safeLog(`${LOG_PREFIX} No active users found`)
        return []
      }

      // Deduplicate by workspace_id — pick the first user per workspace (primary)
      const workspaceMap = new Map<string, typeof users[0]>()
      for (const user of users) {
        if (!workspaceMap.has(user.workspace_id)) {
          workspaceMap.set(user.workspace_id, user)
        }
      }

      // Fetch workspace names
      const workspaceIds = Array.from(workspaceMap.keys())
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, name')
        .in('id', workspaceIds)

      const workspaceNameMap = new Map<string, string>()
      for (const ws of workspaces || []) {
        workspaceNameMap.set(ws.id, ws.name)
      }

      const result: WorkspaceWithUser[] = []
      workspaceMap.forEach((user, wsId) => {
        result.push({
          workspace_id: wsId,
          workspace_name: workspaceNameMap.get(wsId) || 'Your Workspace',
          user_id: user.id,
          user_email: user.email,
          user_name: user.full_name || user.email.split('@')[0],
          daily_credit_limit: user.daily_credit_limit,
          daily_credits_used: user.daily_credits_used,
        })
      })

      safeLog(`${LOG_PREFIX} Found ${result.length} active workspaces`)
      return result
    })

    if (activeWorkspaces.length === 0) {
      safeLog(`${LOG_PREFIX} No active workspaces. Done.`)
      return { success: true, processed: 0, sent: 0, skipped: 0 }
    }

    // Step 2: Filter out workspaces that already received a summary this week
    const eligibleWorkspaces = await step.run('filter-already-sent', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      // Find the start of the current week (Monday 00:00 UTC)
      const now = new Date()
      const dayOfWeek = now.getUTCDay() // 0=Sun, 1=Mon, ...
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const weekStart = new Date(now)
      weekStart.setUTCDate(now.getUTCDate() - daysSinceMonday)
      weekStart.setUTCHours(0, 0, 0, 0)
      const weekStartIso = weekStart.toISOString()

      const eligible: WorkspaceWithUser[] = []

      // Process in batches to avoid oversized queries
      for (let i = 0; i < activeWorkspaces.length; i += BATCH_SIZE) {
        const batch = activeWorkspaces.slice(i, i + BATCH_SIZE)
        const wsIds = batch.map((w) => w.workspace_id)

        // Check which workspaces already received a weekly summary this week
        const { data: existingNotifications } = await supabase
          .from('notifications')
          .select('workspace_id')
          .in('workspace_id', wsIds)
          .eq('type', 'system')
          .eq('title', 'Weekly summary email sent')
          .gte('created_at', weekStartIso)

        const alreadySentIds = new Set(
          (existingNotifications || []).map((n: any) => n.workspace_id)
        )

        for (const ws of batch) {
          if (!alreadySentIds.has(ws.workspace_id)) {
            eligible.push(ws as WorkspaceWithUser)
          }
        }
      }

      safeLog(
        `${LOG_PREFIX} ${eligible.length} eligible after dedup (${activeWorkspaces.length - eligible.length} already received)`
      )
      return eligible
    })

    if (eligibleWorkspaces.length === 0) {
      safeLog(`${LOG_PREFIX} All workspaces already received summary this week. Done.`)
      return { success: true, processed: activeWorkspaces.length, sent: 0, skipped: activeWorkspaces.length }
    }

    // Step 3: Send emails in batches
    let totalSent = 0
    let totalSkipped = 0
    let totalFailed = 0

    // Cap at 50 workspaces per run to avoid timeout
    const workspacesToProcess = eligibleWorkspaces.slice(0, BATCH_SIZE)

    for (let i = 0; i < workspacesToProcess.length; i += BATCH_SIZE) {
      const batch = workspacesToProcess.slice(i, i + BATCH_SIZE)
      const batchIndex = Math.floor(i / BATCH_SIZE)

      const batchResult = await step.run(`send-batch-${batchIndex}`, async () => {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()
        let sent = 0
        let skipped = 0
        let failed = 0

        for (const ws of batch) {
          try {
            // Get workspace stats for the past 7 days
            const stats = await getWeeklyStats(supabase, ws.workspace_id, sevenDaysAgo)

            // Skip workspaces with zero activity
            if (stats.leadsReceived === 0 && stats.leadsEnriched === 0) {
              skipped++
              continue
            }

            // Build and send the email
            const html = buildWeeklySummaryEmail({
              userName: ws.user_name,
              workspaceName: ws.workspace_name,
              stats,
            })

            const result = await sendEmail({
              to: ws.user_email,
              subject: 'Your Week in Review — Cursive',
              html,
              tags: [{ name: 'category', value: 'weekly_summary' }],
            })

            if (!result.success) {
              safeError(`${LOG_PREFIX} Failed to send to workspace ${ws.workspace_id}:`, result.error)
              failed++
              continue
            }

            // Record the notification for dedup
            await supabase.from('notifications').insert({
              workspace_id: ws.workspace_id,
              user_id: ws.user_id,
              type: 'system',
              category: 'info',
              title: 'Weekly summary email sent',
              message: `Weekly summary: ${stats.leadsReceived} leads received, ${stats.leadsEnriched} enriched.`,
              metadata: {
                email_type: 'weekly_summary',
                leads_received: stats.leadsReceived,
                leads_enriched: stats.leadsEnriched,
                credits_used: stats.creditsUsed,
                top_source: stats.topSource,
                sent_at: new Date().toISOString(),
              },
            })

            sent++
          } catch (err) {
            safeError(`${LOG_PREFIX} Error processing workspace ${ws.workspace_id}:`, err)
            failed++
          }
        }

        return { sent, skipped, failed }
      })

      totalSent += batchResult.sent
      totalSkipped += batchResult.skipped
      totalFailed += batchResult.failed
    }

    safeLog(
      `${LOG_PREFIX} Complete. Sent: ${totalSent}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`
    )

    return {
      success: true,
      processed: workspacesToProcess.length,
      sent: totalSent,
      skipped: totalSkipped,
      failed: totalFailed,
    }
  }
)

// ============================================================
// STATS HELPER
// ============================================================

async function getWeeklyStats(
  supabase: any,
  workspaceId: string,
  sevenDaysAgo: string
): Promise<WeeklyStats> {
  // Leads received in the past 7 days
  const { count: leadsReceived } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', sevenDaysAgo)

  // Leads enriched in the past 7 days
  const { count: leadsEnriched } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .in('enrichment_status', ['enriched', 'completed'])
    .gte('created_at', sevenDaysAgo)

  // Top lead source for the period
  const { data: sourceData } = await supabase
    .from('leads')
    .select('source')
    .eq('workspace_id', workspaceId)
    .gte('created_at', sevenDaysAgo)
    .not('source', 'is', null)
    .limit(500)

  let topSource: string | null = null
  if (sourceData && sourceData.length > 0) {
    const sourceCounts = new Map<string, number>()
    for (const row of sourceData) {
      if (row.source) {
        sourceCounts.set(row.source, (sourceCounts.get(row.source) || 0) + 1)
      }
    }
    let maxCount = 0
    sourceCounts.forEach((count, source) => {
      if (count > maxCount) {
        maxCount = count
        topSource = source
      }
    })
  }

  // Credits: get the primary user's current balance
  // daily_credits_used is the current day's usage; daily_credit_limit is their total
  // For the weekly summary, we report remaining credits as limit - used
  const { data: userData } = await supabase
    .from('users')
    .select('daily_credit_limit, daily_credits_used')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const creditLimit = userData?.daily_credit_limit ?? 0
  const creditsUsed = userData?.daily_credits_used ?? 0
  const creditsRemaining = Math.max(0, creditLimit - creditsUsed)

  return {
    leadsReceived: leadsReceived ?? 0,
    leadsEnriched: leadsEnriched ?? 0,
    creditsUsed,
    creditsRemaining,
    topSource,
  }
}

// ============================================================
// EMAIL TEMPLATE
// ============================================================

function formatSource(source: string): string {
  // Make source names human-readable
  return source
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildWeeklySummaryEmail({
  userName,
  workspaceName,
  stats,
}: {
  userName: string
  workspaceName: string
  stats: WeeklyStats
}): string {
  const dashboardUrl = `${APP_URL}/dashboard`
  const billingUrl = `${APP_URL}/settings/billing`
  const emailPrefsUrl = `${APP_URL}/settings/notifications`
  const logoUrl = `${APP_URL}/cursive-logo.png`
  const currentYear = new Date().getFullYear()

  const lowCredits = stats.creditsRemaining < 20

  const topSourceHtml = stats.topSource
    ? `
    <tr>
      <td style="padding: 14px 20px; border-bottom: 1px solid #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">Top Source</td>
            <td style="font-size: 15px; font-weight: 600; color: #111827; text-align: right; line-height: 1.4;">${formatSource(stats.topSource)}</td>
          </tr>
        </table>
      </td>
    </tr>`
    : ''

  const lowCreditNudge = lowCredits
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px;">
      <tr>
        <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="font-size: 14px; color: #92400e; line-height: 1.5;">
                <strong>Credits running low.</strong> You have ${stats.creditsRemaining} credit${stats.creditsRemaining === 1 ? '' : 's'} remaining today.
                <a href="${billingUrl}" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Purchase more credits</a> to keep your pipeline full.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Week in Review</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #111827;
      background-color: #f9fafb;
    }
    @media only screen and (max-width: 640px) {
      .email-container { width: 100% !important; padding: 0 16px !important; }
      .email-body { padding: 24px 20px !important; }
      .email-header { padding: 20px 20px 16px !important; }
      .email-footer { padding: 20px !important; }
      .cta-button { display: block !important; width: 100% !important; text-align: center !important; }
      .stat-cell { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">Your Cursive weekly summary: ${stats.leadsReceived} leads received, ${stats.leadsEnriched} enriched this week.</div>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Email container -->
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header with logo -->
          <tr>
            <td class="email-header" style="padding: 32px 40px 24px; border-bottom: 1px solid #e5e7eb;">
              <img src="${logoUrl}" alt="Cursive" width="120" height="28" style="display: block;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding: 32px 40px;">

              <!-- Greeting -->
              <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Weekly Summary</p>
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827; line-height: 1.3;">Your Week in Review</h1>
              <p style="margin: 0 0 28px; font-size: 15px; color: #4b5563; line-height: 1.5;">Hi ${userName}, here's what happened in <strong>${workspaceName}</strong> over the past 7 days.</p>

              <!-- Stats cards -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">

                <!-- Leads Received -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f3f4f6; background-color: #f9fafb;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">Leads Received</td>
                        <td style="font-size: 22px; font-weight: 700; color: #4f46e5; text-align: right; line-height: 1.4;">${stats.leadsReceived}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Leads Enriched -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f3f4f6;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">Leads Enriched</td>
                        <td style="font-size: 22px; font-weight: 700; color: #111827; text-align: right; line-height: 1.4;">${stats.leadsEnriched}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Credits Used -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f3f4f6; background-color: #f9fafb;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">Credits Used Today</td>
                        <td style="font-size: 22px; font-weight: 700; color: #111827; text-align: right; line-height: 1.4;">${stats.creditsUsed}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Credits Remaining -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: ${stats.topSource ? '1px solid #f3f4f6' : 'none'};">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">Credits Remaining</td>
                        <td style="font-size: 22px; font-weight: 700; color: ${lowCredits ? '#f59e0b' : '#22c55e'}; text-align: right; line-height: 1.4;">${stats.creditsRemaining}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Top Source (if available) -->
                ${topSourceHtml}

              </table>

              <!-- Low credit nudge -->
              ${lowCreditNudge}

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 28px 0 8px;">
                <tr>
                  <td class="cta-button" style="background-color: #4f46e5; border-radius: 6px;">
                    <a href="${dashboardUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">View Your Dashboard</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">You receive this summary every Monday. Adjust frequency in <a href="${emailPrefsUrl}" style="color: #6b7280; text-decoration: underline;">email preferences</a>.</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
                &copy; ${currentYear} Cursive. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
                <a href="${emailPrefsUrl}" style="color: #6b7280; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:adam@meetcursive.com" style="color: #6b7280; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}
