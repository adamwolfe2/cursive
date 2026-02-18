/**
 * Email Sequence Step Detail API
 * Update, delete, reorder individual steps
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'


const updateStepSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  template_id: z.string().uuid().nullable().optional(),
  subject: z.string().max(200).optional(),
  body: z.string().optional(),
  delay_days: z.number().int().min(0).max(365).optional(),
  delay_hours: z.number().int().min(0).max(23).optional(),
  delay_minutes: z.number().int().min(0).max(59).optional(),
  conditions: z.record(z.any()).optional(),
  step_order: z.number().int().min(0).optional(),
})

// PATCH /api/email-sequences/[id]/steps/[stepId] - Update step
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sequenceId, stepId } = await params
    const body = await request.json()
    const validated = updateStepSchema.parse(body)

    const supabase = await createClient()

    // Verify sequence ownership via step
    const { data: existingStep } = await supabase
      .from('email_sequence_steps')
      .select(
        `
        id,
        step_order,
        email_sequences!inner (
          id,
          workspace_id
        )
      `
      )
      .eq('id', stepId)
      .eq('sequence_id', sequenceId)
      .single()

    if (!existingStep || (existingStep.email_sequences as any).workspace_id !== user.workspace_id) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // If reordering, handle swap
    if (validated.step_order !== undefined && validated.step_order !== existingStep.step_order) {
      const { data: targetStep } = await supabase
        .from('email_sequence_steps')
        .select('id')
        .eq('sequence_id', sequenceId)
        .eq('step_order', validated.step_order)
        .single()

      if (targetStep) {
        // Swap orders
        await supabase
          .from('email_sequence_steps')
          .update({ step_order: existingStep.step_order })
          .eq('id', targetStep.id)
      }
    }

    // Validate template if provided
    if (validated.template_id) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('id')
        .eq('id', validated.template_id)
        .eq('workspace_id', user.workspace_id)
        .single()

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
    }

    const { data: step, error } = await supabase
      .from('email_sequence_steps')
      .update(validated)
      .eq('id', stepId)
      .select()
      .single()

    if (error) {
      safeError('Failed to update email sequence step:', error)
      return NextResponse.json(
        { error: 'Failed to update step' },
        { status: 500 }
      )
    }

    return NextResponse.json({ step })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    safeError('Email sequence step PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/email-sequences/[id]/steps/[stepId] - Delete step
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sequenceId, stepId } = await params
    const supabase = await createClient()

    // Verify sequence ownership via step
    const { data: existingStep } = await supabase
      .from('email_sequence_steps')
      .select(
        `
        id,
        step_order,
        email_sequences!inner (
          id,
          workspace_id,
          status
        )
      `
      )
      .eq('id', stepId)
      .eq('sequence_id', sequenceId)
      .single()

    if (!existingStep || (existingStep.email_sequences as any).workspace_id !== user.workspace_id) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // Prevent deleting steps from active sequences
    if ((existingStep.email_sequences as any).status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete steps from active sequence. Pause it first.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('email_sequence_steps')
      .delete()
      .eq('id', stepId)

    if (error) {
      safeError('Failed to delete email sequence step:', error)
      return NextResponse.json(
        { error: 'Failed to delete step' },
        { status: 500 }
      )
    }

    // Reorder remaining steps
    const { data: remainingSteps } = await supabase
      .from('email_sequence_steps')
      .select('id')
      .eq('sequence_id', sequenceId)
      .order('step_order', { ascending: true })

    if (remainingSteps) {
      for (let i = 0; i < remainingSteps.length; i++) {
        await supabase
          .from('email_sequence_steps')
          .update({ step_order: i })
          .eq('id', remainingSteps[i].id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('Email sequence step DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
