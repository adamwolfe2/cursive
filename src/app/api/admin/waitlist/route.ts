
import { NextResponse } from 'next/server'
import { WaitlistRepository } from '@/lib/repositories/waitlist.repository'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET() {
  try {
    // SECURITY: Verify platform admin authorization
    await requireAdmin()

    // Fetch all waitlist signups
    const repo = new WaitlistRepository()
    const result = await repo.findAll(1, 1000) // Get first 1000

    return NextResponse.json({
      signups: result.signups,
      total: result.total
    })
  } catch (error) {
    safeError('[Admin] Waitlist fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    )
  }
}
