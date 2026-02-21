/**
 * Customer Profiles API Routes
 * GET /api/ai-studio/profiles - List customer profiles for a workspace
 */


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

const querySchema = z.object({
  workspace: z.string().min(1, 'Invalid workspace ID format').regex(/^[a-zA-Z0-9-]+$/, 'Invalid workspace ID format'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceParam = searchParams.get('workspace')

    if (!workspaceParam) {
      return NextResponse.json({ error: 'workspace parameter required' }, { status: 400 })
    }

    // Validate input
    const validationResult = querySchema.safeParse({ workspace: workspaceParam })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid workspace ID format' },
        { status: 400 }
      )
    }

    const { workspace: workspaceId } = validationResult.data

    const supabase = await createClient()

    // Verify brand workspace belongs to user's workspace
    // getCurrentUser() already returns workspace_id — no extra users table query needed
    const { data: brandWorkspace } = await supabase
      .from('brand_workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!brandWorkspace) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch customer profiles for the workspace
    const { data: profiles, error } = await supabase
      .from('customer_profiles')
      .select('id, brand_workspace_id, name, email, phone, demographics, preferences, purchase_history, engagement_score, tags, created_at, updated_at')
      .eq('brand_workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[Profiles] Database error:', error)
      throw new Error('Failed to fetch profiles')
    }

    return NextResponse.json({ profiles: profiles || [] })
  } catch (error: any) {
    safeError('[Profiles] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}
