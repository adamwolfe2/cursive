
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const suspendSchema = z.object({
  action: z.enum(['suspend', 'unsuspend']),
  reason: z.string().max(500).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authorization
    const admin = await requireAdmin()
    const { id: workspaceId } = await params

    // Validate request body
    const body = await request.json()
    const { action, reason } = suspendSchema.parse(body)

    const adminClient = createAdminClient()

    // Verify workspace exists
    const { data: workspace, error: fetchError } = await adminClient
      .from('workspaces')
      .select('id, name, is_suspended')
      .eq('id', workspaceId)
      .maybeSingle()

    if (fetchError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Update workspace suspension status
    const updates =
      action === 'suspend'
        ? {
            is_suspended: true,
            suspended_reason: reason || 'Suspended by admin',
            suspended_at: new Date().toISOString(),
          }
        : {
            is_suspended: false,
            suspended_reason: null,
            suspended_at: null,
          }

    const { error: updateError } = await adminClient
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)

    if (updateError) {
      safeError('[Admin] Failed to update workspace suspension:', updateError)
      return NextResponse.json(
        { error: 'Failed to update workspace' },
        { status: 500 }
      )
    }

    // Create audit log entry
    await adminClient.from('admin_audit_log').insert({
      admin_email: admin.email,
      action: action === 'suspend' ? 'workspace.suspended' : 'workspace.unsuspended',
      resource_type: 'workspace',
      resource_id: workspaceId,
      details: {
        workspace_name: workspace.name,
        reason: reason || undefined,
      },
    })

    safeError(
      `[Admin] Workspace ${action}ed: ${workspaceId} by ${admin.email}`
    )

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspaceId,
        is_suspended: action === 'suspend',
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[Admin] Suspend workspace error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
