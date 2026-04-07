/**
 * GET /api/admin/lead-ingestion
 * Returns segments from al_segment_catalog and all workspaces for the admin Pull Leads UI.
 * Auth: requireAdmin (platform_admins or owner/admin role).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const db = createAdminClient()

    const search = request.nextUrl.searchParams.get('search') || ''
    const category = request.nextUrl.searchParams.get('category') || ''

    // Build segments query
    let segmentsQuery = db
      .from('al_segment_catalog')
      .select('segment_id, name, category, sub_category, type')
      .order('name')
      .limit(200)

    if (search.trim()) {
      segmentsQuery = segmentsQuery.textSearch('search_tsv', search.trim(), { type: 'websearch' })
    }

    if (category) {
      segmentsQuery = segmentsQuery.eq('category', category)
    }

    // Fetch segments, workspaces, and category list in parallel
    const [
      { data: segments, error: segError },
      { data: workspaces, error: wsError },
      { data: catRows },
    ] = await Promise.all([
      segmentsQuery,
      db.from('workspaces').select('id, name, slug').eq('is_suspended', false).order('name'),
      db.from('al_segment_catalog').select('category').limit(25000),
    ])

    if (segError) {
      return NextResponse.json({ error: segError.message }, { status: 500 })
    }

    if (wsError) {
      return NextResponse.json({ error: wsError.message }, { status: 500 })
    }

    const categories = [...new Set(catRows?.map(r => r.category) ?? [])].filter(Boolean).sort()

    return NextResponse.json({
      segments: segments ?? [],
      workspaces: workspaces ?? [],
      categories,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
