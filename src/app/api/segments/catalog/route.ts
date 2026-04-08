import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { safeError } from '@/lib/utils/log-sanitizer'

const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
} as const

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  // SECURITY: Use getUser() for server-side JWT verification (not getSession which trusts local cache)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const type = searchParams.get('type') ?? ''
  const category = searchParams.get('category') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '24', 10)))

  const admin = createAdminClient()

  // Fetch categories for filter UI (lightweight, always needed)
  const categoriesPromise = admin
    .from('al_segment_catalog')
    .select('category')
    .order('category')
    .limit(500)

  // If there's a search query, try semantic search first
  if (q) {
    try {
      const { embedText } = await import('@/lib/audiencelab/embeddings')
      const queryEmbedding = await embedText(q)

      const { data: semanticResults, error: rpcError } = await admin.rpc('match_segments', {
        query_embedding: queryEmbedding,
        match_threshold: 0.25,
        match_count: perPage,
        filter_type: type || null,
        filter_category: category || null,
      })

      if (!rpcError && semanticResults && semanticResults.length > 0) {
        const { data: cats } = await categoriesPromise
        const categories = [...new Set((cats ?? []).map((c: { category: string }) => c.category).filter(Boolean))].sort()

        return NextResponse.json({
          segments: semanticResults,
          total: semanticResults.length,
          page: 1,
          per_page: perPage,
          total_pages: 1,
          categories,
          search_type: 'semantic',
        }, { headers: CACHE_HEADERS })
      }

      // If semantic search returned nothing, fall through to ilike
    } catch (err: unknown) {
      // Semantic search failed (no embeddings yet, or OpenAI down) — fall back to ilike
      safeError('[Segments Catalog] Semantic search fallback:', err)
    }
  }

  // Fallback: ilike keyword search (also used for browsing without query)
  let query = admin
    .from('al_segment_catalog')
    .select('segment_id, name, category, sub_category, description, type', { count: 'exact' })

  if (q) {
    const term = sanitizeSearchTerm(q)
    query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%,keywords.ilike.%${term}%`)
  }
  if (type) {
    query = query.eq('type', type)
  }
  if (category) {
    query = query.eq('category', category)
  }

  const from = (page - 1) * perPage
  query = query.order('name').range(from, from + perPage - 1)

  const { data, error, count } = await query
  if (error) {
    safeError('[Segments Catalog] Database error:', error)
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 })
  }

  const { data: cats } = await categoriesPromise
  const categories = [...new Set((cats ?? []).map((c: { category: string }) => c.category).filter(Boolean))].sort()

  return NextResponse.json({
    segments: data ?? [],
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
    categories,
    search_type: q ? 'keyword' : 'browse',
  }, { headers: CACHE_HEADERS })
}
