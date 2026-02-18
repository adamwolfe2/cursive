/**
 * Email Sequence Detail API
 * Get, update, delete individual sequence
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'


const updateSequenceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  trigger_type: z.enum(['manual', 'segment', 'lead_added', 'lead_scored', 'time_based']).optional(),
  trigger_config: z.record(z.any()).optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
})

// GET /api/email-sequences/[id] - Get sequence with steps
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

    const { data: sequence, error } = await supabase
      .from('email_sequences')
      .select(
        `
        *,
        email_sequence_steps (
          id,
          step_order,
          name,
          template_id,
          delay_days,
          delay_hours,
          delay_minutes,
          subject,
          body,
          conditions,
          sent_count,
          opened_count,
          clicked_count,
          replied_count,
          created_at,
          updated_at,
          email_templates (
            id,
            name,
            subject,
            preview_text
          )
        )
      `
      )
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (error || !sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    return NextResponse.json({ sequence })
  } catch (error) {
    safeError('Email sequence GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/email-sequences/[id] - Update sequence
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
    const validated = updateSequenceSchema.parse(body)

    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('email_sequences')
      .select('id, status')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    // Prevent activating sequence without steps
    if (validated.status === 'active' && existing.status !== 'active') {
      const { data: steps } = await supabase
        .from('email_sequence_steps')
        .select('id')
        .eq('sequence_id', id)
        .limit(1)

      if (!steps || steps.length === 0) {
        return NextResponse.json(
          { error: 'Cannot activate sequence without steps' },
          { status: 400 }
        )
      }
    }

    const { data: sequence, error } = await supabase
      .from('email_sequences')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Sequence name already exists' },
          { status: 400 }
        )
      }
      safeError('Failed to update email sequence:', error)
      return NextResponse.json(
        { error: 'Failed to update sequence' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sequence })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    safeError('Email sequence PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/email-sequences/[id] - Delete sequence
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
      .from('email_sequences')
      .select('id, status')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    // Prevent deleting active sequences
    if (existing.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active sequence. Pause it first.' },
        { status: 400 }
      )
    }

    // Check for active enrollments
    const { data: enrollments } = await supabase
      .from('email_sequence_enrollments')
      .select('id')
      .eq('sequence_id', id)
      .eq('status', 'active')
      .limit(1)

    if (enrollments && enrollments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete sequence with active enrollments' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('email_sequences')
      .delete()
      .eq('id', id)

    if (error) {
      safeError('Failed to delete email sequence:', error)
      return NextResponse.json(
        { error: 'Failed to delete sequence' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('Email sequence DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
