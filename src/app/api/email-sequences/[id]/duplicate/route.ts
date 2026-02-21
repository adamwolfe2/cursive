/**
 * Duplicate Email Sequence API
 * Clone an existing sequence (metadata + all steps) as a new draft
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'


// POST /api/email-sequences/[id]/duplicate
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Fetch original sequence with steps
    const { data: original, error: fetchError } = await supabase
      .from('email_sequences')
      .select(
        `
        *,
        email_sequence_steps (
          step_order,
          name,
          template_id,
          subject,
          body,
          delay_days,
          delay_hours,
          delay_minutes,
          conditions
        )
      `
      )
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    // Create the duplicate sequence as a draft
    const { data: newSequence, error: createError } = await supabase
      .from('email_sequences')
      .insert({
        workspace_id: user.workspace_id,
        user_id: user.id,
        name: `${original.name} (Copy)`,
        description: original.description,
        trigger_type: original.trigger_type,
        trigger_config: original.trigger_config || {},
        status: 'draft',
      })
      .select()
      .maybeSingle()

    if (createError || !newSequence) {
      safeError('Failed to duplicate email sequence:', createError)
      return NextResponse.json({ error: 'Failed to duplicate sequence' }, { status: 500 })
    }

    // Copy steps if the original has any
    const steps = original.email_sequence_steps ?? []
    if (steps.length > 0) {
      const stepInserts = steps.map(
        (step: {
          step_order: number
          name: string
          template_id: string | null
          subject: string | null
          body: string | null
          delay_days: number
          delay_hours: number
          delay_minutes: number
          conditions: Record<string, unknown>
        }) => ({
          sequence_id: newSequence.id,
          step_order: step.step_order,
          name: step.name,
          template_id: step.template_id,
          subject: step.subject,
          body: step.body,
          delay_days: step.delay_days,
          delay_hours: step.delay_hours,
          delay_minutes: step.delay_minutes,
          conditions: step.conditions || {},
        })
      )

      const { error: stepsError } = await supabase
        .from('email_sequence_steps')
        .insert(stepInserts)

      if (stepsError) {
        // Roll back the sequence if steps fail to insert
        await supabase
          .from('email_sequences')
          .delete()
          .eq('id', newSequence.id)
          .eq('workspace_id', user.workspace_id)

        safeError('Failed to duplicate sequence steps:', stepsError)
        return NextResponse.json({ error: 'Failed to duplicate sequence steps' }, { status: 500 })
      }
    }

    return NextResponse.json(
      { sequence: { id: newSequence.id, name: newSequence.name } },
      { status: 201 }
    )
  } catch (error) {
    safeError('Email sequence duplicate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
