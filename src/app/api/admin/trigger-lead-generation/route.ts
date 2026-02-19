// Admin API: Manually Trigger Lead Generation
// Used for testing and manual runs


import { NextRequest, NextResponse } from 'next/server'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify platform admin access
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()

    const body = await request.json()
    const { query_id, workspace_id } = body

    if (query_id) {
      if (!workspace_id) {
        return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
      }

      await inngest.send({
        name: 'lead/generate' as const,
        data: { query_id, workspace_id },
      })
      safeLog(`[Admin Trigger Lead Generation] Generation queued for query ${query_id}`)

      return NextResponse.json({
        success: true,
        message: `Lead generation queued for query ${query_id}`,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Lead generation will run on next cron schedule (2 AM daily)',
        note: 'Use Inngest dashboard to manually invoke the daily-lead-generation function',
      })
    }
  } catch (error: any) {
    safeError('[Admin Trigger Lead Generation] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
