/**
 * Email Sequence Enrollment API
 * Enroll leads in sequences
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'


const enrollLeadsSchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(1000),
})

// POST /api/email-sequences/[id]/enroll - Enroll leads
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
    const validated = enrollLeadsSchema.parse(body)

    const supabase = await createClient()

    // Verify sequence ownership and status
    const { data: sequence } = await supabase
      .from('email_sequences')
      .select('id, status')
      .eq('id', sequenceId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    if (sequence.status !== 'active') {
      return NextResponse.json(
        { error: 'Can only enroll leads in active sequences' },
        { status: 400 }
      )
    }

    // Verify leads exist and belong to workspace
    const { data: leads } = await supabase
      .from('leads')
      .select('id, email')
      .eq('workspace_id', user.workspace_id)
      .in('id', validated.lead_ids)

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: 'No valid leads found' }, { status: 404 })
    }

    // Use the helper function to enroll leads
    const results = {
      enrolled: 0,
      already_enrolled: 0,
      failed: 0,
    }

    for (const lead of leads) {
      try {
        const { error } = await supabase.rpc('enroll_lead_in_sequence', {
          p_sequence_id: sequenceId,
          p_lead_id: lead.id,
        })

        if (error) {
          if (error.code === '23505') {
            // Unique constraint violation - already enrolled
            results.already_enrolled++
          } else {
            safeError('Failed to enroll lead:', error)
            results.failed++
          }
        } else {
          results.enrolled++
        }
      } catch (err) {
        safeError('Error enrolling lead:', err)
        results.failed++
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total_processed: leads.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    safeError('Email sequence enroll POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/email-sequences/[id]/enroll - Get enrollments for sequence
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sequenceId } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    const supabase = await createClient()

    // Verify sequence ownership
    const { data: sequence } = await supabase
      .from('email_sequences')
      .select('id')
      .eq('id', sequenceId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    let query = supabase
      .from('email_sequence_enrollments')
      .select(
        `
        id,
        status,
        current_step_order,
        next_send_at,
        emails_sent,
        emails_opened,
        emails_clicked,
        emails_replied,
        enrolled_at,
        completed_at,
        unsubscribed_at,
        leads (
          id,
          email,
          first_name,
          last_name,
          company_name
        ),
        email_sequence_steps (
          id,
          step_order,
          name
        )
      `
      )
      .eq('sequence_id', sequenceId)
      .order('enrolled_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: enrollments, error } = await query

    if (error) {
      safeError('Failed to fetch enrollments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ enrollments })
  } catch (error) {
    safeError('Email sequence enroll GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
