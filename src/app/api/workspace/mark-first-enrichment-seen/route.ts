import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await request.json() as { workspaceId?: string }
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })

  // Verify user belongs to this workspace
  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (userData?.workspace_id !== workspaceId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase
    .from('workspaces')
    .update({ has_seen_first_enrichment: true })
    .eq('id', workspaceId)

  return NextResponse.json({ ok: true })
}
