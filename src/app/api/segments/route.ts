/**
 * Saved Segments API
 * CRUD operations for user-created audience segments
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { z } from 'zod'

const segmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: z.record(z.any()), // JSONB filter object
  status: z.enum(['active', 'paused', 'archived']).default('active'),
})

/**
 * GET /api/segments
 * List user's saved segments
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    const supabase = await createClient()

    let query = supabase
      .from('saved_segments')
      .select('*')
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: segments, error } = await query

    if (error) {
      safeError('[Segments API] Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch segments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ segments })
  } catch (error) {
    safeError('[Segments API] GET error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/segments
 * Create new segment
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = segmentSchema.parse(body)

    const supabase = await createClient()

    // Check if segment name already exists for this user
    const { data: existing } = await supabase
      .from('saved_segments')
      .select('id')
      .eq('workspace_id', user.workspace_id)
      .eq('name', validated.name)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Segment name already exists' },
        { status: 409 }
      )
    }

    // Create segment
    const { data: segment, error } = await supabase
      .from('saved_segments')
      .insert({
        workspace_id: user.workspace_id,
        user_id: user.id,
        name: validated.name,
        description: validated.description,
        filters: validated.filters,
        status: validated.status,
      })
      .select()
      .maybeSingle()

    if (error) {
      safeError('[Segments API] Create error:', error)
      return NextResponse.json(
        { error: 'Failed to create segment' },
        { status: 500 }
      )
    }

    safeLog('[Segments API] Created segment:', {
      segment_id: segment.id,
      workspace_id: user.workspace_id,
      name: validated.name,
    })

    return NextResponse.json({ segment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[Segments API] POST error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
