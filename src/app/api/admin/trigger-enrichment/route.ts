// Admin API: Manually Trigger Lead Enrichment
// Used for testing and manual enrichment


import { NextRequest, NextResponse } from 'next/server'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify platform admin access
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()

    const body = await request.json()
    const { lead_id } = body

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      )
    }

    // Inngest disabled (Node.js runtime not available on this deployment)
    // Original: await inngest.send({ name: 'lead/enrich', data: { lead_id, workspace_id } })
    safeLog(`[Admin Trigger Enrichment] Enrichment requested for lead ${lead_id} (Inngest disabled - Edge runtime)`)

    return NextResponse.json({
      success: true,
      message: `Enrichment requested for lead ${lead_id} (Note: Inngest background processing unavailable)`,
    })
  } catch (error: any) {
    safeError('[Admin Trigger Enrichment] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
