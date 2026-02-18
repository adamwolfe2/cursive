/**
 * Outbound Campaign Activation Request API
 * POST /api/activate/campaign
 *
 * Accepts an outbound campaign request, stores in DB,
 * fires a rich Slack alert to the Cursive team.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'

const schema = z.object({
  // Campaign brief
  campaign_goal: z.enum(['book_demos', 'close_sales', 'grow_list', 'nurture', 'other']),
  target_audience: z.enum(['website_visitors', 'custom_audience', 'both', 'upload']),
  value_prop: z.string().min(10, 'Tell us your offer in at least 10 characters').max(1000),
  message_tone: z.enum(['professional', 'casual', 'bold', 'friendly']),

  // Targeting
  industries: z.array(z.string()).optional().default([]),
  geographies: z.array(z.string()).optional().default([]),
  job_titles: z.array(z.string()).optional().default([]),
  company_size: z.string().optional(),
  monthly_volume: z.string().optional(),

  // Copy
  has_existing_copy: z.boolean().default(false),
  existing_copy: z.string().max(3000).optional(),

  // Budget & timeline
  budget_range: z.string().optional(),

  // Contact
  contact_name: z.string().min(1),
  contact_email: z.string().email(),
  website_url: z.string().optional(),

  additional_notes: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, workspace_id, full_name, email')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 })
    }

    const body = await req.json()
    const validated = schema.parse(body)

    const adminSupabase = createAdminClient()

    // Count their pixel visitors + enriched leads for context
    const { count: pixelCount } = await adminSupabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', profile.workspace_id)
      .or('source.ilike.%pixel%,source.ilike.%superpixel%')

    const { count: enrichedCount } = await adminSupabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', profile.workspace_id)
      .eq('enrichment_status', 'enriched')

    // Store request
    const { data: request, error: insertError } = await adminSupabase
      .from('outbound_campaign_requests')
      .insert({
        workspace_id: profile.workspace_id,
        user_id: profile.id,
        contact_name: validated.contact_name,
        contact_email: validated.contact_email,
        website_url: validated.website_url,
        campaign_goal: validated.campaign_goal,
        target_audience: validated.target_audience,
        value_prop: validated.value_prop,
        message_tone: validated.message_tone,
        industries: validated.industries,
        geographies: validated.geographies,
        job_titles: validated.job_titles,
        company_size: validated.company_size,
        monthly_volume: validated.monthly_volume,
        has_existing_copy: validated.has_existing_copy,
        existing_copy: validated.existing_copy,
        budget_range: validated.budget_range,
        additional_notes: validated.additional_notes,
        pixel_visitors_count: pixelCount ?? 0,
        enriched_leads_count: enrichedCount ?? 0,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      safeError('[Activate/Campaign] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
    }

    const goalLabels: Record<string, string> = {
      book_demos: 'Book Demo Calls',
      close_sales: 'Close Sales',
      grow_list: 'Grow Email List',
      nurture: 'Nurture Pipeline',
      other: 'Other',
    }
    const audienceLabels: Record<string, string> = {
      website_visitors: 'Website Visitors',
      custom_audience: 'Custom Audience',
      both: 'Visitors + Custom',
      upload: 'Uploaded List',
    }

    const hotLeadEmoji = (enrichedCount ?? 0) > 20 ? '🔥' : (pixelCount ?? 0) > 0 ? '✨' : '📧'

    await sendSlackAlert({
      type: 'new_dfy_client',
      severity: 'info',
      message: `${hotLeadEmoji} New Outbound Campaign Request — ${validated.contact_name} (${validated.contact_email})`,
      metadata: {
        request_id: request?.id,
        contact: `${validated.contact_name} <${validated.contact_email}>`,
        website: validated.website_url || 'not provided',
        goal: goalLabels[validated.campaign_goal] || validated.campaign_goal,
        audience: audienceLabels[validated.target_audience] || validated.target_audience,
        tone: validated.message_tone,
        monthly_volume: validated.monthly_volume || 'not specified',
        budget: validated.budget_range || 'not specified',
        industries: validated.industries.length ? validated.industries.join(', ') : 'any',
        job_titles: validated.job_titles.length ? validated.job_titles.join(', ') : 'any',
        pixel_visitors: pixelCount ?? 0,
        enriched_leads: enrichedCount ?? 0,
        value_prop: validated.value_prop,
        has_copy: validated.has_existing_copy ? 'Yes' : 'No — needs copy written',
        additional_notes: validated.additional_notes || '—',
        action: `Reply to ${validated.contact_email} within 24h to scope campaign`,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, request_id: request?.id })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    safeError('[Activate/Campaign] Error:', err)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}
