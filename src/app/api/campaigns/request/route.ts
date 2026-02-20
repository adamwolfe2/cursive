/**
 * Campaign Request API
 * POST /api/campaigns/request
 * Submit a campaign request for EmailBison team to review
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'

const campaignRequestSchema = z.object({
  company_name: z.string().min(2),
  contact_name: z.string().min(2),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),

  target_industry: z.string().min(1),
  target_company_size: z.string().min(1),
  target_job_titles: z.string().min(5),
  geographic_focus: z.string().min(2),

  campaign_goal: z.string().min(1),
  monthly_budget: z.string().min(1),
  expected_volume: z.string().min(1),

  unique_value_prop: z.string().min(20),
  pain_points_addressed: z.string().min(20),

  current_challenges: z.string().optional(),
  timeline: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate input
    const body = await request.json()
    const data = campaignRequestSchema.parse(body)

    // 3. Save to database
    const supabase = await createClient()
    const { data: campaignRequest, error } = await supabase
      .from('campaign_requests')
      .insert({
        workspace_id: user.workspace_id,
        user_id: user.id,
        status: 'pending',

        // Contact info
        company_name: data.company_name,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || null,

        // ICP details
        target_industry: data.target_industry,
        target_company_size: data.target_company_size,
        target_job_titles: data.target_job_titles,
        geographic_focus: data.geographic_focus,

        // Campaign goals
        campaign_goal: data.campaign_goal,
        monthly_budget: data.monthly_budget,
        expected_volume: data.expected_volume,

        // Value prop
        unique_value_prop: data.unique_value_prop,
        pain_points_addressed: data.pain_points_addressed,
        current_challenges: data.current_challenges || null,

        // Timeline
        timeline: data.timeline,
      })
      .select('id, workspace_id, status, company_name, contact_name, contact_email, target_industry, campaign_goal, timeline, created_at')
      .maybeSingle()

    if (error) {
      safeError('[Campaign Request] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create campaign request' },
        { status: 500 }
      )
    }

    // 4. Notify EmailBison team via Inngest
    await inngest.send({ name: 'emailbison/campaign-request', data: { ...campaignRequest } } as any)

    return NextResponse.json({
      success: true,
      data: campaignRequest,
    })
  } catch (error: any) {
    safeError('[Campaign Request] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit campaign request' },
      { status: 500 }
    )
  }
}
