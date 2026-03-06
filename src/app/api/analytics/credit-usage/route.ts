/**
 * Credit Usage Analytics API
 * Spending trends and usage breakdown
 */


import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const querySchema = z.object({
  days: z.coerce.number().min(1).max(90).default(30),
})

/**
 * GET /api/analytics/credit-usage?days=30
 * Get credit usage summary with daily breakdown
 */
export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const { days } = querySchema.parse({
      days: searchParams.get('days'),
    })

    const supabase = await createClient()

    // Call RPC function for credit usage
    const { data: usage, error } = await supabase
      .rpc('get_credit_usage_summary', {
        p_workspace_id: user.workspaceId,
        p_days: days,
      })

    if (error) {
      safeError('[Credit Usage] RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch credit usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({ usage })
  } catch (error) {
    safeError('[Credit Usage] Error:', error)
    return handleApiError(error)
  }
}
