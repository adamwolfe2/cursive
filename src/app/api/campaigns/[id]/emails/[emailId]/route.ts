// Individual Campaign Email API Routes
// PATCH /api/campaigns/[id]/emails/[emailId] - Update an email
// GET /api/campaigns/[id]/emails/[emailId] - Get a single email

export const runtime = 'edge'

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/monitoring/logger'

interface RouteContext {
  params: Promise<{ id: string; emailId: string }>
}

const updateSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  body_text: z.string().min(1).optional(),
  body_html: z.string().min(1).optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId, emailId } = await context.params
    const supabase = await createClient()

    // Verify campaign belongs to user's workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch email
    const { data: email, error: emailError } = await supabase
      .from('email_sends')
      .select(`
        *,
        lead:leads!lead_id(
          id,
          company_name,
          job_title,
          first_name,
          last_name,
          email
        ),
        template:email_templates!template_id(
          id,
          name,
          tone,
          structure
        )
      `)
      .eq('id', emailId)
      .eq('campaign_id', campaignId)
      .single()

    if (emailError || !email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    return NextResponse.json({ data: email })
  } catch (error) {
    logger.error('Get email error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId, emailId } = await context.params
    const body = await request.json()
    const updates = updateSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign belongs to user's workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify email exists and is editable (pending approval only)
    const { data: existingEmail, error: emailError } = await supabase
      .from('email_sends')
      .select('id, status')
      .eq('id', emailId)
      .eq('campaign_id', campaignId)
      .single()

    if (emailError || !existingEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    if (existingEmail.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Only pending emails can be edited' },
        { status: 400 }
      )
    }

    // Update email
    const { data: updatedEmail, error: updateError } = await supabase
      .from('email_sends')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        composition_metadata: {
          edited_at: new Date().toISOString(),
          edited_by: user.id,
        },
      })
      .eq('id', emailId)
      .eq('campaign_id', campaignId)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update email', { error: updateError instanceof Error ? updateError.message : String(updateError), emailId })
      return NextResponse.json({ error: 'Failed to update email' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedEmail })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    logger.error('Update email error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
