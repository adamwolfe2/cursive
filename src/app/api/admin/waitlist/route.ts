
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

    // Return empty state if the table doesn't exist yet (new environment)
    // The DatabaseError message will contain the Supabase error details
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('42P01') || msg.includes('does not exist') || msg.includes('relation')) {
      return NextResponse.json({ signups: [], total: 0 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    )
  }
}
