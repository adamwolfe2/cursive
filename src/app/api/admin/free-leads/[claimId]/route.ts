export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { FunnelAdminError, getClaimDetail } from '@/lib/free-leads/funnel-admin'
import { safeError } from '@/lib/utils/log-sanitizer'

const paramsSchema = z.object({ claimId: z.string().uuid() })

/**
 * GET /api/admin/free-leads/[claimId]
 *
 * Read-only. Platform-admin gated. Returns { claim, icp, leads, events, cost } for one claim.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
  try {
    await requireAdmin()

    const parsed = paramsSchema.safeParse(await params)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid claim id' }, { status: 400 })
    }

    return NextResponse.json(await getClaimDetail(parsed.data.claimId))
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (error instanceof FunnelAdminError && error.code === 'not_found') {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }
    safeError('[api/admin/free-leads/[claimId]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
