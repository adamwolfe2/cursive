export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { getFunnelOverview } from '@/lib/free-leads/funnel-admin'
import { safeError } from '@/lib/utils/log-sanitizer'

const querySchema = z.object({
  range: z.enum(['7d', '30d', 'all']).default('30d'),
})

/**
 * GET /api/admin/free-leads?range=7d|30d|all
 *
 * Read-only. Platform-admin gated. Returns { funnel, cost, claims, truncated } for the /start flow.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const parsed = querySchema.safeParse({
      range: new URL(request.url).searchParams.get('range') || '30d',
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 })
    }

    const { funnel, cost, claims, truncated } = await getFunnelOverview(parsed.data.range)
    return NextResponse.json({ funnel, cost, claims, truncated })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    safeError('[api/admin/free-leads]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
