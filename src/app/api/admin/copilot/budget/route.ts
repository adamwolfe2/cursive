/**
 * GET /api/admin/copilot/budget
 * Returns today's copilot spend + cap so the UI can show a running meter.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserWithRole } from '@/lib/auth/roles'
import { checkDailyBudget } from '@/lib/copilot/cost'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const userWithRole = await getUserWithRole(user)
  if (!userWithRole || !['owner', 'admin'].includes(userWithRole.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const budget = await checkDailyBudget('admin')
  return NextResponse.json(budget)
}
