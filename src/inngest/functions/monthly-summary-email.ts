/**
 * Monthly Summary Email
 *
 * Sends a branded "Your [Month] Results" report to all active workspace owners
 * on the 1st of each month at 9 AM UTC. Includes lead delivery, enrichments,
 * meetings booked, top campaign, credits remaining, and month-over-month comparison.
 *
 * Skips workspaces with:
 *   - No primary user email
 *   - Zero activity in the past 30 days
 *   - Already received a monthly summary for this month (dedup via notifications table)
 *
 * Schedule: 0 9 1 * * (9 AM UTC on the 1st of every month)
 */

import { inngest } from '../client'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { APP_URL } from '@/lib/config/urls'

const LOG_PREFIX = '[MonthlySummary]'
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

interface MonthlyStats {
  leadsDelivered: number
  enrichmentsUsed: number
  meetingsBooked: number
  topCampaignName: string | null
  topCampaignReplyRate: number | null
  creditsRemaining: number
  creditLimit: number
  leadsDeliveredPriorMonth: number
  leadsChangePct: number | null
}

// ============================================================
// INNGEST FUNCTION
// ============================================================

export const monthlySummaryEmail = inngest.createFunction(
  {
    id: 'monthly-summary-email',
    name: 'Monthly Summary Email',
    retries: 2,
    timeouts: { finish: '10m' },
  },
  { cron: '0 9 1 * *' }, // 9 AM UTC on 1st of each month
  async ({ step }) => {
    safeLog(`${LOG_PREFIX} Starting monthly summary email run`)

    const now = new Date()

    // Last month window
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const lastMonthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

    // Month before last (for MoM comparison)
    const priorMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1))
    const priorMonthEnd   = lastMonthStart

    const lastMonthStartIso  = lastMonthStart.toISOString()
    const lastMonthEndIso    = lastMonthEnd.toISOString()
    const priorMonthStartIso = priorMonthStart.toISOString()
    const priorMonthEndIso   = priorMonthEnd.toISOString()

    const monthName = lastMonthStart.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
    const monthYear = lastMonthStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

    // Step 1: Find active workspaces (active status OR had leads in last 30 days)
    const activeWorkspaces = await step.run('find-active-workspaces', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      // Workspaces with status = 'active' or recent lead activity
      const { data: activeWs } = await supabase
        .from('workspaces')
        .select('id, name, status')
        .eq('status', 'active')

      const { data: recentActivity } = await supabase
        .from('leads')
        .select('workspace_id')
        .gte('created_at', lastMonthStartIso)
        .not('workspace_id', 'is', null)
        .limit(5000)

      const activeWsIds = new Set<string>(
        (activeWs ?? []).map((w: { id: string }) => w.id)
      )
      for (const row of recentActivity ?? []) {
        if (row.workspace_id) activeWsIds.add(row.workspace_id)
      }

      if (activeWsIds.size === 0) {
        safeLog(`${LOG_PREFIX} No active workspaces found`)
        return []
      }

      // Get primary users for each workspace
      const wsIdList = Array.from(activeWsIds)
      const { data: users } = await supabase
        .from('users')
        .select('id, email, full_name, workspace_id, daily_credit_limit, daily_credits_used')
        .in('workspace_id', wsIdList)
        .eq('is_active', true)
        .not('email', 'is', null)
        .order('workspace_id')

      const workspaceNameMap = new Map<string, string>()
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, name')
        .in('id', wsIdList)

      for (const ws of workspaces ?? []) {
        workspaceNameMap.set(ws.id, ws.name)
      }

      // One user per workspace (primary)
      const workspaceMap = new Map<string, typeof users extends (infer U)[] | null ? U : never>()
      for (const user of users ?? []) {
        if (user.workspace_id && !workspaceMap.has(user.workspace_id)) {
          workspaceMap.set(user.workspace_id, user)
        }
      }

      const result: WorkspaceWithUser[] = []
      workspaceMap.forEach((user, wsId) => {
        result.push({
          workspace_id: wsId,
          workspace_name: workspaceNameMap.get(wsId) || 'Your Workspace',
          user_id: user.id,
          user_email: user.email,
          user_name: user.full_name || user.email.split('@')[0],
          daily_credit_limit: user.daily_credit_limit ?? 0,
          daily_credits_used: user.daily_credits_used ?? 0,
        })
      })

      safeLog(`${LOG_PREFIX} Found ${result.length} active workspaces`)
      return result
    })

    if (activeWorkspaces.length === 0) {
      safeLog(`${LOG_PREFIX} No active workspaces. Done.`)
      return { success: true, processed: 0, sent: 0, skipped: 0 }
    }

    // Step 2: Filter out workspaces that already received a monthly summary this month
    const eligibleWorkspaces = await step.run('filter-already-sent', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const year  = lastMonthStart.getUTCFullYear()
      const month = lastMonthStart.getUTCMonth() + 1 // 1-indexed

      const eligible: WorkspaceWithUser[] = []

      for (let i = 0; i < activeWorkspaces.length; i += BATCH_SIZE) {
        const batch  = activeWorkspaces.slice(i, i + BATCH_SIZE)
        const wsIds  = batch.map((w) => w.workspace_id)

        const { data: existingNotifications } = await supabase
          .from('notifications')
          .select('workspace_id')
          .in('workspace_id', wsIds)
          .eq('type', 'monthly_summary')
          .in('reference_id', wsIds.map((id) => `${id}-${year}-${month}`))

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
      safeLog(`${LOG_PREFIX} All workspaces already received monthly summary. Done.`)
      return { success: true, processed: activeWorkspaces.length, sent: 0, skipped: activeWorkspaces.length }
    }

    // Step 3: Send emails in batches
    let totalSent    = 0
    let totalSkipped = 0
    let totalFailed  = 0

    const workspacesToProcess = eligibleWorkspaces.slice(0, BATCH_SIZE)

    for (let i = 0; i < workspacesToProcess.length; i += BATCH_SIZE) {
      const batch      = workspacesToProcess.slice(i, i + BATCH_SIZE)
      const batchIndex = Math.floor(i / BATCH_SIZE)

      const batchResult = await step.run(`send-batch-${batchIndex}`, async () => {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()
        let sent    = 0
        let skipped = 0
        let failed  = 0

        const year  = lastMonthStart.getUTCFullYear()
        const month = lastMonthStart.getUTCMonth() + 1

        for (const ws of batch) {
          try {
            const stats = await getMonthlyStats(supabase, ws.workspace_id, {
              lastMonthStartIso,
              lastMonthEndIso,
              priorMonthStartIso,
              priorMonthEndIso,
              creditLimit: ws.daily_credit_limit,
              creditsUsed: ws.daily_credits_used,
            })

            // Skip workspaces with zero last-month activity
            if (stats.leadsDelivered === 0 && stats.enrichmentsUsed === 0 && stats.meetingsBooked === 0) {
              skipped++
              continue
            }

            const html = buildMonthlySummaryEmail({
              userName:      ws.user_name,
              workspaceName: ws.workspace_name,
              monthYear,
              stats,
            })

            const result = await sendEmail({
              to:      ws.user_email,
              subject: `Your ${monthName} Results — Cursive`,
              html,
              tags:    [{ name: 'category', value: 'monthly_summary' }],
            })

            if (!result.success) {
              safeError(`${LOG_PREFIX} Failed to send to workspace ${ws.workspace_id}:`, result.error)
              failed++
              continue
            }

            // Dedup record
            await supabase.from('notifications').insert({
              workspace_id: ws.workspace_id,
              user_id:      ws.user_id,
              type:         'monthly_summary',
              category:     'info',
              reference_id: `${ws.workspace_id}-${year}-${month}`,
              title:        'Monthly summary email sent',
              message:      `Monthly summary for ${monthYear}: ${stats.leadsDelivered} leads delivered, ${stats.meetingsBooked} meetings booked.`,
              metadata: {
                email_type:       'monthly_summary',
                month_year:       monthYear,
                leads_delivered:  stats.leadsDelivered,
                enrichments_used: stats.enrichmentsUsed,
                meetings_booked:  stats.meetingsBooked,
                sent_at:          new Date().toISOString(),
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

      totalSent    += batchResult.sent
      totalSkipped += batchResult.skipped
      totalFailed  += batchResult.failed
    }

    safeLog(
      `${LOG_PREFIX} Complete. Sent: ${totalSent}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`
    )

    return {
      success:   true,
      processed: workspacesToProcess.length,
      sent:      totalSent,
      skipped:   totalSkipped,
      failed:    totalFailed,
    }
  }
)

// ============================================================
// STATS HELPER
// ============================================================

async function getMonthlyStats(
  supabase: any,
  workspaceId: string,
  opts: {
    lastMonthStartIso:  string
    lastMonthEndIso:    string
    priorMonthStartIso: string
    priorMonthEndIso:   string
    creditLimit:        number
    creditsUsed:        number
  }
): Promise<MonthlyStats> {
  const {
    lastMonthStartIso,
    lastMonthEndIso,
    priorMonthStartIso,
    priorMonthEndIso,
    creditLimit,
    creditsUsed,
  } = opts

  // Leads delivered last month
  const { count: leadsDelivered } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', lastMonthStartIso)
    .lt('created_at', lastMonthEndIso)

  // Leads delivered the month before (for MoM)
  const { count: leadsDeliveredPriorMonth } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', priorMonthStartIso)
    .lt('created_at', priorMonthEndIso)

  // Enrichments used last month (leads enriched)
  const { count: enrichmentsUsed } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .in('enrichment_status', ['enriched', 'completed'])
    .gte('updated_at', lastMonthStartIso)
    .lt('updated_at', lastMonthEndIso)

  // Meetings booked last month (cal_bookings)
  const { count: meetingsBooked } = await supabase
    .from('cal_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', lastMonthStartIso)
    .lt('created_at', lastMonthEndIso)

  // Top performing campaign (highest reply rate)
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('name, reply_rate')
    .eq('workspace_id', workspaceId)
    .not('reply_rate', 'is', null)
    .order('reply_rate', { ascending: false })
    .limit(1)
    .maybeSingle()

  const topCampaignName      = campaigns?.name ?? null
  const topCampaignReplyRate = campaigns?.reply_rate ?? null

  const creditsRemaining = Math.max(0, creditLimit - creditsUsed)

  // Month-over-month % change
  const thisMonthLeads  = leadsDelivered ?? 0
  const priorMonthLeads = leadsDeliveredPriorMonth ?? 0
  let leadsChangePct: number | null = null
  if (priorMonthLeads > 0) {
    leadsChangePct = Math.round(((thisMonthLeads - priorMonthLeads) / priorMonthLeads) * 100)
  } else if (thisMonthLeads > 0) {
    leadsChangePct = 100
  }

  return {
    leadsDelivered:         thisMonthLeads,
    enrichmentsUsed:        enrichmentsUsed ?? 0,
    meetingsBooked:         meetingsBooked ?? 0,
    topCampaignName,
    topCampaignReplyRate,
    creditsRemaining,
    creditLimit,
    leadsDeliveredPriorMonth: priorMonthLeads,
    leadsChangePct,
  }
}

// ============================================================
// EMAIL TEMPLATE
// ============================================================

function buildMonthlySummaryEmail({
  userName,
  workspaceName,
  monthYear,
  stats,
}: {
  userName:      string
  workspaceName: string
  monthYear:     string
  stats:         MonthlyStats
}): string {
  const dashboardUrl   = `${APP_URL}/dashboard`
  const billingUrl     = `${APP_URL}/settings/billing`
  const emailPrefsUrl  = `${APP_URL}/settings/notifications`
  const logoUrl        = `${APP_URL}/cursive-logo.png`
  const campaignsUrl   = `${APP_URL}/campaigns`
  const currentYear    = new Date().getFullYear()

  const lowCredits = stats.creditsRemaining < 20

  // Month-over-month badge
  const momBadgeHtml = stats.leadsChangePct !== null
    ? (() => {
        const isPositive = stats.leadsChangePct >= 0
        const sign       = isPositive ? '+' : ''
        const color      = isPositive ? '#16a34a' : '#dc2626'
        const bg         = isPositive ? '#f0fdf4' : '#fef2f2'
        const border     = isPositive ? '#bbf7d0' : '#fecaca'
        return `<span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background-color: ${bg}; border: 1px solid ${border}; border-radius: 9999px; font-size: 11px; font-weight: 600; color: ${color};">${sign}${stats.leadsChangePct}% vs prior month</span>`
      })()
    : ''

  // Top campaign block
  const topCampaignHtml = stats.topCampaignName
    ? `
    <tr>
      <td style="padding: 14px 20px; border-bottom: 1px solid #f3f4f6; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">Top Campaign</td>
            <td style="text-align: right; line-height: 1.4;">
              <span style="font-size: 14px; font-weight: 600; color: #111827;">${stats.topCampaignName}</span>
              ${stats.topCampaignReplyRate !== null ? `<span style="font-size: 12px; color: #6b7280; margin-left: 6px;">${(stats.topCampaignReplyRate * 100).toFixed(1)}% reply rate</span>` : ''}
            </td>
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
                <strong>Credits running low.</strong> You have ${stats.creditsRemaining} credit${stats.creditsRemaining === 1 ? '' : 's'} remaining.
                <a href="${billingUrl}" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">Purchase more credits</a> to keep your pipeline full.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
    : ''

  const meetingsCelebration = stats.meetingsBooked > 0
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px;">
      <tr>
        <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px;">
          <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #15803d;">
            ${stats.meetingsBooked} meeting${stats.meetingsBooked === 1 ? '' : 's'} booked last month.
          </p>
          <p style="margin: 0; font-size: 13px; color: #16a34a; line-height: 1.5;">
            Your pipeline is converting. Check <a href="${campaignsUrl}" style="color: #15803d; text-decoration: underline;">your campaigns</a> to see what's working.
          </p>
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
  <title>Your ${monthYear} Results</title>
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
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${stats.leadsDelivered} leads delivered in ${monthYear}${stats.meetingsBooked > 0 ? ` · ${stats.meetingsBooked} meetings booked` : ''}${stats.leadsChangePct !== null ? ` · ${stats.leadsChangePct >= 0 ? '+' : ''}${stats.leadsChangePct}% vs last month` : ''}</div>

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
              <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Monthly Report</p>
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827; line-height: 1.3;">Your ${monthYear} Results</h1>
              <p style="margin: 0 0 28px; font-size: 15px; color: #4b5563; line-height: 1.5;">Hi ${userName}, here&apos;s a full recap of what happened in <strong>${workspaceName}</strong> last month.</p>

              <!-- Stats cards -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">

                <!-- Leads Delivered -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f3f4f6; background-color: #f9fafb;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">
                          Leads Delivered${momBadgeHtml}
                        </td>
                        <td style="font-size: 22px; font-weight: 700; color: #4f46e5; text-align: right; line-height: 1.4;">${stats.leadsDelivered}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Enrichments Used -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f3f4f6;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">Enrichments Used</td>
                        <td style="font-size: 22px; font-weight: 700; color: #111827; text-align: right; line-height: 1.4;">${stats.enrichmentsUsed}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Meetings Booked -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f3f4f6; background-color: #f9fafb;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">Meetings Booked</td>
                        <td style="font-size: 22px; font-weight: 700; color: ${stats.meetingsBooked > 0 ? '#4f46e5' : '#111827'}; text-align: right; line-height: 1.4;">${stats.meetingsBooked}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Credits Remaining -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: ${stats.topCampaignName ? '1px solid #f3f4f6' : 'none'};">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; line-height: 1.4;">Credits Remaining</td>
                        <td style="font-size: 22px; font-weight: 700; color: ${lowCredits ? '#f59e0b' : '#22c55e'}; text-align: right; line-height: 1.4;">${stats.creditsRemaining} <span style="font-size: 13px; font-weight: 400; color: #6b7280;">/ ${stats.creditLimit}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Top Campaign (if available) -->
                ${topCampaignHtml}

              </table>

              <!-- Meetings celebration -->
              ${meetingsCelebration}

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

              <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">You receive this report on the 1st of each month. Adjust in <a href="${emailPrefsUrl}" style="color: #6b7280; text-decoration: underline;">email preferences</a>.</p>

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
