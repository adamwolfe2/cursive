// Admin Credit Usage API
// GET /api/admin/credit-usage
// Returns: top 10 workspaces by credit spend (last 30 days), platform totals, daily velocity, anomalies
// Auth: requireAdmin()

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET() {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgoISO = sixtyDaysAgo.toISOString()

    // ── Marketplace purchases (last 30 days) ──────────────────────────────────
    const { data: recentPurchases } = await adminClient
      .from('marketplace_purchases')
      .select('buyer_workspace_id, credits_used, total_price, created_at')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgoISO)

    // ── All-time totals ────────────────────────────────────────────────────────
    const { data: allPurchases } = await adminClient
      .from('marketplace_purchases')
      .select('credits_used, total_price')
      .eq('status', 'completed')

    // ── Previous 30-day period for anomaly comparison (days 31-60) ─────────────
    const { data: prevPurchases } = await adminClient
      .from('marketplace_purchases')
      .select('buyer_workspace_id, credits_used, created_at')
      .eq('status', 'completed')
      .gte('created_at', sixtyDaysAgoISO)
      .lt('created_at', thirtyDaysAgoISO)

    // ── Aggregate workspace spend (last 30 days) ──────────────────────────────
    const workspaceSpend: Record<string, number> = {}
    for (const p of recentPurchases ?? []) {
      const credits = p.credits_used || p.total_price || 0
      workspaceSpend[p.buyer_workspace_id] = (workspaceSpend[p.buyer_workspace_id] || 0) + credits
    }

    // Top 10 workspaces by spend
    const topWorkspaceIds = Object.entries(workspaceSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    // Fetch workspace names for top 10
    const workspaceNames: Record<string, string> = {}
    if (topWorkspaceIds.length > 0) {
      const { data: workspaces } = await adminClient
        .from('workspaces')
        .select('id, name')
        .in('id', topWorkspaceIds)
      for (const w of workspaces ?? []) {
        workspaceNames[w.id] = w.name
      }
    }

    const top_workspaces = Object.entries(workspaceSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([workspace_id, credits]) => ({
        workspace_id,
        name: workspaceNames[workspace_id] || workspace_id.slice(0, 8),
        credits_spent: credits,
      }))

    // ── Platform totals ───────────────────────────────────────────────────────
    const total_credits_redeemed = (allPurchases ?? []).reduce(
      (sum, p) => sum + (p.credits_used || p.total_price || 0),
      0
    )

    // Credits issued: from workspace credits_balance sum (approximate) — use purchases as issued proxy
    // We can sum all-time credits_used as "redeemed" and treat it as our known issued figure
    // A more accurate "issued" would require a separate credit_issuance log; use purchases for now
    const total_credits_issued = total_credits_redeemed // placeholder — same data source

    // ── Daily velocity (last 30 days) ─────────────────────────────────────────
    const dailyMap: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dailyMap[d.toISOString().split('T')[0]] = 0
    }
    for (const p of recentPurchases ?? []) {
      const day = (p.created_at as string).split('T')[0]
      if (day in dailyMap) {
        dailyMap[day] += p.credits_used || p.total_price || 0
      }
    }
    const daily_velocity = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, credits]) => ({ date, credits }))

    // ── Anomaly detection: workspaces with >3x normal daily usage ─────────────
    // Normal = avg daily in previous 30-day period; current = avg daily in last 30 days
    const prevWorkspaceSpend: Record<string, number> = {}
    for (const p of prevPurchases ?? []) {
      const credits = p.credits_used || 0
      prevWorkspaceSpend[p.buyer_workspace_id] = (prevWorkspaceSpend[p.buyer_workspace_id] || 0) + credits
    }

    const anomalies: { workspace_id: string; name: string; recent_daily_avg: number; prev_daily_avg: number; multiplier: number }[] = []
    for (const [wsId, recentCredits] of Object.entries(workspaceSpend)) {
      const prevCredits = prevWorkspaceSpend[wsId] || 0
      const recentAvg = recentCredits / 30
      const prevAvg = prevCredits > 0 ? prevCredits / 30 : null

      if (prevAvg !== null && prevAvg > 0 && recentAvg > prevAvg * 3) {
        anomalies.push({
          workspace_id: wsId,
          name: workspaceNames[wsId] || wsId.slice(0, 8),
          recent_daily_avg: Math.round(recentAvg * 100) / 100,
          prev_daily_avg: Math.round(prevAvg * 100) / 100,
          multiplier: Math.round((recentAvg / prevAvg) * 10) / 10,
        })
      }
    }
    anomalies.sort((a, b) => b.multiplier - a.multiplier)

    return NextResponse.json({
      top_workspaces,
      platform: {
        total_credits_issued,
        total_credits_redeemed,
      },
      daily_velocity,
      anomalies,
    })
  } catch (error) {
    safeError('[AdminCreditUsage] GET failed:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch credit usage' }, { status: 500 })
  }
}
