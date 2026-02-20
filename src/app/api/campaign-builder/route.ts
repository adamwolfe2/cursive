/**
 * Campaign Builder API - List & Create
 * Sales.co-style campaign crafting
 */


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { CampaignBuilderRepository } from '@/lib/repositories/campaign-builder.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

const createDraftSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
})

/**
 * GET /api/campaign-builder
 * List campaign drafts for workspace
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Query params
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get drafts
    const repo = new CampaignBuilderRepository()
    const result = await repo.listByWorkspace(userData.workspace_id, {
      status,
      limit,
      offset,
    })

    return NextResponse.json({
      drafts: result.drafts,
      total: result.total,
      limit,
      offset,
    })
  } catch (error) {
    safeError('[Campaign Builder] List error:', error)
    return NextResponse.json(
      { error: 'Failed to list campaigns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaign-builder
 * Create new campaign draft
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace
    const { data: userData } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Validate request
    const body = await req.json()
    const validated = createDraftSchema.parse(body)

    // Create draft
    const repo = new CampaignBuilderRepository()
    const draft = await repo.create(userData.workspace_id, userData.id, validated)

    return NextResponse.json({ draft }, { status: 201 })
  } catch (error) {
    safeError('[Campaign Builder] Create error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
