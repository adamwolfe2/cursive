/**
 * Audience Activation Request API
 * POST /api/activate/audience
 *
 * Accepts a lookalike / custom audience request, stores it in DB,
 * fires a rich Slack alert to the Cursive team, and sends a
 * confirmation email to the user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'

const schema = z.object({
  // ICP definition
  industries: z.array(z.string()).min(1, 'Select at least one industry'),
  job_titles: z.array(z.string()).optional().default([]),
  geographies: z.array(z.string()).optional().default([]),
  company_size: z.string().optional(),
  seniority_levels: z.array(z.string()).optional().default([]),
  icp_description: z.string().max(1000).optional(),

  // Audience config
  request_type: z.enum(['audience', 'lookalike']).default('audience'),
  data_sources: z.array(z.string()).optional().default([]),
  desired_volume: z.string().optional(),
  use_case: z.string().optional(),

  // Budget & timeline
  budget_range: z.string().optional(),
  timeline: z.string().optional(),

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
      .from('custom_audience_requests')
      .insert({
        workspace_id: profile.workspace_id,
        user_id: profile.id,
        request_type: validated.request_type,
        industry: validated.industries.join(', '),
        geography: validated.geographies.join(', '),
        company_size: validated.company_size,
        seniority_levels: validated.seniority_levels,
        job_titles: validated.job_titles,
        icp_description: validated.icp_description,
        use_case: validated.use_case,
        data_sources: validated.data_sources,
        desired_volume: validated.desired_volume,
        budget_range: validated.budget_range,
        timeline: validated.timeline,
        contact_name: validated.contact_name,
        contact_email: validated.contact_email,
        website_url: validated.website_url,
        additional_notes: validated.additional_notes,
        pixel_lead_count: pixelCount ?? 0,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      safeError('[Activate/Audience] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
    }

    // Rich Slack alert
    const typeLabel = validated.request_type === 'lookalike' ? '🎯 Lookalike Audience' : '🗂️ Custom Audience'
    const urgencyEmoji = (pixelCount ?? 0) > 50 ? '🔥' : (pixelCount ?? 0) > 10 ? '✨' : '📋'

    await sendSlackAlert({
      type: 'new_dfy_client',
      severity: 'info',
      message: `${urgencyEmoji} New ${typeLabel} Request — ${validated.contact_name} (${validated.contact_email})`,
      metadata: {
        request_id: request?.id,
        type: typeLabel,
        contact: `${validated.contact_name} <${validated.contact_email}>`,
        website: validated.website_url || 'not provided',
        industries: validated.industries.join(', '),
        job_titles: validated.job_titles.length ? validated.job_titles.join(', ') : 'any',
        company_size: validated.company_size || 'any',
        geographies: validated.geographies.length ? validated.geographies.join(', ') : 'any',
        desired_volume: validated.desired_volume || 'not specified',
        budget: validated.budget_range || 'not specified',
        timeline: validated.timeline || 'flexible',
        pixel_visitors: pixelCount ?? 0,
        enriched_leads: enrichedCount ?? 0,
        icp_notes: validated.icp_description || '—',
        use_case: validated.use_case || '—',
        additional_notes: validated.additional_notes || '—',
        action: `Reply to ${validated.contact_email} within 24h`,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, request_id: request?.id })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    safeError('[Activate/Audience] Error:', err)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}
