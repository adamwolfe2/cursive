/**
 * Email Sequences API
 * CRUD for automated email sequences
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'


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
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const includeSteps = searchParams.get('include_steps') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const offset = (page - 1) * limit

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
          : '*',
        { count: 'exact' }
      )
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: sequences, count, error } = await query

    if (error) {
      safeError('Failed to fetch email sequences:', error)
      return handleApiError(error)
    }

    return NextResponse.json({
      sequences,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        has_more: offset + limit < (count ?? 0),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/email-sequences - Create sequence
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
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
        return badRequest('Sequence name already exists')
      }
      safeError('Failed to create email sequence:', error)
      return handleApiError(error)
    }

    return NextResponse.json({ sequence }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
