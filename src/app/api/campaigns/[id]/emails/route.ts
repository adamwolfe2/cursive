// Campaign Emails API Routes
// GET /api/campaigns/[id]/emails - List emails for a campaign


import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ id: string }>
}

const querySchema = z.object({
  status: z.enum(['pending_approval', 'approved', 'sent', 'rejected', 'failed']).optional(),
  step: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId } = await context.params
    const { searchParams } = new URL(request.url)

    const params = querySchema.parse({
      status: searchParams.get('status') || undefined,
      step: searchParams.get('step') || undefined,
      limit: searchParams.get('limit') || 50,
      offset: searchParams.get('offset') || 0,
    })

    const supabase = await createClient()

    // Verify campaign belongs to user's workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id, workspace_id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('email_sends')
      .select(`
        *,
        lead:leads!lead_id(
          id,
          company_name,
          job_title,
          first_name,
          last_name
        ),
        template:email_templates!template_id(
          id,
          name
        )
      `, { count: 'estimated' })
      .eq('campaign_id', campaignId)
      .eq('workspace_id', user.workspace_id) // Defense-in-depth
      .order('created_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1)

    if (params.status) {
      query = query.eq('status', params.status)
    }

    if (params.step) {
      query = query.eq('step_number', params.step)
    }

    const { data, error, count } = await query

    if (error) {
      safeError('Failed to fetch emails:', error)
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count || 0,
        limit: params.limit,
        offset: params.offset,
      },
    })
  } catch (error) {
    safeError('Campaign emails error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
