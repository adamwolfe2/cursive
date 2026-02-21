
import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { inngest } from '@/inngest/client'
import { createClient } from '@/lib/supabase/server'

const customAudienceSchema = z.object({
  industry: z.string().min(1),
  geography: z.string().min(1),
  companySize: z.string().min(1),
  seniorityLevels: z.array(z.string()).min(1),
  intentSignals: z.string().optional(),
  volume: z.string().min(1),
  additionalNotes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = customAudienceSchema.parse(body)

    const supabase = await createClient()

    // Insert into custom_audience_requests table
    const { data: requestData, error: insertError } = await supabase
      .from('custom_audience_requests')
      .insert({
        workspace_id: user.workspace_id,
        user_id: user.id,
        industry: validated.industry,
        geography: validated.geography,
        company_size: validated.companySize,
        seniority_levels: validated.seniorityLevels,
        intent_signals: validated.intentSignals || null,
        desired_volume: validated.volume,
        additional_notes: validated.additionalNotes || null,
        status: 'pending',
      })
      .select()
      .maybeSingle()

    if (insertError || !requestData) {
      safeError('Failed to create custom audience request:', insertError)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    // Send Slack notification (best-effort, don't fail the request)
    try {
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
      if (slackWebhookUrl) {
        await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: '🎯 New Custom Audience Request',
            blocks: [
              {
                type: 'header',
                text: { type: 'plain_text', text: '🎯 New Custom Audience Request' },
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*User:* ${user.full_name || user.email}` },
                  { type: 'mrkdwn', text: `*Workspace:* ${user.workspace_id}` },
                  { type: 'mrkdwn', text: `*Industry:* ${validated.industry}` },
                  { type: 'mrkdwn', text: `*Geography:* ${validated.geography}` },
                  { type: 'mrkdwn', text: `*Volume:* ${validated.volume} leads` },
                  { type: 'mrkdwn', text: `*Company Size:* ${validated.companySize}` },
                ],
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Seniority:* ${validated.seniorityLevels.join(', ')}`,
                },
              },
              ...(validated.intentSignals ? [{
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Intent Signals:*\n${validated.intentSignals}`,
                },
              }] : []),
              ...(validated.additionalNotes ? [{
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Additional Notes:*\n${validated.additionalNotes}`,
                },
              }] : []),
              {
                type: 'divider',
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: '👀 View in Admin' },
                    url: `https://leads.meetcursive.com/admin/custom-audiences`,
                    style: 'primary',
                  },
                ],
              },
            ],
          }),
        })
      }
    } catch (slackError) {
      safeError('Failed to send Slack notification:', slackError)
    }

    // Fire Inngest event for follow-up workflow (confirmation email + 24h reminder)
    try {
      await inngest.send({
        name: 'marketplace/custom-audience-requested',
        data: {
          request_id: requestData.id,
          workspace_id: user.workspace_id,
          user_id: user.id,
          user_email: user.email,
          industry: validated.industry,
          volume: validated.volume,
        },
      })
    } catch (inngestError) {
      safeError('[Custom Audience] Failed to queue follow-up workflow:', inngestError)
      // Non-fatal: request is already saved to DB
    }

    return NextResponse.json({
      message: 'Custom audience request submitted',
      id: requestData.id,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
