/**
 * Dedup & Enrichment Monitoring API
 * GET /api/admin/monitoring/dedup-enrichment
 *
 * Returns dedup rejection stats and enrichment activity metrics
 * for the admin monitoring dashboard.
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Run all queries in parallel
    const [
      dedupToday,
      dedup7d,
      dedup30d,
      dedupBySource,
      enrichTotal,
      enrichSuccess,
      enrichNoData,
      enrichFailed,
      enrichToday,
      enrichByWorkspace,
      dedupDaily,
      enrichDaily,
    ] = await Promise.all([
      // Dedup rejections today
      supabase
        .from('dedup_rejections')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),

      // Dedup rejections last 7 days
      supabase
        .from('dedup_rejections')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),

      // Dedup rejections last 30 days
      supabase
        .from('dedup_rejections')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Dedup rejections by source (last 7 days)
      supabase
        .from('dedup_rejections')
        .select('source')
        .gte('created_at', sevenDaysAgo.toISOString()),

      // Enrichment total (30 days)
      supabase
        .from('enrichment_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Enrichment successes (30 days)
      supabase
        .from('enrichment_log')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'success')
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Enrichment no_data (30 days)
      supabase
        .from('enrichment_log')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'no_data')
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Enrichment failed (30 days)
      supabase
        .from('enrichment_log')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Enrichment today
      supabase
        .from('enrichment_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),

      // Top workspaces by enrichment usage (30 days)
      supabase
        .from('enrichment_log')
        .select('workspace_id, credits_used')
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Dedup daily breakdown (last 14 days)
      supabase
        .from('dedup_rejections')
        .select('created_at')
        .gte('created_at', new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()),

      // Enrichment daily breakdown (last 14 days)
      supabase
        .from('enrichment_log')
        .select('created_at, status')
        .gte('created_at', new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    // Aggregate dedup by source
    const sourceCounts: Record<string, number> = {}
    for (const row of dedupBySource.data || []) {
      sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1
    }

    // Aggregate enrichment by workspace (top 10)
    const workspaceTotals: Record<string, { count: number; credits: number }> = {}
    for (const row of (enrichByWorkspace.data || [])) {
      if (!workspaceTotals[row.workspace_id]) {
        workspaceTotals[row.workspace_id] = { count: 0, credits: 0 }
      }
      workspaceTotals[row.workspace_id].count++
      workspaceTotals[row.workspace_id].credits += row.credits_used || 1
    }
    const topWorkspaces = Object.entries(workspaceTotals)
      .sort((a, b) => b[1].credits - a[1].credits)
      .slice(0, 10)
      .map(([id, stats]) => ({ workspace_id: id, ...stats }))

    // Aggregate daily trends (dedup)
    const dedupDailyMap: Record<string, number> = {}
    for (const row of dedupDaily.data || []) {
      const day = row.created_at.split('T')[0]
      dedupDailyMap[day] = (dedupDailyMap[day] || 0) + 1
    }

    // Aggregate daily trends (enrichment by status)
    const enrichDailyMap: Record<string, { success: number; no_data: number; failed: number }> = {}
    for (const row of enrichDaily.data || []) {
      const day = row.created_at.split('T')[0]
      if (!enrichDailyMap[day]) enrichDailyMap[day] = { success: 0, no_data: 0, failed: 0 }
      if (row.status === 'success') enrichDailyMap[day].success++
      else if (row.status === 'no_data') enrichDailyMap[day].no_data++
      else enrichDailyMap[day].failed++
    }

    // Build sorted daily arrays for the last 14 days
    const dailyLabels: string[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dailyLabels.push(d.toISOString().split('T')[0])
    }

    const dedupTrend = dailyLabels.map((day) => ({
      date: day,
      rejections: dedupDailyMap[day] || 0,
    }))

    const enrichTrend = dailyLabels.map((day) => ({
      date: day,
      success: enrichDailyMap[day]?.success || 0,
      no_data: enrichDailyMap[day]?.no_data || 0,
      failed: enrichDailyMap[day]?.failed || 0,
    }))

    const totalEnrich = enrichTotal.count || 0
    const successEnrich = enrichSuccess.count || 0
    const successRate = totalEnrich > 0 ? successEnrich / totalEnrich : 0

    return NextResponse.json({
      data: {
        dedup: {
          today: dedupToday.count || 0,
          last7d: dedup7d.count || 0,
          last30d: dedup30d.count || 0,
          bySource: sourceCounts,
          trend: dedupTrend,
        },
        enrichment: {
          total: totalEnrich,
          success: successEnrich,
          noData: enrichNoData.count || 0,
          failed: enrichFailed.count || 0,
          today: enrichToday.count || 0,
          successRate,
          topWorkspaces,
          trend: enrichTrend,
        },
      },
    })
  } catch (error) {
    safeError('Failed to fetch dedup/enrichment metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
