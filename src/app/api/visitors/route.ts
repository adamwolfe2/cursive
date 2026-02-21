/**
 * Website Visitors API
 * GET /api/visitors
 *
 * Returns pixel-identified leads for the current workspace,
 * with stats and pagination for the Website Visitors dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10) || 25), 100)
    const enrichmentFilter = searchParams.get('enrichment') // 'enriched' | 'unenriched' | null
    const dateRange = Math.min(Math.max(1, parseInt(searchParams.get('range') ?? '30', 10) || 30), 365) // days (1-365)
    const offset = (page - 1) * limit

    const adminSupabase = createAdminClient()
    const since = new Date(Date.now() - dateRange * 86_400_000).toISOString()

    // Build query for pixel-sourced leads
    let query = adminSupabase
      .from('leads')
      .select(
        'id, first_name, last_name, full_name, email, phone, company_name, company_domain, job_title, city, state, country, intent_score_calculated, enrichment_status, created_at, source, linkedin_url',
        { count: 'exact' }
      )
      .eq('workspace_id', user.workspace_id)
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

    // Aggregate stats via parallel count queries — avoids loading all rows into memory
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const [
      { count: totalCount },
      { count: enrichedCount },
      { count: thisWeekCount },
      { data: scoreData },
    ] = await Promise.all([
      adminSupabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .or('source.ilike.%pixel%,source.ilike.%superpixel%')
        .gte('created_at', since),
      adminSupabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .or('source.ilike.%pixel%,source.ilike.%superpixel%')
        .gte('created_at', since)
        .eq('enrichment_status', 'enriched'),
      adminSupabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .or('source.ilike.%pixel%,source.ilike.%superpixel%')
        .gte('created_at', weekAgo),
      adminSupabase
        .from('leads')
        .select('intent_score_calculated')
        .eq('workspace_id', user.workspace_id)
        .or('source.ilike.%pixel%,source.ilike.%superpixel%')
        .gte('created_at', since)
        .not('intent_score_calculated', 'is', null)
        .limit(1000),
    ])

    const scores = (scoreData ?? []).map((l) => l.intent_score_calculated).filter((s): s is number => s !== null)
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const total = totalCount ?? 0
    const enriched = enrichedCount ?? 0
    const thisWeek = thisWeekCount ?? 0

    // Pixel trial info
    const { data: pixel } = await adminSupabase
      .from('audiencelab_pixels')
      .select('pixel_id, domain, trial_status, trial_ends_at, is_active')
      .eq('workspace_id', user.workspace_id)
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
