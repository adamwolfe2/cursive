/**
 * Email Sequence Steps API
 * Create and manage steps within a sequence
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'


const createStepSchema = z.object({
  name: z.string().min(1).max(100),
  template_id: z.string().uuid().optional(),
  subject: z.string().max(200).optional(),
  body: z.string().optional(),
  delay_days: z.number().int().min(0).max(365).default(0),
  delay_hours: z.number().int().min(0).max(23).default(0),
  delay_minutes: z.number().int().min(0).max(59).default(0),
  conditions: z.record(z.any()).optional(),
})

// POST /api/email-sequences/[id]/steps - Add step to sequence
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sequenceId } = await params
    const body = await request.json()
    const validated = createStepSchema.parse(body)

    const supabase = await createClient()

    // Verify sequence ownership
    const { data: sequence } = await supabase
      .from('email_sequences')
      .select('id, status')
      .eq('id', sequenceId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    // Validate template exists if provided
    if (validated.template_id) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('id')
        .eq('id', validated.template_id)
        .eq('workspace_id', user.workspace_id)
        .maybeSingle()

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
    }

    // Validate that either template_id OR (subject + body) is provided
    if (!validated.template_id && (!validated.subject || !validated.body)) {
      return NextResponse.json(
        { error: 'Must provide either template_id or both subject and body' },
        { status: 400 }
      )
    }

    // Get next step order
    const { data: lastStep } = await supabase
      .from('email_sequence_steps')
      .select('step_order')
      .eq('sequence_id', sequenceId)
      .order('step_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (lastStep?.step_order ?? -1) + 1

    const { data: step, error } = await supabase
      .from('email_sequence_steps')
      .insert({
        sequence_id: sequenceId,
        template_id: validated.template_id,
        step_order: nextOrder,
        name: validated.name,
        subject: validated.subject,
        body: validated.body,
        delay_days: validated.delay_days,
        delay_hours: validated.delay_hours,
        delay_minutes: validated.delay_minutes,
        conditions: validated.conditions || {},
      })
      .select()
      .maybeSingle()

    if (error) {
      safeError('Failed to create email sequence step:', error)
      return NextResponse.json(
        { error: 'Failed to create step' },
        { status: 500 }
      )
    }

    return NextResponse.json({ step }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    safeError('Email sequence steps POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
