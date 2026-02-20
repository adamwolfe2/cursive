export const runtime = 'nodejs'

/**
 * Admin Email Deliverability — Per-Workspace Alerts
 * Cursive Platform
 *
 * GET /api/admin/email-deliverability/alerts
 *
 * Finds workspaces whose bounce rate exceeds 5% in the last 7 days
 * (with at least 10 emails sent). Classifies severity:
 *   critical — bounce rate > 10%
 *   warning  — bounce rate 5–10%
 *
 * Auth: requireAdmin()
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// ---- Types ----

interface WorkspaceAlert {
  workspace_id: string
  workspace_name: string | null
  sent_count: number
  bounced_count: number
  bounce_rate: number
  alert_severity: 'critical' | 'warning'
}

// ---- GET handler ----

export async function GET() {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    safeLog('[EmailDeliverability/Alerts] Querying email_sends for last 7 days')

    // Fetch sends in the last 7 days — only workspace_id and bounced_at
    const { data: sends, error: sendsError } = await adminClient
      .from('email_sends')
      .select('workspace_id, bounced_at')
      .gte('created_at', since)

    if (sendsError) {
      safeError('[EmailDeliverability/Alerts] email_sends query error:', sendsError)
      return NextResponse.json({
        success: true,
        data: {
          alerts: [],
          period_days: 7,
          note: 'email_sends table unavailable',
        },
      })
    }

    // Aggregate per workspace
    const workspaceMap = new Map<string, { sent: number; bounced: number }>()
    for (const row of sends ?? []) {
      if (!row.workspace_id) continue
      const existing = workspaceMap.get(row.workspace_id) ?? { sent: 0, bounced: 0 }
      existing.sent += 1
      if (row.bounced_at) existing.bounced += 1
      workspaceMap.set(row.workspace_id, existing)
    }

    // Filter: at least 10 sent and bounce rate > 5%
    const alertingWorkspaceIds: string[] = []
    const workspaceStats = new Map<string, { sent: number; bounced: number; bounceRate: number }>()

    for (const [workspaceId, stats] of workspaceMap.entries()) {
      if (stats.sent < 10) continue
      const bounceRate = (stats.bounced / stats.sent) * 100
      if (bounceRate <= 5) continue
      alertingWorkspaceIds.push(workspaceId)
      workspaceStats.set(workspaceId, { sent: stats.sent, bounced: stats.bounced, bounceRate })
    }

    if (alertingWorkspaceIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          alerts: [],
          period_days: 7,
        },
      })
    }

    // Fetch workspace names for alerting workspaces
    const workspaceNames = new Map<string, string | null>()
    try {
      const { data: workspaces, error: wsError } = await adminClient
        .from('workspaces')
        .select('id, name')
        .in('id', alertingWorkspaceIds)

      if (!wsError) {
        for (const ws of workspaces ?? []) {
          workspaceNames.set(ws.id, ws.name ?? null)
        }
      } else {
        safeError('[EmailDeliverability/Alerts] workspaces query error:', wsError)
      }
    } catch (wsErr) {
      safeError('[EmailDeliverability/Alerts] Workspace name lookup threw:', wsErr)
    }

    // Build alert list
    const alerts: WorkspaceAlert[] = alertingWorkspaceIds
      .map((workspaceId) => {
        const stats = workspaceStats.get(workspaceId)!
        const severity: 'critical' | 'warning' = stats.bounceRate > 10 ? 'critical' : 'warning'
        return {
          workspace_id: workspaceId,
          workspace_name: workspaceNames.get(workspaceId) ?? null,
          sent_count: stats.sent,
          bounced_count: stats.bounced,
          bounce_rate: Number(stats.bounceRate.toFixed(2)),
          alert_severity: severity,
        }
      })
      .sort((a, b) => b.bounce_rate - a.bounce_rate)

    safeLog('[EmailDeliverability/Alerts] Found', alerts.length, 'alerting workspaces')

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        period_days: 7,
        min_sends_threshold: 10,
      },
    })
  } catch (error: unknown) {
    safeError('[EmailDeliverability/Alerts] Route error:', error)

    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unauthorized') || msg.includes('forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch deliverability alerts' },
      { status: 500 }
    )
  }
}
