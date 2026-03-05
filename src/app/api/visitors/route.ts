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
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(req: NextRequest) {
  try {
    // Fast auth: 1 network call (getUser validates JWT server-side)
    // Workspace ID is read from middleware-cached cookie — no extra DB query
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = req.cookies.get('x-workspace-id')?.value
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10) || 25), 100)
    const enrichmentFilter = searchParams.get('enrichment') // 'enriched' | 'unenriched' | null
    const dateRange = Math.min(Math.max(1, parseInt(searchParams.get('range') ?? '30', 10) || 30), 365)
    const offset = (page - 1) * limit

    const adminSupabase = createAdminClient()
    const since = new Date(Date.now() - dateRange * 86_400_000).toISOString()
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

    // Build main paginated query
    let query = adminSupabase
      .from('leads')
      .select(
        'id, first_name, last_name, full_name, email, phone, company_name, company_domain, job_title, city, state, country, intent_score_calculated, enrichment_status, created_at, source, linkedin_url',
        { count: 'exact' }
      )
      .eq('workspace_id', workspaceId)
      .or('source.ilike.%pixel%,source.ilike.%superpixel%')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (enrichmentFilter === 'enriched') {
      query = query.eq('enrichment_status', 'enriched')
    } else if (enrichmentFilter === 'unenriched') {
      query = query.neq('enrichment_status', 'enriched')
    }

    // Fire main query + all stats queries + pixel info in parallel
    const [
      visitorsResult,
      { count: totalCount },
      { count: enrichedCount },
      { count: thisWeekCount },
      { data: scoreData },
      { data: pixel },
    ] = await Promise.all([
      query,
      adminSupabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .or('source.ilike.%pixel%,source.ilike.%superpixel%')
        .gte('created_at', since),
      adminSupabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .or('source.ilike.%pixel%,source.ilike.%superpixel%')
        .gte('created_at', since)
        .eq('enrichment_status', 'enriched'),
      adminSupabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .or('source.ilike.%pixel%,source.ilike.%superpixel%')
        .gte('created_at', weekAgo),
      adminSupabase
        .from('leads')
        .select('intent_score_calculated')
        .eq('workspace_id', workspaceId)
        .or('source.ilike.%pixel%,source.ilike.%superpixel%')
        .gte('created_at', since)
        .not('intent_score_calculated', 'is', null)
        .limit(1000),
      adminSupabase
        .from('audiencelab_pixels')
        .select('pixel_id, domain, trial_status, trial_ends_at, is_active')
        .eq('workspace_id', workspaceId)
        .maybeSingle(),
    ])

    if (visitorsResult.error) throw visitorsResult.error

    const scores = (scoreData ?? []).map((l) => l.intent_score_calculated).filter((s): s is number => s !== null)
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const total = totalCount ?? 0
    const enriched = enrichedCount ?? 0
    const thisWeek = thisWeekCount ?? 0

    return NextResponse.json({
      visitors: visitorsResult.data ?? [],
      pagination: {
        total: visitorsResult.count ?? 0,
        page,
        limit,
        pages: Math.ceil((visitorsResult.count ?? 0) / limit),
      },
      stats: {
        total,
        this_week: thisWeek,
        enriched,
        avg_score: avgScore,
        match_rate: total > 0 ? Math.round((enriched / total) * 100) : 0,
      },
      pixel: pixel ?? null,
    })
  } catch (err: any) {
    safeError('[Visitors API]', err)
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 })
  }
}
