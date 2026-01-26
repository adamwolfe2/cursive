/**
 * Email Sequences API
 * GET /api/sequences - List sequences
 * POST /api/sequences - Create sequence
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createSequenceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  trigger_type: z.enum(['manual', 'new_lead', 'tag_added', 'score_threshold']).default('manual'),
  trigger_config: z.record(z.any()).optional().default({}),
  steps: z.array(z.object({
    step_type: z.enum(['email', 'wait', 'condition', 'action']),
    subject_template: z.string().optional(),
    body_template: z.string().optional(),
    delay_hours: z.number().min(0).default(0),
    delay_type: z.enum(['after_previous', 'after_open', 'after_click', 'specific_time']).default('after_previous'),
    condition_config: z.record(z.any()).optional(),
  })).optional().default([]),
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get sequences with step count
    const { data: sequences, error } = await supabase
      .from('email_sequences')
      .select(`
        *,
        email_sequence_steps(count),
        email_sequence_enrollments(count)
      `)
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sequences' }, { status: 500 })
    }

    return NextResponse.json({ sequences })
  } catch (error: any) {
    console.error('Sequences fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id, id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, description, trigger_type, trigger_config, steps } = createSequenceSchema.parse(body)

    // Create sequence
    const { data: sequence, error: sequenceError } = await supabase
      .from('email_sequences')
      .insert({
        workspace_id: user.workspace_id,
        name,
        description,
        trigger_type,
        trigger_config,
        created_by: user.id,
      })
      .select()
      .single()

    if (sequenceError) {
      return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 })
    }

    // Create steps if provided
    if (steps.length > 0) {
      const stepsToInsert = steps.map((step, index) => ({
        sequence_id: sequence.id,
        step_number: index + 1,
        step_type: step.step_type,
        subject_template: step.subject_template,
        body_template: step.body_template,
        delay_hours: step.delay_hours,
        delay_type: step.delay_type,
        condition_config: step.condition_config,
      }))

      await supabase.from('email_sequence_steps').insert(stepsToInsert)
    }

    return NextResponse.json({ sequence }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Sequence creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
