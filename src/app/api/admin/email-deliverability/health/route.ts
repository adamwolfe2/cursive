import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET() {
  try {
    await requireAdmin()
    return NextResponse.json({
      success: true,
      data: {
        health_score: 0,
        overall_open_rate: 0,
        overall_bounce_rate: 0,
        unsubscribe_rate: 0,
        total_sent: 0,
        total_opened: 0,
        total_bounced: 0,
        total_unsubscribed: 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
