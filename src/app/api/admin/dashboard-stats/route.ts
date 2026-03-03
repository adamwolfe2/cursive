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
      adminClient
        .from("credit_transactions")
        .select("amount")
        .eq("transaction_type", "purchase")
        .gte("created_at", monthStart)
        .limit(5000),
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
      creditsPurchasedResult.status === "fulfilled"
        ? (creditsPurchasedResult.value.data ?? []).reduce(
            (sum: number, t: { amount: number }) => sum + Number(t.amount),
            0
          )
        : 0
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
