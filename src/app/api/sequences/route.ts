/**
 * Email Sequences API
 * GET /api/sequences - List sequences
 * POST /api/sequences - Create sequence
 */


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, getRequestIdentifier } from '@/lib/middleware/rate-limiter'

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
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

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
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Rate limit: sequence creation — 30/hour per user
    const rateLimitResponse = await withRateLimit(req, 'sequence-create', getRequestIdentifier(req, user.id))
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()

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
      .select('id, workspace_id, name, description, trigger_type, trigger_config, status, created_by, created_at')
      .maybeSingle()

    if (sequenceError) {
      return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 })
    }

    if (!sequence) {
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
  } catch (error) {
    return handleApiError(error)
  }
}
