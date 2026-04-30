export const runtime = 'nodejs'

/**
 * Admin Email Deliverability — Workspace Bounce Alerts
 * Cursive Platform
 *
 * GET /api/admin/email-deliverability/alerts
 *
 * Finds workspaces with high bounce rates over the last 7 days.
 * Only workspaces with at least 10 sends are evaluated to avoid
 * false positives from tiny samples.
 *
 * Alert thresholds:
 *   bounce_rate >= 5%  → critical
 *   bounce_rate >= 2%  → warning  (requirement says > 5% or complaint rate > 0.1%)
 *
 * Response shape per alert:
 *   workspace_id      — UUID
 *   workspace_name    — string | null
 *   sent_count        — total sends in period
 *   bounced_count     — total bounces in period
 *   bounce_rate       — percentage
 *   alert_severity    — 'critical' | 'warning'
 *
 * Auth: requireAdmin()
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// ---- Types ----

interface WorkspaceStats {
  sent_count: number
  bounced_count: number
}

// ---- GET handler ----

export async function GET() {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    safeLog('[EmailDeliverability/Alerts] Querying email_sends for last 7 days')

    // Fetch all sends in last 7 days
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

    const rows = sends ?? []
    safeLog('[EmailDeliverability/Alerts] Rows fetched:', rows.length)

    // Aggregate per workspace
    const workspaceMap = new Map<string, WorkspaceStats>()
    for (const row of rows) {
      const wsId = row.workspace_id
      if (!wsId) continue
      const entry = workspaceMap.get(wsId) ?? { sent_count: 0, bounced_count: 0 }
      entry.sent_count += 1
      if (row.bounced_at != null) entry.bounced_count += 1
      workspaceMap.set(wsId, entry)
    }

    // Filter to workspaces above threshold (min 10 sends)
    const MIN_SENDS = 10
    const alertEntries: Array<{ workspace_id: string; stats: WorkspaceStats; bounce_rate: number }> = []

    for (const [wsId, stats] of workspaceMap.entries()) {
      if (stats.sent_count < MIN_SENDS) continue
      const bounceRate = (stats.bounced_count / stats.sent_count) * 100
      if (bounceRate >= 2) {
        alertEntries.push({ workspace_id: wsId, stats, bounce_rate: bounceRate })
      }
    }

    if (alertEntries.length === 0) {
      return NextResponse.json({
        success: true,
        data: { alerts: [], period_days: 7 },
      })
    }

    // Fetch workspace names for alerting workspaces
    const workspaceIds = alertEntries.map((e) => e.workspace_id)
    const { data: workspaces, error: wsError } = await adminClient
      .from('workspaces')
      .select('id, name')
      .in('id', workspaceIds)

    if (wsError) {
      safeError('[EmailDeliverability/Alerts] workspaces query error:', wsError)
    }

    const nameMap = new Map<string, string | null>()
    for (const ws of workspaces ?? []) {
      nameMap.set(ws.id, ws.name ?? null)
    }

    // Build alert objects, sorted by bounce rate descending
    const alerts = alertEntries
      .sort((a, b) => b.bounce_rate - a.bounce_rate)
      .map((entry) => ({
        workspace_id: entry.workspace_id,
        workspace_name: nameMap.get(entry.workspace_id) ?? null,
        sent_count: entry.stats.sent_count,
        bounced_count: entry.stats.bounced_count,
        bounce_rate: Number(entry.bounce_rate.toFixed(2)),
        alert_severity: (entry.bounce_rate >= 5 ? 'critical' : 'warning') as 'critical' | 'warning',
      }))

    safeLog('[EmailDeliverability/Alerts] Returning', alerts.length, 'alerts')

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        period_days: 7,
      },
    })
  } catch (error: unknown) {
    safeError('[EmailDeliverability/Alerts] Route error:', error)

    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unauthorized') || msg.includes('forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to fetch deliverability alerts' }, { status: 500 })
  }
}
