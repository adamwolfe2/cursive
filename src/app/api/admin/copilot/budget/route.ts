/**
 * GET /api/admin/copilot/budget
 * Returns today's copilot spend + cap so the UI can show a running meter.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { checkDailyBudget } from '@/lib/copilot/cost'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const budget = await checkDailyBudget('admin')
  return NextResponse.json(budget)
}
