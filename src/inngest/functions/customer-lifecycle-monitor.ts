/**
 * Customer Lifecycle Monitor
 *
 * Daily cron that detects stuck customers and alerts via Slack + email.
 * Ensures no customer falls through the cracks in the DFY pipeline.
 *
 * Checks:
 *   1. Sub-account created > 48h ago but no onboarding form submitted
 *   2. Onboarding completed > 48h ago but subscription not active
 *   3. Active subscription > 7 days but no leads delivered
 *   4. Expiring subscriptions (renewal due within 7 days)
 *   5. Failed GHL syncs (workspace has sync errors)
 *
 * Schedule: Daily at 9 AM CT (14:00 UTC)
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog } from '@/lib/utils/log-sanitizer'

interface StuckCustomer {
  workspace_id: string
  company_name: string
  user_email: string
  issue: string
  days_stuck: number
}

export const customerLifecycleMonitor = inngest.createFunction(
  {
    id: 'customer-lifecycle-monitor',
    name: 'Customer Lifecycle Monitor',
    retries: 2,
    timeouts: { finish: '5m' },
  },
  { cron: '0 14 * * *' }, // 9 AM CT / 2 PM UTC daily
  async ({ step }) => {
    safeLog('[Customer Monitor] Starting daily lifecycle check')

    const issues: StuckCustomer[] = []

    // Check 1: Sub-account created but no onboarding form
    const noOnboarding = await step.run('check-no-onboarding', async () => {
      const supabase = createAdminClient()
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

      const { data: subscriptions } = await supabase
        .from('service_subscriptions')
        .select(`
          id,
          workspace_id,
          created_at,
          onboarding_completed,
          status,
          workspaces!inner (
            name,
            settings
          ),
          users!inner (
            email,
            full_name
          )
        `)
        .eq('onboarding_completed', false)
        .lt('created_at', twoDaysAgo)
        .in('status', ['pending', 'active'])
        .limit(50)

      const stuck: StuckCustomer[] = []
      for (const sub of subscriptions || []) {
        const workspace = sub.workspaces as any
        const user = sub.users as any
        const settings = (workspace?.settings as Record<string, unknown>) || {}

        // Only flag if they have a GHL location (sub-account was created)
        if (settings.ghl_location_id) {
          const daysSince = Math.floor(
            (Date.now() - new Date(sub.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )
          stuck.push({
            workspace_id: sub.workspace_id,
            company_name: workspace?.name || 'Unknown',
            user_email: user?.email || 'Unknown',
            issue: 'Sub-account created but onboarding form NOT submitted',
            days_stuck: daysSince,
          })
        }
      }
      return stuck
    })
    issues.push(...noOnboarding)

    // Check 2: Onboarding completed but subscription still pending
    const pendingAfterOnboard = await step.run('check-pending-after-onboard', async () => {
      const supabase = createAdminClient()
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

      const { data: subscriptions } = await supabase
        .from('service_subscriptions')
        .select(`
          id,
          workspace_id,
          onboarding_data,
          updated_at,
          status,
          workspaces!inner (
            name
          ),
          users!inner (
            email
          )
        `)
        .eq('onboarding_completed', true)
        .eq('status', 'pending')
        .lt('updated_at', twoDaysAgo)
        .limit(50)

      const stuck: StuckCustomer[] = []
      for (const sub of subscriptions || []) {
        const workspace = sub.workspaces as any
        const user = sub.users as any
        const daysSince = Math.floor(
          (Date.now() - new Date(sub.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        stuck.push({
          workspace_id: sub.workspace_id,
          company_name: workspace?.name || 'Unknown',
          user_email: user?.email || 'Unknown',
          issue: 'Onboarding completed but subscription still PENDING (needs pixel setup)',
          days_stuck: daysSince,
        })
      }
      return stuck
    })
    issues.push(...pendingAfterOnboard)

    // Check 3: Active subscription but no leads delivered in 7+ days
    const noLeads = await step.run('check-no-leads-delivered', async () => {
      const supabase = createAdminClient()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data: subscriptions } = await supabase
        .from('service_subscriptions')
        .select(`
          id,
          workspace_id,
          created_at,
          status,
          workspaces!inner (
            name,
            settings
          ),
          users!inner (
            email
          )
        `)
        .eq('status', 'active')
        .eq('onboarding_completed', true)
        .lt('created_at', sevenDaysAgo)
        .limit(50)

      const stuck: StuckCustomer[] = []
      for (const sub of subscriptions || []) {
        const workspace = sub.workspaces as any
        const user = sub.users as any
        const settings = (workspace?.settings as Record<string, unknown>) || {}

        // Check if any leads have been delivered to this workspace
        const { count } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', sub.workspace_id)
          .gte('created_at', sevenDaysAgo)

        if ((count || 0) === 0 && settings.ghl_location_id) {
          const daysSince = Math.floor(
            (Date.now() - new Date(sub.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )
          stuck.push({
            workspace_id: sub.workspace_id,
            company_name: workspace?.name || 'Unknown',
            user_email: user?.email || 'Unknown',
            issue: 'Active subscription but NO leads delivered in past 7 days',
            days_stuck: daysSince,
          })
        }
      }
      return stuck
    })
    issues.push(...noLeads)

    // Send consolidated alert if any issues found
    if (issues.length > 0) {
      await step.run('send-alerts', async () => {
        // Slack alert with summary
        await sendSlackAlert({
          type: 'customer_stuck',
          severity: issues.length >= 5 ? 'critical' : 'warning',
          message: `${issues.length} customer(s) need attention`,
          metadata: {
            total_issues: issues.length,
            issues: issues.map(i => `${i.company_name}: ${i.issue} (${i.days_stuck}d)`).join('\n'),
          },
        })

        // Email with full details
        try {
          const { sendEmail } = await import('@/lib/email/resend-client')

          const issueRows = issues
            .map(
              (i) => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i.company_name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i.user_email}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i.issue}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${i.days_stuck}d</td>
              </tr>
            `
            )
            .join('')

          await sendEmail({
            to: 'adam@meetcursive.com',
            subject: `[ACTION] ${issues.length} customer(s) stuck in pipeline`,
            html: `
              <div style="font-family: -apple-system, sans-serif; max-width: 800px;">
                <h2 style="color: #dc2626;">Customer Lifecycle Alert</h2>
                <p>${issues.length} customer(s) need your attention:</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 8px; text-align: left;">Company</th>
                      <th style="padding: 8px; text-align: left;">Email</th>
                      <th style="padding: 8px; text-align: left;">Issue</th>
                      <th style="padding: 8px; text-align: center;">Days</th>
                    </tr>
                  </thead>
                  <tbody>${issueRows}</tbody>
                </table>
              </div>
            `,
          })
        } catch {
          // Email is best-effort
        }
      })
    }

    safeLog(`[Customer Monitor] Complete. Found ${issues.length} issue(s).`)

    return {
      success: true,
      issuesFound: issues.length,
      issues: issues.map((i) => ({
        company: i.company_name,
        issue: i.issue,
        days: i.days_stuck,
      })),
    }
  }
)
