/**
 * Sequence Enrollment API
 * POST /api/sequences/[id]/enroll - Enroll leads in sequence
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

const enrollSchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(1000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params
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

    // Verify sequence exists and belongs to workspace
    const { data: sequence } = await supabase
      .from('email_sequences')
      .select('id, is_active')
      .eq('id', sequenceId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    if (!sequence.is_active) {
      return NextResponse.json({ error: 'Sequence is not active' }, { status: 400 })
    }

    const body = await req.json()
    const { lead_ids } = enrollSchema.parse(body)

    // Verify leads belong to workspace
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .in('id', lead_ids)
      .eq('workspace_id', user.workspace_id)

    const validLeadIds = leads?.map((l) => l.id) || []

    if (validLeadIds.length === 0) {
      return NextResponse.json({ error: 'No valid leads found' }, { status: 400 })
    }

    // Trigger batch enrollment via Inngest
    await inngest.send({
      name: 'sequence/batch-enroll',
      data: {
        sequence_id: sequenceId,
        lead_ids: validLeadIds,
        workspace_id: user.workspace_id,
      },
    })

    return NextResponse.json({
      success: true,
      enrolled: validLeadIds.length,
      sequence_id: sequenceId,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Sequence enrollment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
