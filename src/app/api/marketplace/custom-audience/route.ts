import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, workspace_id, email, full_name')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = customAudienceSchema.parse(body)

    // Insert into custom_audience_requests table
    const { data: requestData, error: insertError } = await supabase
      .from('custom_audience_requests')
      .insert({
        workspace_id: userData.workspace_id,
        user_id: userData.id,
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
      .single()

    if (insertError) {
      console.error('Failed to create custom audience request:', insertError)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    // Send Slack notification (best-effort, don't fail the request)
    try {
      const slackWebhookUrl = process.env.SLACK_SALES_WEBHOOK_URL
      if (slackWebhookUrl) {
        await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `New Custom Audience Request`,
            blocks: [
              {
                type: 'header',
                text: { type: 'plain_text', text: 'New Custom Audience Request' },
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*User:* ${userData.full_name || userData.email}` },
                  { type: 'mrkdwn', text: `*Industry:* ${validated.industry}` },
                  { type: 'mrkdwn', text: `*Geography:* ${validated.geography}` },
                  { type: 'mrkdwn', text: `*Volume:* ${validated.volume} leads` },
                  { type: 'mrkdwn', text: `*Company Size:* ${validated.companySize}` },
                  { type: 'mrkdwn', text: `*Seniority:* ${validated.seniorityLevels.join(', ')}` },
                ],
              },
            ],
          }),
        })
      }
    } catch (slackError) {
      console.error('Failed to send Slack notification:', slackError)
    }

    return NextResponse.json({
      message: 'Custom audience request submitted',
      id: requestData.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }
    console.error('Custom audience request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
