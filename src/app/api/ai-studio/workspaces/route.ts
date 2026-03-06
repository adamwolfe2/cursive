/**
 * Brand Workspaces API Routes
 * GET /api/ai-studio/workspaces - List all workspaces
 */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await fastAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // 2. Fetch all brand workspaces for user's workspace
    const { data: workspaces, error } = await supabase
      .from('brand_workspaces')
      .select('id, name, url, logo_url, favicon_url, brand_data, extraction_status, created_at')
      .eq('workspace_id', user.workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[Workspaces] Database error:', error)
      throw new Error('Failed to fetch workspaces')
    }

    return NextResponse.json({
      workspaces: workspaces || [],
    })

  } catch (error: any) {
    safeError('[Workspaces] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    )
  }
}
