import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { safeError } from '@/lib/utils/log-sanitizer'

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

  // Also fetch distinct categories for filter UI (lightweight)
  const { data: cats } = await admin
    .from('al_segment_catalog')
    .select('category')
    .order('category')
    .limit(500)

  const categories = [...new Set((cats ?? []).map((c) => c.category).filter(Boolean))].sort()

  return NextResponse.json({
    segments: data ?? [],
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
    categories,
  })
}
