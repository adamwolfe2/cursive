import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { FEATURE_KEYS, normalizeFeatures } from '@/lib/workspaces/feature-flags'

// PATCH /api/admin/workspaces/[id]/features
//
// Sets a workspace's nav feature allowlist (`visible_features`).
//  - features = null  → show ALL nav items (default / clears the allowlist)
//  - features = []    → also treated as "show all" downstream, but we persist
//                        NULL for that case to keep the column semantics clean
//  - features = [...]  → strict allowlist; only those nav items render, taking
//                        precedence over role/plan/adminOnly gating
const schema = z.object({
  features: z.array(z.enum(FEATURE_KEYS)).nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id: workspaceId } = await params

    const body = await request.json()
    const { features } = schema.parse(body)

    const adminClient = createAdminClient()

    const { data: workspace, error: fetchError } = await adminClient
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .maybeSingle()

    if (fetchError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Empty array collapses to NULL ("show all"); otherwise dedup + drop unknowns.
    const normalized = features ? normalizeFeatures(features) : []
    const value: string[] | null = normalized.length > 0 ? normalized : null

    const { error: updateError } = await adminClient
      .from('workspaces')
      .update({ visible_features: value })
      .eq('id', workspaceId)

    if (updateError) {
      safeError('[Admin] Failed to update workspace features:', updateError)
      return NextResponse.json(
        { error: 'Failed to update workspace' },
        { status: 500 }
      )
    }

    await adminClient.from('admin_audit_log').insert({
      admin_email: admin.email,
      action: 'workspace.features_updated',
      resource_type: 'workspace',
      resource_id: workspaceId,
      details: {
        workspace_name: workspace.name,
        visible_features: value,
      },
    })

    safeLog(
      `[Admin] Workspace features updated: ${workspaceId} by ${admin.email}`
    )

    return NextResponse.json({ success: true, visible_features: value })
  } catch (error: unknown) {
    safeError('[Admin] Update workspace features error:', error)
    return handleApiError(error)
  }
}
