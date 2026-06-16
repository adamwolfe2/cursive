export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { getLaunchFunnel } from '@/lib/funnel/launch-funnel'
import { safeError } from '@/lib/utils/log-sanitizer'

const querySchema = z.object({
  range: z.enum(['7d', '30d', 'all']).default('30d'),
})

/**
 * GET /api/admin/launch-funnel?range=7d|30d|all
 *
 * Read-only. Admin-gated via requireAdmin(). Returns the 7-stage launch funnel
 * counts for the window. Never mutates anything.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      range: searchParams.get('range') || '30d',
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 })
    }

    const data = await getLaunchFunnel(parsed.data.range)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    safeError('[api/admin/launch-funnel]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
