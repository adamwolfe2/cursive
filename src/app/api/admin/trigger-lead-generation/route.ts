// Admin API: Manually Trigger Lead Generation
// Used for testing and manual runs


import { NextRequest, NextResponse } from 'next/server'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify platform admin access
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()

    const body = await request.json()
    const { query_id } = body

    if (query_id) {
      // Inngest disabled (Node.js runtime not available on this deployment)
      // Original: await inngest.send({ name: 'lead/generate', data: { query_id, workspace_id } })
      safeLog(`[Admin Trigger Lead Generation] Generation requested for query ${query_id} (Inngest disabled - Edge runtime)`)

      return NextResponse.json({
        success: true,
        message: `Lead generation requested for query ${query_id} (Note: Inngest background processing unavailable)`,
      })
    } else {
      // Trigger daily generation for all queries
      // Note: This would normally be triggered by cron
      // For testing, we can manually invoke it
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
