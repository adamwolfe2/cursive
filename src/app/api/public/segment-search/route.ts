/**
 * GET /api/public/segment-search?q=...&type=...&category=...
 * Public (no auth) search endpoint for the segment catalog.
 * Rate-limited by IP to prevent abuse.
 *
 * Strategy: keyword search first (fast, reliable), then try semantic
 * search with a tight timeout. Returns whichever succeeds.
 */

export const runtime = 'nodejs'
export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { safeError } from '@/lib/utils/log-sanitizer'
import { checkRateLimit } from '@/lib/middleware/rate-limiter'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'read', 60)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: CORS_HEADERS }
    )
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q')?.trim() ?? '').slice(0, 500)
  const type = searchParams.get('type') ?? ''
  const category = searchParams.get('category') ?? ''
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10)))

  if (!q) {
    return NextResponse.json(
      { segments: [], total: 0, search_type: 'none', categories: [] },
      { headers: CORS_HEADERS }
    )
  }

  try {
    const admin = createAdminClient()

    // ── Keyword search (fast, always works) ──────────────────────
    const term = sanitizeSearchTerm(q)
    let keywordQuery = admin
      .from('al_segment_catalog')
      .select('segment_id, name, category, sub_category, description, type', { count: 'exact' })
      .or(`name.ilike.%${term}%,category.ilike.%${term}%,keywords.ilike.%${term}%`)

    if (type) keywordQuery = keywordQuery.eq('type', type)
    if (category) keywordQuery = keywordQuery.eq('category', category)
    keywordQuery = keywordQuery.order('name').limit(limit)

    const { data, error, count } = await keywordQuery

    if (error) {
      safeError('[Public Segment Search] DB error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500, headers: CORS_HEADERS })
    }

    // ── Try semantic search with AbortController (non-blocking) ──
    let segments = data ?? []
    let searchType: 'semantic' | 'keyword' = 'keyword'

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4_000)

      const { embedText } = await import('@/lib/audiencelab/embeddings')
      const queryEmbedding = await embedText(q, controller.signal)

      clearTimeout(timeout)

      if (!controller.signal.aborted) {
        const { data: semanticResults, error: rpcError } = await admin.rpc('match_segments', {
          query_embedding: queryEmbedding,
          match_threshold: 0.25,
          match_count: limit,
          filter_type: type || null,
          filter_category: category || null,
        })

        if (!rpcError && semanticResults && semanticResults.length > 0) {
          segments = semanticResults
          searchType = 'semantic'
        }
      }
    } catch {
      // Semantic search failed — use keyword results (already fetched)
    }

    return NextResponse.json({
      segments,
      total: searchType === 'keyword' ? (count ?? segments.length) : segments.length,
      search_type: searchType,
      categories: [],
    }, { headers: CORS_HEADERS })
  } catch (err: unknown) {
    safeError('[Public Segment Search] Fatal error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500, headers: CORS_HEADERS })
  }
}
