/**
 * Admin Revenue Dashboard
 * Cursive Platform
 *
 * Server component showing key business revenue metrics:
 * - Real MRR/ARR with month-over-month growth
 * - Next-month revenue forecast (linear regression)
 * - Churn & retention analysis
 * - Daily revenue table (last 30 days)
 * - Top 10 spenders
 * - Revenue by credit package
 * - Partner section with pending payouts and top earners
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth/roles'
import { safeError } from '@/lib/utils/log-sanitizer'

export const dynamic = 'force-dynamic'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyRevenue {
  date: string
  credits: number
  value: number
  count: number
}

interface SpenderRow {
  workspace_id: string
  name: string
  total_spend: number
  this_month_spend: number
}

interface PackageRow {
  package_name: string
  count: number
  total_credits: number
  total_value: number
}

interface PartnerRow {
  partner_id: string
  name: string
  earnings: number
}

interface ChurnedWorkspace {
  workspace_id: string
  name: string
  last_purchase: string
  total_spend: number
}

interface RevenueData {
  overview: {
    mrr_current_month: number
    mrr_last_month: number
    mrr_growth_percent: number | null
    arr_annualized: number
    credits_sold_count: number
    credits_sold_units: number
    credits_sold_value: number
    credits_redeemed: number
    active_workspaces: number
    pending_payouts_count: number
    pending_payouts_value: number
    commissions_this_month: number
  }
  forecast: {
    next_month_projected: number
    confidence_low: number
    confidence_high: number
    months_used: number
  }
  retention: {
    churned_count: number
    at_risk_count: number
    churned_workspaces: ChurnedWorkspace[]
  }
  dailyRevenue: DailyRevenue[]
  topSpenders: SpenderRow[]
  revenueByPackage: PackageRow[]
  topPartners: PartnerRow[]
}

// ─── Linear regression helper ─────────────────────────────────────────────

/**
 * Least-squares linear regression on (x, y) pairs.
 * Returns { slope, intercept } for y = slope * x + intercept.
 */
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length
  if (n === 0) return { slope: 0, intercept: 0 }
  if (n === 1) return { slope: 0, intercept: points[0].y }

  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) return { slope: 0, intercept: sumY / n }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchRevenueData(): Promise<RevenueData | null> {
  try {
    const supabase = createAdminClient()

    const now = new Date()

    // Current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Last 3 months for forecast (month-2, month-1, current)
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString()

    // Last 30 days for daily chart
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Churn: purchased 30-60 days ago but NOT in last 30 days
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
    // At-risk: last purchase 20-30 days ago
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()

    const [
      creditPurchasesThisMonth,
      creditPurchasesLastMonth,
      creditPurchasesLast3Months,
      creditPurchasesLast30Days,
      topSpendersAllTime,
      creditPurchasesAllPackages,
      creditsRedeemedThisMonth,
      pendingPayouts,
      partnerEarningsThisMonth,
      topPartnersByEarnings,
      // Churn: all workspace purchase records from 60+ days ago through last 30 days
      purchasesForChurnAnalysis,
      // Recent purchases (last 30 days) for churn exclusion
      recentPurchasesForChurn,
    ] = await Promise.all([
      supabase
        .from('credit_purchases')
        .select('workspace_id, credits, amount_paid, package_name')
        .eq('status', 'completed')
        .gte('created_at', monthStart),

      supabase
        .from('credit_purchases')
        .select('amount_paid')
        .eq('status', 'completed')
        .gte('created_at', lastMonthStart)
        .lt('created_at', lastMonthEnd),

      supabase
        .from('credit_purchases')
        .select('created_at, amount_paid')
        .eq('status', 'completed')
        .gte('created_at', threeMonthsAgo)
        .order('created_at', { ascending: true }),

      supabase
        .from('credit_purchases')
        .select('created_at, credits, amount_paid')
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true }),

      supabase
        .from('credit_purchases')
        .select('workspace_id, amount_paid, workspaces(name)')
        .eq('status', 'completed'),

      supabase
        .from('credit_purchases')
        .select('package_name, credits, amount_paid')
        .eq('status', 'completed'),

      supabase
        .from('marketplace_purchases')
        .select('credits_used')
        .eq('status', 'completed')
        .gte('created_at', monthStart),

      supabase
        .from('payout_requests')
        .select('amount')
        .eq('status', 'pending'),

      supabase
        .from('partner_earnings')
        .select('amount')
        .gte('created_at', monthStart),

      supabase
        .from('partner_earnings')
        .select('partner_id, amount, partners(name)')
        .gte('created_at', monthStart),

      // All purchases between 60 days ago and 20 days ago — candidates for churn
      supabase
        .from('credit_purchases')
        .select('workspace_id, created_at, amount_paid, workspaces(name)')
        .eq('status', 'completed')
        .gte('created_at', sixtyDaysAgo)
        .lt('created_at', twentyDaysAgo),

      // Purchases in the last 20 days — used to exclude active workspaces
      supabase
        .from('credit_purchases')
        .select('workspace_id')
        .eq('status', 'completed')
        .gte('created_at', twentyDaysAgo),
    ])

    // ── MRR / ARR ────────────────────────────────────────────────────────────
    const thisMonthPurchases = creditPurchasesThisMonth.data || []
    const mrrCurrentMonth = thisMonthPurchases.reduce(
      (s, r) => s + Number(r.amount_paid || 0), 0
    )

    const lastMonthPurchasesRows = creditPurchasesLastMonth.data || []
    const mrrLastMonth = lastMonthPurchasesRows.reduce(
      (s, r) => s + Number(r.amount_paid || 0), 0
    )

    const mrrGrowthPercent =
      mrrLastMonth > 0
        ? Math.round(((mrrCurrentMonth - mrrLastMonth) / mrrLastMonth) * 10000) / 100
        : null

    const arrAnnualized = mrrCurrentMonth * 12

    const totalCreditsSoldCount = thisMonthPurchases.length
    const totalCreditsSoldUnits = thisMonthPurchases.reduce((s, r) => s + (r.credits || 0), 0)
    const totalCreditsSoldValue = mrrCurrentMonth

    // ── Revenue Forecast (last 3 months → project month+1) ──────────────────
    const last3Purchases = creditPurchasesLast3Months.data || []

    // Group by month index (0, 1, 2 relative to threeMonthsAgo start)
    const forecastMonthMap: Record<number, number> = {}
    const baseYear = new Date(threeMonthsAgo).getFullYear()
    const baseMonth = new Date(threeMonthsAgo).getMonth()

    last3Purchases.forEach((row) => {
      const d = new Date(row.created_at)
      const monthIdx = (d.getFullYear() - baseYear) * 12 + (d.getMonth() - baseMonth)
      if (monthIdx >= 0 && monthIdx <= 2) {
        forecastMonthMap[monthIdx] = (forecastMonthMap[monthIdx] ?? 0) + Number(row.amount_paid || 0)
      }
    })

    // Build regression points
    const regressionPoints = [0, 1, 2]
      .filter((i) => forecastMonthMap[i] !== undefined)
      .map((i) => ({ x: i, y: forecastMonthMap[i] }))

    const { slope, intercept } = linearRegression(regressionPoints)
    const nextMonthProjected = Math.max(0, slope * 3 + intercept)

    // Confidence: ±20% of projected (simple heuristic)
    const confidenceRange = nextMonthProjected * 0.2
    const confidenceLow = Math.max(0, nextMonthProjected - confidenceRange)
    const confidenceHigh = nextMonthProjected + confidenceRange

    // ── Daily revenue last 30 days ───────────────────────────────────────────
    const dailyMap: Record<string, DailyRevenue> = {}
    const last30Purchases = creditPurchasesLast30Days.data || []
    last30Purchases.forEach((row) => {
      const day = new Date(row.created_at).toISOString().split('T')[0]
      if (!dailyMap[day]) dailyMap[day] = { date: day, credits: 0, value: 0, count: 0 }
      dailyMap[day].credits += row.credits || 0
      dailyMap[day].value += Number(row.amount_paid || 0)
      dailyMap[day].count += 1
    })
    const dailyRevenue = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

    // ── Top 10 spenders all-time ─────────────────────────────────────────────
    const spenderMap: Record<string, SpenderRow> = {}
    const allSpenders = (topSpendersAllTime.data || []) as any[]
    allSpenders.forEach((row) => {
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
    thisMonthPurchases.forEach((row) => {
      const wid = row.workspace_id
      if (spenderMap[wid]) {
        spenderMap[wid].this_month_spend += Number(row.amount_paid || 0)
      }
    })
    const topSpenders = Object.values(spenderMap)
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 10)

    // ── Revenue by package ───────────────────────────────────────────────────
    const packageMap: Record<string, PackageRow> = {}
    const allPackages = creditPurchasesAllPackages.data || []
    allPackages.forEach((row) => {
      const name = row.package_name || 'unknown'
      if (!packageMap[name]) packageMap[name] = { package_name: name, count: 0, total_credits: 0, total_value: 0 }
      packageMap[name].count += 1
      packageMap[name].total_credits += row.credits || 0
      packageMap[name].total_value += Number(row.amount_paid || 0)
    })
    const revenueByPackage = Object.values(packageMap).sort((a, b) => b.total_value - a.total_value)

    // ── Credits redeemed this month ──────────────────────────────────────────
    const redeemedRows = creditsRedeemedThisMonth.data || []
    const totalCreditsRedeemed = redeemedRows.reduce((s, r) => s + (r.credits_used || 0), 0)

    // ── Active workspaces this month ─────────────────────────────────────────
    const activeWorkspaceIds = new Set(thisMonthPurchases.map((r) => r.workspace_id))
    const activeWorkspacesCount = activeWorkspaceIds.size

    // ── Partner payouts pending ──────────────────────────────────────────────
    const pendingPayoutRows = pendingPayouts.data || []
    const totalPendingPayouts = pendingPayoutRows.length
    const totalPendingPayoutsValue = pendingPayoutRows.reduce((s, r) => s + Number(r.amount || 0), 0)

    // ── Partner commissions this month ───────────────────────────────────────
    const earningsRows = partnerEarningsThisMonth.data || []
    const totalCommissionsThisMonth = earningsRows.reduce((s, r) => s + Number(r.amount || 0), 0)

    // ── Top 5 earning partners this month ────────────────────────────────────
    const partnerEarningsMap: Record<string, PartnerRow> = {}
    const topEarningsRows = (topPartnersByEarnings.data || []) as any[]
    topEarningsRows.forEach((row) => {
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

    // ── Churn Analysis ───────────────────────────────────────────────────────
    // Recent workspace IDs (purchased in last 20 days) — NOT churned
    const recentWorkspaceIds = new Set(
      (recentPurchasesForChurn.data || []).map((r) => r.workspace_id)
    )

    // Build a map of workspace → most recent purchase date (in the 20-60 day window)
    const candidateMap: Record<string, { name: string; last_purchase: string; total_spend: number }> = {}
    for (const row of (purchasesForChurnAnalysis.data || []) as any[]) {
      const wid = row.workspace_id
      if (!candidateMap[wid]) {
        candidateMap[wid] = {
          name: row.workspaces?.name || wid.slice(0, 8),
          last_purchase: row.created_at,
          total_spend: 0,
        }
      }
      // Track latest purchase date in window
      if (row.created_at > candidateMap[wid].last_purchase) {
        candidateMap[wid].last_purchase = row.created_at
      }
      candidateMap[wid].total_spend += Number(row.amount_paid || 0)
    }

    // Churned: in candidate window and NOT in recent set
    const churnedEntries = Object.entries(candidateMap).filter(
      ([wid]) => !recentWorkspaceIds.has(wid)
    )
    const churnedCount = churnedEntries.length

    // At-risk: in candidate window, last purchase 20-30 days ago, still active recently
    // For simplicity: workspaces whose MOST RECENT purchase was 20-30 days ago and not churned
    const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const atRiskCount = Object.entries(candidateMap).filter(([wid, data]) => {
      if (recentWorkspaceIds.has(wid)) return false
      const lastPurchaseDate = new Date(data.last_purchase)
      return lastPurchaseDate >= thirtyDaysAgoDate
    }).length

    // Top 5 churned workspaces by historical spend
    const churnedWorkspaces: ChurnedWorkspace[] = churnedEntries
      .sort(([, a], [, b]) => b.total_spend - a.total_spend)
      .slice(0, 5)
      .map(([wid, data]) => ({
        workspace_id: wid,
        name: data.name,
        last_purchase: data.last_purchase,
        total_spend: Math.round(data.total_spend * 100) / 100,
      }))

    return {
      overview: {
        mrr_current_month: Math.round(mrrCurrentMonth * 100) / 100,
        mrr_last_month: Math.round(mrrLastMonth * 100) / 100,
        mrr_growth_percent: mrrGrowthPercent,
        arr_annualized: Math.round(arrAnnualized * 100) / 100,
        credits_sold_count: totalCreditsSoldCount,
        credits_sold_units: totalCreditsSoldUnits,
        credits_sold_value: totalCreditsSoldValue,
        credits_redeemed: totalCreditsRedeemed,
        active_workspaces: activeWorkspacesCount,
        pending_payouts_count: totalPendingPayouts,
        pending_payouts_value: totalPendingPayoutsValue,
        commissions_this_month: totalCommissionsThisMonth,
      },
      forecast: {
        next_month_projected: Math.round(nextMonthProjected * 100) / 100,
        confidence_low: Math.round(confidenceLow * 100) / 100,
        confidence_high: Math.round(confidenceHigh * 100) / 100,
        months_used: regressionPoints.length,
      },
      retention: {
        churned_count: churnedCount,
        at_risk_count: atRiskCount,
        churned_workspaces: churnedWorkspaces,
      },
      dailyRevenue,
      topSpenders,
      revenueByPackage,
      topPartners,
    }
  } catch (error) {
    safeError('Admin revenue page data fetch error:', error)
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function fmtUSD(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: 'green' | 'red' | 'amber' }) {
  const highlightClasses = {
    green: 'text-emerald-600',
    red: 'text-red-500',
    amber: 'text-amber-600',
  }
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <div className="text-[12px] text-zinc-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold tracking-tight ${highlight ? highlightClasses[highlight] : 'text-zinc-900'}`}>{value}</div>
      {sub && <div className="text-[12px] text-zinc-400 mt-1">{sub}</div>}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100">
        <h2 className="text-[14px] font-medium text-zinc-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-8 text-center text-zinc-400 text-[13px]">{message}</div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminRevenuePage() {
  // Auth: verify admin via layout-level server check
  const supabase = await createClient()
  const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !sessionUser) {
    redirect('/login?error=unauthorized')
  }

  const userWithRole = await getUserWithRole(sessionUser)
  if (!userWithRole || (userWithRole.role !== 'owner' && userWithRole.role !== 'admin')) {
    redirect('/dashboard?error=admin_required')
  }

  const data = await fetchRevenueData()

  const now = new Date()
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">Revenue Dashboard</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Credit sales, workspace activity, and partner payouts — {monthLabel}
          </p>
        </div>

        {!data ? (
          <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-zinc-500 text-[13px]">
            Failed to load revenue data. Check server logs for details.
          </div>
        ) : (
          <>
            {/* ── MRR / ARR Stats ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatCard
                label="MRR (This Month)"
                value={fmtUSD(data.overview.mrr_current_month)}
                sub={
                  data.overview.mrr_growth_percent !== null
                    ? `${data.overview.mrr_growth_percent >= 0 ? '+' : ''}${data.overview.mrr_growth_percent.toFixed(1)}% vs last month`
                    : 'Credit sales this month'
                }
                highlight={
                  data.overview.mrr_growth_percent !== null
                    ? data.overview.mrr_growth_percent >= 0
                      ? 'green'
                      : 'red'
                    : undefined
                }
              />
              <StatCard
                label="ARR (Annualized)"
                value={fmtUSD(data.overview.arr_annualized)}
                sub="MRR × 12"
              />
              <StatCard
                label="MRR Last Month"
                value={fmtUSD(data.overview.mrr_last_month)}
                sub="Previous calendar month"
              />
              <StatCard
                label="Credits Sold This Month"
                value={fmt(data.overview.credits_sold_units)}
                sub={`${data.overview.credits_sold_count} purchase${data.overview.credits_sold_count !== 1 ? 's' : ''} · ${fmtUSD(data.overview.credits_sold_value)}`}
              />
            </div>

            {/* ── Secondary Stats ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Credits Redeemed This Month"
                value={fmt(data.overview.credits_redeemed)}
                sub="Via marketplace purchases"
              />
              <StatCard
                label="Active Workspaces This Month"
                value={fmt(data.overview.active_workspaces)}
                sub="Purchased credits this month"
              />
              <StatCard
                label="Partner Payouts Pending"
                value={fmtUSD(data.overview.pending_payouts_value)}
                sub={`${data.overview.pending_payouts_count} payout request${data.overview.pending_payouts_count !== 1 ? 's' : ''}`}
              />
              <StatCard
                label="Partner Commissions This Month"
                value={fmtUSD(data.overview.commissions_this_month)}
                sub="Sum of all partner earnings"
              />
            </div>

            {/* ── Forecast + Retention Row ─────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Forecast card */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5">
                <div className="text-[14px] font-medium text-zinc-900 mb-3">Next Month Forecast</div>
                <div className="text-3xl font-semibold text-zinc-900 tracking-tight mb-1">
                  {fmtUSD(data.forecast.next_month_projected)}
                </div>
                <div className="text-[12px] text-zinc-500 mb-3">
                  Projected revenue · ±{fmtUSD(data.forecast.next_month_projected * 0.2)} confidence range
                </div>
                <div className="flex gap-4 text-[12px]">
                  <div>
                    <span className="text-zinc-400">Low: </span>
                    <span className="text-zinc-700 font-medium">{fmtUSD(data.forecast.confidence_low)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">High: </span>
                    <span className="text-zinc-700 font-medium">{fmtUSD(data.forecast.confidence_high)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Based on: </span>
                    <span className="text-zinc-700 font-medium">{data.forecast.months_used} month{data.forecast.months_used !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Retention summary card */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5">
                <div className="text-[14px] font-medium text-zinc-900 mb-3">Retention Overview</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[12px] text-zinc-500 mb-0.5">Churned (last 30-60d)</div>
                    <div className="text-2xl font-semibold text-red-500">{data.retention.churned_count}</div>
                    <div className="text-[11px] text-zinc-400">workspaces</div>
                  </div>
                  <div>
                    <div className="text-[12px] text-zinc-500 mb-0.5">At Risk (20-30d inactive)</div>
                    <div className="text-2xl font-semibold text-amber-600">{data.retention.at_risk_count}</div>
                    <div className="text-[11px] text-zinc-400">workspaces</div>
                  </div>
                </div>
                <div className="mt-3">
                  <a
                    href="/admin/payouts"
                    className="text-[13px] font-medium text-zinc-700 hover:text-zinc-900 underline underline-offset-2"
                  >
                    Manage Payouts
                  </a>
                </div>
              </div>
            </div>

            {/* ── Churned Workspaces Table ─────────────────────────────────── */}
            <div className="mb-6">
              <SectionCard title="Retention — Top Churned Workspaces (last 30–60 days)">
                {data.retention.churned_workspaces.length === 0 ? (
                  <EmptyState message="No churned workspaces detected in this period." />
                ) : (
                  <table className="w-full">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-5 py-2.5 text-left text-[12px] font-medium text-zinc-500">Workspace</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">Last Purchase</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">Historical Spend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.retention.churned_workspaces.map((row) => (
                        <tr key={row.workspace_id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                          <td className="px-5 py-2.5 text-[13px] text-zinc-800">{row.name}</td>
                          <td className="px-5 py-2.5 text-[13px] text-zinc-600 text-right">{fmtDateTime(row.last_purchase)}</td>
                          <td className="px-5 py-2.5 text-[13px] font-medium text-zinc-900 text-right">{fmtUSD(row.total_spend)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </SectionCard>
            </div>

            {/* ── Daily Revenue Last 30 Days ─────────────────────────────────── */}
            <div className="mb-6">
              <SectionCard title="Daily Revenue — Last 30 Days">
                {data.dailyRevenue.length === 0 ? (
                  <EmptyState message="No revenue recorded in the last 30 days." />
                ) : (
                  <table className="w-full">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-5 py-2.5 text-left text-[12px] font-medium text-zinc-500">Date</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">Purchases</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">Credits Sold</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.dailyRevenue.map((row) => (
                        <tr key={row.date} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                          <td className="px-5 py-2.5 text-[13px] text-zinc-700">{fmtDate(row.date)}</td>
                          <td className="px-5 py-2.5 text-[13px] text-zinc-600 text-right">{fmt(row.count)}</td>
                          <td className="px-5 py-2.5 text-[13px] text-zinc-600 text-right">{fmt(row.credits)}</td>
                          <td className="px-5 py-2.5 text-[13px] font-medium text-zinc-900 text-right">{fmtUSD(row.value)}</td>
                        </tr>
                      ))}
                      {/* Totals row */}
                      <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                        <td className="px-5 py-2.5 text-[12px] font-semibold text-zinc-700">Totals</td>
                        <td className="px-5 py-2.5 text-[12px] font-semibold text-zinc-700 text-right">
                          {fmt(data.dailyRevenue.reduce((s, r) => s + r.count, 0))}
                        </td>
                        <td className="px-5 py-2.5 text-[12px] font-semibold text-zinc-700 text-right">
                          {fmt(data.dailyRevenue.reduce((s, r) => s + r.credits, 0))}
                        </td>
                        <td className="px-5 py-2.5 text-[12px] font-semibold text-zinc-900 text-right">
                          {fmtUSD(data.dailyRevenue.reduce((s, r) => s + r.value, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </SectionCard>
            </div>

            {/* ── Two-column: Top Spenders + Revenue by Package ─────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top 10 Spenders */}
              <SectionCard title="Top 10 Spenders (All-Time)">
                {data.topSpenders.length === 0 ? (
                  <EmptyState message="No purchase data available." />
                ) : (
                  <table className="w-full">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-5 py-2.5 text-left text-[12px] font-medium text-zinc-500">#</th>
                        <th className="px-5 py-2.5 text-left text-[12px] font-medium text-zinc-500">Workspace</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">All-Time</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">This Month</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topSpenders.map((row, i) => (
                        <tr key={row.workspace_id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                          <td className="px-5 py-2.5 text-[12px] text-zinc-400">{i + 1}</td>
                          <td className="px-5 py-2.5 text-[13px] text-zinc-800">{row.name}</td>
                          <td className="px-5 py-2.5 text-[13px] font-medium text-zinc-900 text-right">{fmtUSD(row.total_spend)}</td>
                          <td className="px-5 py-2.5 text-[13px] text-zinc-600 text-right">
                            {row.this_month_spend > 0 ? fmtUSD(row.this_month_spend) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </SectionCard>

              {/* Revenue by Package */}
              <SectionCard title="Revenue by Credit Package (All-Time)">
                {data.revenueByPackage.length === 0 ? (
                  <EmptyState message="No package data available." />
                ) : (
                  <table className="w-full">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-5 py-2.5 text-left text-[12px] font-medium text-zinc-500">Package</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">Purchases</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">Credits</th>
                        <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.revenueByPackage.map((row) => (
                        <tr key={row.package_name} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                          <td className="px-5 py-2.5 text-[13px] text-zinc-800 capitalize">
                            {row.package_name.replace(/-/g, ' ')}
                          </td>
                          <td className="px-5 py-2.5 text-[13px] text-zinc-600 text-right">{fmt(row.count)}</td>
                          <td className="px-5 py-2.5 text-[13px] text-zinc-600 text-right">{fmt(row.total_credits)}</td>
                          <td className="px-5 py-2.5 text-[13px] font-medium text-zinc-900 text-right">{fmtUSD(row.total_value)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                        <td className="px-5 py-2.5 text-[12px] font-semibold text-zinc-700">Totals</td>
                        <td className="px-5 py-2.5 text-[12px] font-semibold text-zinc-700 text-right">
                          {fmt(data.revenueByPackage.reduce((s, r) => s + r.count, 0))}
                        </td>
                        <td className="px-5 py-2.5 text-[12px] font-semibold text-zinc-700 text-right">
                          {fmt(data.revenueByPackage.reduce((s, r) => s + r.total_credits, 0))}
                        </td>
                        <td className="px-5 py-2.5 text-[12px] font-semibold text-zinc-900 text-right">
                          {fmtUSD(data.revenueByPackage.reduce((s, r) => s + r.total_value, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </SectionCard>
            </div>

            {/* ── Partner Section ───────────────────────────────────────────── */}
            <SectionCard title="Top 5 Earning Partners — This Month">
              {data.topPartners.length === 0 ? (
                <EmptyState message="No partner earnings recorded this month." />
              ) : (
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="px-5 py-2.5 text-left text-[12px] font-medium text-zinc-500">#</th>
                      <th className="px-5 py-2.5 text-left text-[12px] font-medium text-zinc-500">Partner</th>
                      <th className="px-5 py-2.5 text-right text-[12px] font-medium text-zinc-500">Earnings This Month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPartners.map((row, i) => (
                      <tr key={row.partner_id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                        <td className="px-5 py-2.5 text-[12px] text-zinc-400">{i + 1}</td>
                        <td className="px-5 py-2.5 text-[13px] text-zinc-800">{row.name}</td>
                        <td className="px-5 py-2.5 text-[13px] font-medium text-zinc-900 text-right">{fmtUSD(row.earnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  )
}
