/**
 * GET /api/public/segment-search?q=...&type=...&category=...
 * Public (no auth) semantic search endpoint for the segment catalog.
 * Rate-limited by IP to prevent abuse.
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { safeError } from '@/lib/utils/log-sanitizer'

// Simple in-memory rate limiting per IP (resets on cold start, which is fine)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 15 // requests per window
const RATE_WINDOW_MS = 60_000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 300_000) // every 5 minutes

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

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: CORS_HEADERS }
    )
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const type = searchParams.get('type') ?? ''
  const category = searchParams.get('category') ?? ''
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10)))

  if (!q) {
    return NextResponse.json(
      { segments: [], total: 0, search_type: 'none', categories: [] },
      { headers: CORS_HEADERS }
    )
  }

  const admin = createAdminClient()

  // Fetch categories (cached by CDN)
  const categoriesPromise = admin
    .from('al_segment_catalog')
    .select('category')
    .order('category')
    .limit(500)

  // Try semantic search first (with 5s timeout so we fall back to keyword quickly)
  try {
    const semanticResult = await Promise.race([
      (async () => {
        const { embedText } = await import('@/lib/audiencelab/embeddings')
        const queryEmbedding = await embedText(q)

        const { data: results, error: rpcError } = await admin.rpc('match_segments', {
          query_embedding: queryEmbedding,
          match_threshold: 0.25,
          match_count: limit,
          filter_type: type || null,
          filter_category: category || null,
        })

        if (!rpcError && results && results.length > 0) return results
        return null
      })(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5_000)),
    ])

    if (semanticResult) {
      const { data: cats } = await categoriesPromise
      const categories = [...new Set((cats ?? []).map((c: { category: string }) => c.category).filter(Boolean))].sort()

      return NextResponse.json({
        segments: semanticResult,
        total: semanticResult.length,
        search_type: 'semantic',
        categories,
      }, { headers: CORS_HEADERS })
    }
  } catch (err: unknown) {
    safeError('[Public Segment Search] Semantic fallback:', err)
  }

  // Fallback to keyword search
  const term = sanitizeSearchTerm(q)
  let query = admin
    .from('al_segment_catalog')
    .select('segment_id, name, category, sub_category, description, type', { count: 'exact' })
    .or(`name.ilike.%${term}%,category.ilike.%${term}%,keywords.ilike.%${term}%`)

  if (type) query = query.eq('type', type)
  if (category) query = query.eq('category', category)
  query = query.order('name').limit(limit)

  const { data, error, count } = await query
  if (error) {
    safeError('[Public Segment Search] DB error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500, headers: CORS_HEADERS })
  }

  const { data: cats } = await categoriesPromise
  const categories = [...new Set((cats ?? []).map((c: { category: string }) => c.category).filter(Boolean))].sort()

  return NextResponse.json({
    segments: data ?? [],
    total: count ?? 0,
    search_type: 'keyword',
    categories,
  }, { headers: CORS_HEADERS })
}
