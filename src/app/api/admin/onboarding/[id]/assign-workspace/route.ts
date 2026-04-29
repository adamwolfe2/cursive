export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

// Assigns (or unassigns) a workspace to an onboarding client. The chosen
// workspace_id is later read by approveSequences() and passed into the
// EmailBison push so the campaigns get the right workspace's senders.
// Pass workspace_id: null to clear the assignment (falls back to the
// onboarding-fallback "all senders" path).

const schema = z.object({
  workspace_id: z.string().uuid().nullable(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id: clientId } = await params

    const body = await req.json()
    const { workspace_id } = schema.parse(body)

    const supabase = createAdminClient()

    // If a workspace is being assigned, verify it exists and is not suspended.
    if (workspace_id) {
      const { data: ws, error: wsError } = await supabase
        .from('workspaces')
        .select('id, is_suspended')
        .eq('id', workspace_id)
        .maybeSingle()

      if (wsError || !ws) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      }
      if (ws.is_suspended) {
        return NextResponse.json({ error: 'Workspace is suspended' }, { status: 400 })
      }
    }

    const { error: updateError } = await supabase
      .from('onboarding_clients')
      .update({
        assigned_workspace_id: workspace_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (updateError) {
      safeError('[Admin] Failed to assign workspace:', updateError)
      return NextResponse.json({ error: 'Failed to assign workspace' }, { status: 500 })
    }

    return NextResponse.json({ success: true, assigned_workspace_id: workspace_id })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    safeError('[Admin] assign-workspace POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
