/**
 * Credit Alert Checker
 *
 * Cron job (twice daily) that checks workspace credit balances against
 * user-configured low-balance thresholds and sends alert emails via Resend.
 *
 * Deduplication: Only one alert per workspace per calendar day.
 * Threshold: Stored in workspaces.settings.credit_alert_threshold (default: 10).
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCreditLowEmail } from '@/lib/email/service'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export const creditAlertChecker = inngest.createFunction(
  {
    id: 'credit-alert-checker',
    name: 'Credit Balance Alert Checker',
    retries: 2,
  },
  // Run at 8 AM and 6 PM UTC (matches early morning + end-of-day US awareness)
  { cron: '0 8,18 * * *' },
  async ({ step }) => {
    const supabase = createAdminClient()

    // Step 1: Fetch all workspaces with their credit balance and threshold
    const workspacesToAlert = await step.run('find-low-balance-workspaces', async () => {
      // Get all workspaces with their credits
      const { data: credits, error: creditsError } = await supabase
        .from('workspace_credits')
        .select('workspace_id, balance')

      if (creditsError) {
        safeError('[CreditAlert] Failed to fetch workspace credits:', creditsError)
        return []
      }

      if (!credits || credits.length === 0) return []

      // Get workspace settings (for thresholds) and notification preferences
      const workspaceIds = credits.map((c) => c.workspace_id)

      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id, settings')
        .in('id', workspaceIds)

      if (wsError) {
        safeError('[CreditAlert] Failed to fetch workspaces:', wsError)
        return []
      }

      const workspaceMap = new Map(
        (workspaces ?? []).map((w) => [w.id, w])
      )

      // Find workspaces below their threshold
      const lowBalanceWorkspaces: { workspace_id: string; balance: number; threshold: number }[] = []

      for (const credit of credits) {
        const workspace = workspaceMap.get(credit.workspace_id)
        const settings = (workspace?.settings as Record<string, unknown> | null) ?? {}
        const threshold = typeof settings.credit_alert_threshold === 'number'
          ? settings.credit_alert_threshold
          : 10 // default threshold

        if (credit.balance <= threshold) {
          lowBalanceWorkspaces.push({
            workspace_id: credit.workspace_id,
            balance: credit.balance,
            threshold,
          })
        }
      }

      safeLog(`[CreditAlert] Found ${lowBalanceWorkspaces.length} workspaces below alert threshold`)
      return lowBalanceWorkspaces
    })

    if (workspacesToAlert.length === 0) {
      return { status: 'no_alerts_needed', count: 0 }
    }

    // Step 2: Deduplicate — only one alert per workspace per day
    const workspacesToNotify = await step.run('deduplicate-alerts', async () => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      // Check which workspaces already had a credit alert today
      // We'll use platform_alerts table to track this
      const { data: recentAlerts } = await supabase
        .from('platform_alerts')
        .select('metadata')
        .eq('alert_type', 'credit_low_balance_user')
        .gte('created_at', todayStart.toISOString())

      const alreadyAlertedToday = new Set<string>(
        (recentAlerts ?? [])
          .map((a) => {
            const meta = a.metadata as Record<string, unknown> | null
            return typeof meta?.workspace_id === 'string' ? meta.workspace_id : null
          })
          .filter(Boolean) as string[]
      )

      return workspacesToAlert.filter(
        (w) => !alreadyAlertedToday.has(w.workspace_id)
      )
    })

    if (workspacesToNotify.length === 0) {
      safeLog('[CreditAlert] All low-balance workspaces already alerted today')
      return { status: 'already_alerted', count: 0 }
    }

    // Step 3: Fetch owner emails for workspaces to notify
    const workspaceNotifications = await step.run('fetch-owner-emails', async () => {
      const workspaceIds = workspacesToNotify.map((w) => w.workspace_id)

      const { data: owners, error } = await supabase
        .from('users')
        .select('workspace_id, email, first_name, last_name, notification_preferences')
        .in('workspace_id', workspaceIds)
        .eq('role', 'owner')

      if (error) {
        safeError('[CreditAlert] Failed to fetch workspace owners:', error)
        return []
      }

      // Build per-workspace notification data
      const ownerMap = new Map<string, typeof owners[0]>()
      for (const owner of owners ?? []) {
        if (!ownerMap.has(owner.workspace_id)) {
          ownerMap.set(owner.workspace_id, owner)
        }
      }

      return workspacesToNotify.map((w) => ({
        ...w,
        owner: ownerMap.get(w.workspace_id) ?? null,
      })).filter((w) => w.owner !== null)
    })

    // Step 4: Send alerts and log them
    let sent = 0
    let skipped = 0

    for (const notification of workspaceNotifications) {
      if (!notification.owner) continue

      const prefs = notification.owner.notification_preferences as Record<string, unknown> | null
      const creditAlertsEnabled = prefs?.credit_alerts !== false // default: enabled
      const emailNotificationsEnabled = prefs?.email_notifications !== false // default: enabled

      if (!creditAlertsEnabled || !emailNotificationsEnabled) {
        skipped++
        continue
      }

      await step.run(`send-alert-${notification.workspace_id}`, async () => {
        const userName = [notification.owner!.first_name, notification.owner!.last_name]
          .filter(Boolean)
          .join(' ') || notification.owner!.email.split('@')[0]

        const result = await sendCreditLowEmail(
          notification.owner!.email,
          userName,
          notification.balance
        )

        if (result.success) {
          sent++

          // Log the alert to prevent re-sending today
          await supabase.from('platform_alerts').insert({
            alert_type: 'credit_low_balance_user',
            severity: notification.balance === 0 ? 'critical' : 'warning',
            title: `Low Credit Balance Alert — ${userName}`,
            message: `Workspace has ${notification.balance} credits remaining (threshold: ${notification.threshold})`,
            metadata: {
              workspace_id: notification.workspace_id,
              balance: notification.balance,
              threshold: notification.threshold,
              email_sent_to: notification.owner!.email,
            },
          })
        } else {
          safeError('[CreditAlert] Failed to send email:', {
            workspace_id: notification.workspace_id,
            email: notification.owner!.email,
            error: result.error,
          })
        }
      })
    }

    safeLog('[CreditAlert] Alert run complete', { sent, skipped })
    return { status: 'complete', sent, skipped }
  }
)
