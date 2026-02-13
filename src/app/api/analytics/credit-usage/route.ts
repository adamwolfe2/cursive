/**
 * Credit Usage Analytics API
 * Spending trends and usage breakdown
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { days } = querySchema.parse({
      days: searchParams.get('days'),
    })

    const supabase = await createClient()

    // Call RPC function for credit usage
    const { data: usage, error } = await supabase
      .rpc('get_credit_usage_summary', {
        p_workspace_id: user.workspace_id,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[Credit Usage] Error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
