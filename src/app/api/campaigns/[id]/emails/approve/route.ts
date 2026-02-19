// Campaign Emails Approve API Routes
// POST /api/campaigns/[id]/emails/approve - Bulk approve emails


import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/monitoring/logger'
import { inngest } from '@/inngest/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

const approveSchema = z.object({
  email_ids: z.array(z.string().uuid()).min(1).max(100),
})

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId } = await context.params
    const body = await request.json()
    const { email_ids } = approveSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign belongs to user's workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id, workspace_id, status')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify emails belong to this campaign and are pending approval
    const { data: emails, error: emailsError } = await supabase
      .from('email_sends')
      .select('id, lead_id')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending_approval')
      .in('id', email_ids)

    if (emailsError) {
      logger.error('Failed to fetch emails', { error: emailsError instanceof Error ? emailsError.message : String(emailsError), campaignId })
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
    }

    if (!emails || emails.length === 0) {
      return NextResponse.json(
        { error: 'No pending emails found to approve' },
        { status: 400 }
      )
    }

    const validIds = emails.map((e) => e.id)

    // Update status to approved
    const { error: updateError } = await supabase
      .from('email_sends')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .in('id', validIds)

    if (updateError) {
      logger.error('Failed to approve emails', { error: updateError instanceof Error ? updateError.message : String(updateError), campaignId })
      return NextResponse.json({ error: 'Failed to approve emails' }, { status: 500 })
    }

    // Get campaign_lead_ids for the approved emails
    const leadIds = emails.map((e) => e.lead_id)
    const { data: campaignLeads } = await supabase
      .from('campaign_leads')
      .select('id, lead_id')
      .eq('campaign_id', campaignId)
      .in('lead_id', leadIds)

    const leadToCampaignLead = new Map(
      (campaignLeads || []).map((cl) => [cl.lead_id, cl.id])
    )

    const approvedWithCampaignLead = emails.filter((email) => leadToCampaignLead.has(email.lead_id))
    if (approvedWithCampaignLead.length > 0) {
      await inngest.send(approvedWithCampaignLead.map((email) => ({
        name: 'campaign/email-approved' as const,
        data: {
          email_send_id: email.id,
          campaign_lead_id: leadToCampaignLead.get(email.lead_id)!,
          workspace_id: user.workspace_id,
        },
      })))
    }

    return NextResponse.json({
      success: true,
      approved_count: validIds.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    logger.error('Approve emails error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
