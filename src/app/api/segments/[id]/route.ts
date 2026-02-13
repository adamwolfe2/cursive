/**
 * Individual Segment Operations
 * Update, delete, and run saved segments
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  filters: z.record(z.any()).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
})

/**
 * GET /api/segments/[id]
 * Get single segment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    const { data: segment, error } = await supabase
      .from('saved_segments')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (error || !segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    return NextResponse.json({ segment })
  } catch (error) {
    safeError('[Segments API] GET single error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/segments/[id]
 * Update segment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateSchema.parse(body)

    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('saved_segments')
      .select('user_id')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own segments' },
        { status: 403 }
      )
    }

    // Update segment
    const { data: segment, error } = await supabase
      .from('saved_segments')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      safeError('[Segments API] Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update segment' },
        { status: 500 }
      )
    }

    safeLog('[Segments API] Updated segment:', {
      segment_id: id,
      updates: validated,
    })

    return NextResponse.json({ segment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[Segments API] PATCH error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/segments/[id]
 * Delete segment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('saved_segments')
      .select('user_id')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own segments' },
        { status: 403 }
      )
    }

    // Delete segment
    const { error } = await supabase
      .from('saved_segments')
      .delete()
      .eq('id', id)

    if (error) {
      safeError('[Segments API] Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete segment' },
        { status: 500 }
      )
    }

    safeLog('[Segments API] Deleted segment:', { segment_id: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[Segments API] DELETE error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
