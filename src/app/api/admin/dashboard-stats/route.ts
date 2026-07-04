export const runtime = 'edge'

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth/helpers"
import { requireAdmin } from "@/lib/auth/admin"
import { handleApiError, unauthorized } from "@/lib/utils/api-error-handler"

export async function GET() {
  try {
    // Auth check — must be platform admin
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    await requireAdmin()

    const adminClient = createAdminClient()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()

    // Sum this month's completed credit-purchase revenue across ALL rows.
    // Fetching a single capped page (previously .limit(5000)) silently stops
    // accumulating once volume exceeds the cap, understating the revenue tile.
    // Paginate to accumulate the full month with no cap. (No SQL SUM RPC exists.)
    const sumCreditsPurchasedThisMonth = async (): Promise<number> => {
      const PAGE = 1000
      let from = 0
      let total = 0
      for (;;) {
        const { data, error } = await adminClient
          .from("credit_purchases")
          .select("amount_paid")
          .eq("status", "completed")
          .gte("created_at", monthStart)
          .order("created_at", { ascending: true })
          .range(from, from + PAGE - 1)
        if (error || !data || data.length === 0) break
        total += data.reduce(
          (sum: number, t: { amount_paid: number | null }) => sum + Number(t.amount_paid ?? 0),
          0
        )
        if (data.length < PAGE) break
        from += PAGE
      }
      return total
    }

    // Run all stat queries in parallel, each non-fatal
    const [
      totalUsersResult,
      newTodayResult,
      leadsWeekResult,
      activeQueriesResult,
      creditsPurchasedResult,
      failedEnrichmentsResult,
    ] = await Promise.allSettled([
      adminClient.from("users").select("id", { count: "exact", head: true }),
      adminClient
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
      adminClient
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekStart),
      adminClient
        .from("queries")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      sumCreditsPurchasedThisMonth(),
      adminClient
        .from("failed_operations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
    ])

    const totalUsers =
      totalUsersResult.status === "fulfilled" ? (totalUsersResult.value.count ?? 0) : 0
    const newToday =
      newTodayResult.status === "fulfilled" ? (newTodayResult.value.count ?? 0) : 0
    const leadsThisWeek =
      leadsWeekResult.status === "fulfilled" ? (leadsWeekResult.value.count ?? 0) : 0
    const activeQueries =
      activeQueriesResult.status === "fulfilled" ? (activeQueriesResult.value.count ?? 0) : 0
    const creditsPurchasedThisMonth =
      creditsPurchasedResult.status === "fulfilled" ? creditsPurchasedResult.value : 0
    const failedOpsToday =
      failedEnrichmentsResult.status === "fulfilled"
        ? (failedEnrichmentsResult.value.count ?? 0)
        : 0

    return NextResponse.json({
      totalUsers,
      newToday,
      leadsThisWeek,
      activeQueries,
      creditsPurchasedThisMonth,
      failedOpsToday,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
