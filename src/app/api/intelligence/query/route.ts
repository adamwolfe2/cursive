/**
 * POST /api/intelligence/query
 * Body: { query: string }
 * Converts a natural language query to SQL, executes it safely scoped to the
 * caller's workspace, and returns results + an AI-generated summary.
 * Costs 1 credit per query (tracked via cost-tracker, no credit deduction yet).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { runNaturalLanguageQuery } from '@/lib/services/intelligence/nl-query.service'
import { trackCost } from '@/lib/services/intelligence/cost-tracker'
import { safeError } from '@/lib/utils/log-sanitizer'

const schema = z.object({
  query: z.string().min(3).max(500),
})

export async function POST(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { query } = schema.parse(body)

    const result = await runNaturalLanguageQuery(query, user.workspaceId)

    // Track cost (~$0.005 per NL query) — fire-and-forget, never block the response
    trackCost({
      workspace_id: user.workspaceId,
      tier: 'nl_query',
      provider: 'openai_gpt4o_mini',
      // Free by design — NL queries reduce friction. To charge in future: deduct 0.5 credits (same pattern as POST /api/leads/[id]/intelligence).
      credits_charged: 0,
      api_cost_usd: 0.005,
      status: 'completed',
    }).catch((err) => safeError('[NLQuery] Cost tracking failed:', err))

    return NextResponse.json({
      query,
      sql: result.sql,
      results: result.results,
      count: result.count,
      summary: result.summary,
    })
  } catch (err) {
    safeError('[NL Query] Error', err)
    // Return user-friendly error for known validation failures
    const msg = err instanceof Error ? err.message : 'Query failed'
    if (
      msg.includes('Only SELECT') ||
      msg.includes('forbidden keyword') ||
      msg.includes('workspace_id filter')
    ) {
      return NextResponse.json({ error: 'Invalid query — ' + msg }, { status: 400 })
    }
    return handleApiError(err)
  }
}
