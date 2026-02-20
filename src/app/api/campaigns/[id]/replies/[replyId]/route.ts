// Individual Campaign Reply API Routes
// GET /api/campaigns/[id]/replies/[replyId] - Get a single reply
// PATCH /api/campaigns/[id]/replies/[replyId] - Update reply status


import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ id: string; replyId: string }>
}

const updateSchema = z.object({
  status: z.enum(['new', 'reviewed', 'responded', 'ignored', 'archived']).optional(),
  review_notes: z.string().max(1000).optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId, replyId } = await context.params
    const supabase = await createClient()

    // Verify campaign belongs to user's workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch reply
    const { data: reply, error: replyError } = await supabase
      .from('email_replies')
      .select(`
        *,
        lead:leads!lead_id(
          id,
          first_name,
          last_name,
          company_name,
          job_title,
          email
        ),
        email_send:email_sends!email_send_id(
          id,
          subject,
          body_text,
          body_html
        )
      `)
      .eq('id', replyId)
      .eq('campaign_id', campaignId)
      .maybeSingle()

    if (replyError || !reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    return NextResponse.json({ data: reply })
  } catch (error) {
    safeError('Get reply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId, replyId } = await context.params
    const body = await request.json()
    const updates = updateSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign belongs to user's workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Add review metadata if marking as reviewed
    if (updates.status === 'reviewed' || updates.status === 'ignored') {
      updateData.reviewed_by = user.id
      updateData.reviewed_at = new Date().toISOString()
    }

    // Update reply
    const { data: updatedReply, error: updateError } = await supabase
      .from('email_replies')
      .update(updateData)
      .eq('id', replyId)
      .eq('campaign_id', campaignId)
      .select()
      .maybeSingle()

    if (updateError) {
      safeError('Failed to update reply:', updateError)
      return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedReply })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    safeError('Update reply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
