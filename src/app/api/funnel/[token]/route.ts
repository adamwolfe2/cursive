/**
 * GET /api/funnel/[token]
 *
 * Returns the order state for a given portal token. Used by FunnelPortal
 * to refresh after step completion.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getOrderByToken } from '@/lib/funnel/order.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const lookup = await getOrderByToken(token)

    if (!lookup.ok) {
      if (lookup.error === 'expired' || lookup.error === 'revoked') {
        return NextResponse.json({ error: 'Link no longer valid' }, { status: 403 })
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ order: lookup.data.order })
  } catch (err) {
    safeError('[funnel/[token]] GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
