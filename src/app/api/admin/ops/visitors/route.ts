/**
 * GET /api/admin/ops/visitors
 * Platform pixel visitor leads for prospecting
 * Reads leads where workspace_id = PLATFORM_WORKSPACE_ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole()

    const platformWorkspaceId = process.env.PLATFORM_WORKSPACE_ID || process.env.NEXT_PUBLIC_PLATFORM_WORKSPACE_ID

    if (!platformWorkspaceId) {
      return NextResponse.json({
        visitors: [],
        setup_required: true,
        message: 'Set PLATFORM_WORKSPACE_ID env var to the workspace UUID for Cursive\'s own meetcursive.com pixel account.',
      })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const minScore = parseInt(searchParams.get('min_score') || '0', 10)
    const enrichmentFilter = searchParams.get('enrichment') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 25
    const offset = (page - 1) * limit

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const adminClient = createAdminClient()

    let query = adminClient
      .from('leads')
      .select(
        'id, first_name, last_name, full_name, email, phone, company_name, company_domain, job_title, city, state, intent_score_calculated, enrichment_status, created_at, source, linkedin_url',
        { count: 'exact' }
      )
      .eq('workspace_id', platformWorkspaceId)
      .ilike('source', '%pixel%')
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (minScore > 0) {
      query = query.gte('intent_score_calculated', minScore)
    }

    if (enrichmentFilter === 'enriched') {
      query = query.eq('enrichment_status', 'enriched')
    } else if (enrichmentFilter === 'unenriched') {
      query = query.neq('enrichment_status', 'enriched')
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      safeError('[ops/visitors] DB error:', error)
      return NextResponse.json({ error: 'Failed to load visitors' }, { status: 500 })
    }

    return NextResponse.json({
      visitors: data || [],
      pagination: {
        total: count ?? 0,
        page,
        limit,
        pages: Math.ceil((count ?? 0) / limit),
      },
      setup_required: false,
    })
  } catch (error) {
    safeError('[ops/visitors] Error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to load visitors' }, { status: 500 })
  }
}
