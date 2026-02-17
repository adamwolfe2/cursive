/**
 * Website Visitors API
 * GET /api/visitors
 *
 * Returns pixel-identified leads for the current workspace,
 * with stats and pagination for the Website Visitors dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 100)
    const enrichmentFilter = searchParams.get('enrichment') // 'enriched' | 'unenriched' | null
    const dateRange = searchParams.get('range') ?? '30' // days
    const offset = (page - 1) * limit

    const adminSupabase = createAdminClient()
    const since = new Date(Date.now() - parseInt(dateRange, 10) * 86_400_000).toISOString()

    // Build query for pixel-sourced leads
    let query = adminSupabase
      .from('leads')
      .select(
        'id, first_name, last_name, full_name, email, phone, company_name, job_title, city, state, country, intent_score_calculated, enrichment_status, created_at, source, linkedin_url',
        { count: 'exact' }
      )
      .eq('workspace_id', profile.workspace_id)
      .or('source.ilike.%pixel%,source.ilike.%superpixel%')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (enrichmentFilter === 'enriched') {
      query = query.eq('enrichment_status', 'enriched')
    } else if (enrichmentFilter === 'unenriched') {
      query = query.neq('enrichment_status', 'enriched')
    }

    const { data: visitors, count, error } = await query
    if (error) throw error

    // Aggregate stats for the same time range (all pixel leads, unfiltered)
    const { data: statsData } = await adminSupabase
      .from('leads')
      .select('enrichment_status, intent_score_calculated, created_at')
      .eq('workspace_id', profile.workspace_id)
      .or('source.ilike.%pixel%,source.ilike.%superpixel%')
      .gte('created_at', since)

    const allLeads = statsData ?? []
    const enrichedCount = allLeads.filter((l) => l.enrichment_status === 'enriched').length
    const scores = allLeads.map((l) => l.intent_score_calculated).filter((s): s is number => s !== null)
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    // This week count
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const thisWeek = allLeads.filter((l) => l.created_at >= weekAgo).length

    // Pixel trial info
    const { data: pixel } = await adminSupabase
      .from('audiencelab_pixels')
      .select('pixel_id, domain, trial_status, trial_ends_at, is_active')
      .eq('workspace_id', profile.workspace_id)
      .maybeSingle()

    return NextResponse.json({
      visitors: visitors ?? [],
      pagination: {
        total: count ?? 0,
        page,
        limit,
        pages: Math.ceil((count ?? 0) / limit),
      },
      stats: {
        total: allLeads.length,
        this_week: thisWeek,
        enriched: enrichedCount,
        avg_score: avgScore,
        match_rate: allLeads.length > 0 ? Math.round((enrichedCount / allLeads.length) * 100) : 0,
      },
      pixel: pixel ?? null,
    })
  } catch (err: any) {
    console.error('[Visitors API]', err)
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 })
  }
}
