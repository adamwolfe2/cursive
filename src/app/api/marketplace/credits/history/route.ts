// Credit Transaction History API
// GET /api/marketplace/credits/history
// Returns combined credit transaction history (purchases + usage) for the workspace

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const workspaceId = user.workspace_id

    // Parse query params — use Number() with isNaN guard to avoid NaN propagation
    const { searchParams } = new URL(req.url)
    const rawLimit = Number(searchParams.get('limit') ?? 50)
    const rawOffset = Number(searchParams.get('offset') ?? 0)
    const rawDays = Number(searchParams.get('days') ?? 0)
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 100)
    const offset = Math.min(Math.max(0, isNaN(rawOffset) ? 0 : rawOffset), 100000)
    const days = isNaN(rawDays) ? 0 : Math.max(0, rawDays) // 0 = all time
    const dateFilter = days > 0
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      : null

    const adminClient = createAdminClient()

    // Build queries (not yet awaited)
    const balanceQuery = adminClient
      .from('workspace_credits')
      .select('balance')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    let purchasesQuery = adminClient
      .from('credit_purchases')
      .select('id, credits, package_name, amount_paid, status, created_at, completed_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    if (dateFilter) purchasesQuery = purchasesQuery.gte('created_at', dateFilter)

    let enrichmentsQuery = adminClient
      .from('enrichment_log')
      .select('id, lead_id, status, credits_used, created_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
    if (dateFilter) enrichmentsQuery = enrichmentsQuery.gte('created_at', dateFilter)

    // Execute all three queries in parallel
    const [creditsResult, purchasesResult, enrichmentsResult] = await Promise.all([
      balanceQuery,
      purchasesQuery,
      enrichmentsQuery,
    ])

    const actualCurrentBalance = creditsResult.data?.balance ?? 0

    if (purchasesResult.error) {
      safeError('[Credit History] Failed to fetch purchases:', purchasesResult.error)
      return NextResponse.json({ error: 'Failed to fetch credit history' }, { status: 500 })
    }

    const purchases = purchasesResult.data

    if (enrichmentsResult.error) {
      safeError('[Credit History] Failed to fetch enrichments:', enrichmentsResult.error)
      // Non-fatal — proceed with just purchases
    }
    const enrichments = enrichmentsResult.data

    // Build combined transaction list
    type Transaction = {
      id: string
      date: string
      description: string
      credits_in: number
      credits_out: number
      type: 'purchase' | 'usage'
    }

    const transactions: Transaction[] = []

    // Add purchase transactions (credits in)
    for (const purchase of purchases || []) {
      transactions.push({
        id: `purchase-${purchase.id}`,
        date: purchase.completed_at || purchase.created_at,
        description: purchase.package_name
          ? `Credit purchase — ${purchase.package_name.replace(/-/g, ' ')}`
          : 'Credit purchase',
        credits_in: purchase.credits,
        credits_out: 0,
        type: 'purchase',
      })
    }

    // Add enrichment transactions (credits out)
    for (const enrichment of enrichments || []) {
      transactions.push({
        id: `enrichment-${enrichment.id}`,
        date: enrichment.created_at,
        description: `Lead enrichment`,
        credits_in: 0,
        credits_out: enrichment.credits_used || 1,
        type: 'usage',
      })
    }

    // Sort all transactions by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Compute running balance using the real current balance as the anchor.
    // Walk transactions newest-to-oldest, assigning per-row balance.
    const totalIn = transactions.reduce((sum, t) => sum + t.credits_in, 0)
    const totalOut = transactions.reduce((sum, t) => sum + t.credits_out, 0)

    // Start from the actual current balance (from workspace_credits), not just the
    // period-filtered sum. This ensures the balance column is correct even when
    // the date filter excludes older transactions.
    let runningBalance = actualCurrentBalance

    type TransactionWithBalance = Transaction & { balance: number }
    const transactionsWithBalance: TransactionWithBalance[] = transactions.map((t) => {
      const entry = { ...t, balance: runningBalance }
      // Walk backwards: balance before this transaction was:
      //   balance_before = runningBalance - credits_in + credits_out
      runningBalance = runningBalance - t.credits_in + t.credits_out
      return entry
    })

    // Apply pagination after computing balances
    const total = transactionsWithBalance.length
    const paginated = transactionsWithBalance.slice(offset, offset + limit)

    return NextResponse.json({
      transactions: paginated,
      total,
      offset,
      limit,
      summary: {
        totalIn,
        totalOut,
        currentBalance: actualCurrentBalance,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
