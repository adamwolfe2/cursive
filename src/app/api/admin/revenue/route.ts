export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET() {
  try {
    // Require admin access (throws if not admin)
    await requireAdmin()

    const supabase = createAdminClient()

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Run all queries in parallel for performance
    const [
      // Total credits sold this month — count and value
      creditPurchasesThisMonth,
      // Last 30 days: daily revenue
      creditPurchasesLast30Days,
      // Top 10 spenders (all-time) with workspace name
      topSpendersAllTime,
      // Revenue by package (all-time)
      creditPurchasesAllPackages,
      // Credit redemptions this month (marketplace purchases paid by credits)
      creditsRedeemedThisMonth,
      // Active workspaces this month (had any credit purchase or marketplace purchase)
      _activeWorkspacesThisMonth,
      // Partner payouts pending
      pendingPayouts,
      // Partner earnings this month (all partners combined)
      partnerEarningsThisMonth,
      // Top 5 earning partners this month
      topPartnersByEarnings,
    ] = await Promise.all([
      // Credits sold this month
      supabase
        .from('credit_purchases')
        .select('workspace_id, credits, amount_paid, package_name')
        .eq('status', 'completed')
        .gte('created_at', monthStart),

      // Last 30 days of purchases for daily breakdown
      supabase
        .from('credit_purchases')
        .select('created_at, credits, amount_paid')
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true }),

      // Top 10 spenders all-time with workspace info (cap at 100k rows)
      supabase
        .from('credit_purchases')
        .select('workspace_id, amount_paid, workspaces(name)')
        .eq('status', 'completed')
        .limit(100000),

      // All packages breakdown (all-time completed, cap at 100k rows)
      supabase
        .from('credit_purchases')
        .select('package_name, credits, amount_paid')
        .eq('status', 'completed')
        .limit(100000),

      // Credits redeemed this month via marketplace purchases
      supabase
        .from('marketplace_purchases')
        .select('credits_used')
        .eq('status', 'completed')
        .gte('created_at', monthStart),

      // Active workspaces this month: had any credit purchase this month
      supabase
        .from('credit_purchases')
        .select('workspace_id', { count: 'exact' })
        .eq('status', 'completed')
        .gte('created_at', monthStart),

      // Pending payout requests
      supabase
        .from('payout_requests')
        .select('amount')
        .eq('status', 'pending'),

      // Partner earnings created this month
      supabase
        .from('partner_earnings')
        .select('amount')
        .gte('created_at', monthStart),

      // Top 5 earning partners this month with name
      supabase
        .from('partner_earnings')
        .select('partner_id, amount, partners(name)')
        .gte('created_at', monthStart),
    ])

    // ── Credit purchases this month ──────────────────────────────────────────
    const thisMonthPurchases = creditPurchasesThisMonth.data || []
    const totalCreditsSoldCount = thisMonthPurchases.length
    const totalCreditsSoldUnits = thisMonthPurchases.reduce((s, r) => s + (r.credits || 0), 0)
    const totalCreditsSoldValue = thisMonthPurchases.reduce((s, r) => s + Number(r.amount_paid || 0), 0)

    // MRR estimate: total revenue this month from credit sales
    const estimatedMRR = totalCreditsSoldValue

    // ── Daily revenue last 30 days ───────────────────────────────────────────
    const dailyMap: Record<string, { credits: number; value: number; count: number }> = {}
    const last30Purchases = creditPurchasesLast30Days.data || []
    last30Purchases.forEach((row) => {
      const day = new Date(row.created_at).toISOString().split('T')[0]
      if (!dailyMap[day]) dailyMap[day] = { credits: 0, value: 0, count: 0 }
      dailyMap[day].credits += row.credits || 0
      dailyMap[day].value += Number(row.amount_paid || 0)
      dailyMap[day].count += 1
    })
    const dailyRevenue = Object.entries(dailyMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // ── Top 10 spenders all-time ─────────────────────────────────────────────
    const spenderMap: Record<string, { workspace_id: string; name: string; total_spend: number; this_month_spend: number }> = {}
    const _thisMonthWorkspaceSet = new Set(thisMonthPurchases.map((r) => r.workspace_id))

    const allSpenders = topSpendersAllTime.data || []
    allSpenders.forEach((row: any) => {
      const wid = row.workspace_id
      if (!spenderMap[wid]) {
        spenderMap[wid] = {
          workspace_id: wid,
          name: row.workspaces?.name || wid.slice(0, 8),
          total_spend: 0,
          this_month_spend: 0,
        }
      }
      spenderMap[wid].total_spend += Number(row.amount_paid || 0)
    })

    // Add this month's spend per workspace
    thisMonthPurchases.forEach((row: any) => {
      const wid = row.workspace_id
      if (spenderMap[wid]) {
        spenderMap[wid].this_month_spend += Number(row.amount_paid || 0)
      }
    })

    const topSpenders = Object.values(spenderMap)
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 10)

    // ── Revenue by package ───────────────────────────────────────────────────
    const packageMap: Record<string, { package_name: string; count: number; total_credits: number; total_value: number }> = {}
    const allPackages = creditPurchasesAllPackages.data || []
    allPackages.forEach((row) => {
      const name = row.package_name || 'unknown'
      if (!packageMap[name]) packageMap[name] = { package_name: name, count: 0, total_credits: 0, total_value: 0 }
      packageMap[name].count += 1
      packageMap[name].total_credits += row.credits || 0
      packageMap[name].total_value += Number(row.amount_paid || 0)
    })
    const revenueByPackage = Object.values(packageMap)
      .sort((a, b) => b.total_value - a.total_value)

    // ── Credits redeemed this month ──────────────────────────────────────────
    const redeemedRows = creditsRedeemedThisMonth.data || []
    const totalCreditsRedeemed = redeemedRows.reduce((s, r) => s + (r.credits_used || 0), 0)

    // ── Active workspaces this month ─────────────────────────────────────────
    // Unique workspace count from credit purchases this month
    const activeWorkspaceIds = new Set((creditPurchasesThisMonth.data || []).map((r) => r.workspace_id))
    const activeWorkspacesCount = activeWorkspaceIds.size

    // ── Partner payouts pending ──────────────────────────────────────────────
    const pendingPayoutRows = pendingPayouts.data || []
    const totalPendingPayouts = pendingPayoutRows.length
    const totalPendingPayoutsValue = pendingPayoutRows.reduce((s, r) => s + Number(r.amount || 0), 0)

    // ── Partner commissions this month ───────────────────────────────────────
    const earningsRows = partnerEarningsThisMonth.data || []
    const totalCommissionsThisMonth = earningsRows.reduce((s, r) => s + Number(r.amount || 0), 0)

    // ── Top 5 earning partners this month ────────────────────────────────────
    const partnerEarningsMap: Record<string, { partner_id: string; name: string; earnings: number }> = {}
    const topEarningsRows = topPartnersByEarnings.data || []
    topEarningsRows.forEach((row: any) => {
      const pid = row.partner_id
      if (!partnerEarningsMap[pid]) {
        partnerEarningsMap[pid] = {
          partner_id: pid,
          name: row.partners?.name || pid.slice(0, 8),
          earnings: 0,
        }
      }
      partnerEarningsMap[pid].earnings += Number(row.amount || 0)
    })
    const topPartners = Object.values(partnerEarningsMap)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          estimated_mrr: estimatedMRR,
          credits_sold_count: totalCreditsSoldCount,
          credits_sold_units: totalCreditsSoldUnits,
          credits_sold_value: totalCreditsSoldValue,
          credits_redeemed: totalCreditsRedeemed,
          active_workspaces: activeWorkspacesCount,
          pending_payouts_count: totalPendingPayouts,
          pending_payouts_value: totalPendingPayoutsValue,
          commissions_this_month: totalCommissionsThisMonth,
        },
        dailyRevenue,
        topSpenders,
        revenueByPackage,
        topPartners,
      },
    })
  } catch (error: unknown) {
    safeError('Admin revenue error:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
  }
}
