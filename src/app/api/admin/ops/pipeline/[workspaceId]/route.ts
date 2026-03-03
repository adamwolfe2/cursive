/**
 * PATCH /api/admin/ops/pipeline/[workspaceId]
 * Update ops_stage for a workspace
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, logAdminAction } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'edge'

const VALID_STAGES = ['new', 'booked', 'trial', 'active', 'at_risk', 'churned'] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    await requireAdminRole()

    const { workspaceId } = params
    const body = await request.json()
    const { ops_stage, note } = body as { ops_stage: string; note?: string }

    if (!ops_stage || !VALID_STAGES.includes(ops_stage as any)) {
      return NextResponse.json(
        { error: `Invalid ops_stage. Must be one of: ${VALID_STAGES.join(', ')}` },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('workspaces')
      .update({ ops_stage })
      .eq('id', workspaceId)

    if (error) {
      safeError('[ops/pipeline PATCH] DB error:', error)
      return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 })
    }

    // Audit log (non-fatal)
    try {
      await logAdminAction('ops_stage_update', 'workspace', workspaceId, null, { ops_stage, note })
    } catch { /* non-fatal */ }

    return NextResponse.json({ ok: true, ops_stage })
  } catch (error) {
    safeError('[ops/pipeline PATCH] Error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 })
  }
}
