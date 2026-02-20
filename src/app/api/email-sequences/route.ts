/**
 * Email Sequences API
 * CRUD for automated email sequences
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'


const createSequenceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  trigger_type: z.enum(['manual', 'segment', 'lead_added', 'lead_scored', 'time_based']),
  trigger_config: z.record(z.any()).optional(),
})

// GET /api/email-sequences - List sequences
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const includeSteps = searchParams.get('include_steps') === 'true'

    const supabase = await createClient()

    let query = supabase
      .from('email_sequences')
      .select(
        includeSteps
          ? `
          *,
          email_sequence_steps (
            id,
            step_order,
            name,
            template_id,
            delay_days,
            delay_hours,
            delay_minutes,
            sent_count,
            opened_count,
            clicked_count
          )
        `
          : '*'
      )
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: sequences, error } = await query

    if (error) {
      safeError('Failed to fetch email sequences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sequences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sequences })
  } catch (error) {
    safeError('Email sequences GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/email-sequences - Create sequence
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createSequenceSchema.parse(body)

    const supabase = await createClient()

    const { data: sequence, error } = await supabase
      .from('email_sequences')
      .insert({
        workspace_id: user.workspace_id,
        user_id: user.id,
        name: validated.name,
        description: validated.description,
        trigger_type: validated.trigger_type,
        trigger_config: validated.trigger_config || {},
        status: 'draft',
      })
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Sequence name already exists' },
          { status: 400 }
        )
      }
      safeError('Failed to create email sequence:', error)
      return NextResponse.json(
        { error: 'Failed to create sequence' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sequence }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    safeError('Email sequences POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
