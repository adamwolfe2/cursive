// Admin API: Manually Trigger Lead Enrichment
// Used for testing and manual enrichment


import { NextRequest, NextResponse } from 'next/server'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify platform admin access
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()

    const body = await request.json()
    const { lead_id, workspace_id } = body

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      )
    }

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    await inngest.send({
      name: 'lead/enrich' as const,
      data: { lead_id, workspace_id },
    })
    safeLog(`[Admin Trigger Enrichment] Enrichment queued for lead ${lead_id}`)

    return NextResponse.json({
      success: true,
      message: `Enrichment queued for lead ${lead_id}`,
    })
  } catch (error: any) {
    safeError('[Admin Trigger Enrichment] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
