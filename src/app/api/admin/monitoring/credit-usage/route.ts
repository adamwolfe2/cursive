/**
 * Credit Usage Summary API
 * GET /api/admin/monitoring/credit-usage
 *
 * Returns credit usage stats across all workspaces.
 * Used by admin dashboard and can power weekly digest emails.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin()

    const supabase = createAdminClient()
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch enrichment logs from last 7 days
    const { data: logs } = await supabase
      .from('enrichment_log')
      .select('workspace_id, status, credits_used, fields_added, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        data: {
          period: { start: sevenDaysAgo.toISOString(), end: now.toISOString() },
          totalEnrichments: 0,
          totalCreditsUsed: 0,
          successRate: 0,
          topFields: [],
          workspaceSummaries: [],
          dailyBreakdown: [],
        },
      })
    }

    // Aggregate totals
    let totalCredits = 0
    let successCount = 0
    const fieldCounts: Record<string, number> = {}
    const workspaceMap: Record<string, { enrichments: number; credits: number; successes: number }> = {}
    const dailyMap: Record<string, { enrichments: number; credits: number }> = {}

    for (const log of logs) {
      totalCredits += log.credits_used || 1
      if (log.status === 'success') successCount++

      // Track fields
      if (log.fields_added && Array.isArray(log.fields_added)) {
        for (const field of log.fields_added) {
          fieldCounts[field] = (fieldCounts[field] || 0) + 1
        }
      }

      // Track by workspace
      if (!workspaceMap[log.workspace_id]) {
        workspaceMap[log.workspace_id] = { enrichments: 0, credits: 0, successes: 0 }
      }
      workspaceMap[log.workspace_id].enrichments++
      workspaceMap[log.workspace_id].credits += log.credits_used || 1
      if (log.status === 'success') workspaceMap[log.workspace_id].successes++

      // Track daily
      const day = log.created_at.split('T')[0]
      if (!dailyMap[day]) dailyMap[day] = { enrichments: 0, credits: 0 }
      dailyMap[day].enrichments++
      dailyMap[day].credits += log.credits_used || 1
    }

    // Top enriched fields
    const topFields = Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([field, count]) => ({ field, count }))

    // Workspace summaries (top 20)
    const workspaceSummaries = Object.entries(workspaceMap)
      .sort((a, b) => b[1].credits - a[1].credits)
      .slice(0, 20)
      .map(([id, stats]) => ({
        workspace_id: id,
        ...stats,
        successRate: stats.enrichments > 0 ? stats.successes / stats.enrichments : 0,
      }))

    // Daily breakdown (sorted)
    const dailyBreakdown = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => ({ date, ...stats }))

    return NextResponse.json({
      data: {
        period: { start: sevenDaysAgo.toISOString(), end: now.toISOString() },
        totalEnrichments: logs.length,
        totalCreditsUsed: totalCredits,
        successRate: logs.length > 0 ? successCount / logs.length : 0,
        topFields,
        workspaceSummaries,
        dailyBreakdown,
      },
    })
  } catch (error) {
    safeError('Failed to fetch credit usage summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit usage summary' },
      { status: 500 }
    )
  }
}
