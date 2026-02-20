/**
 * Audience Labs Identities API
 *
 * GET /api/audiencelab/identities?q=&page=&limit=
 * Search and list normalized identity profiles.
 * Requires authenticated user + workspace membership.
 */


import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { safeError } from '@/lib/utils/log-sanitizer'

const QuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace' }, { status: 403 })
    }

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = QuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid params', details: parsed.error.issues }, { status: 400 })
    }

    const { q, page, limit } = parsed.data
    const offset = (page - 1) * limit

    let query = supabase
      .from('audiencelab_identities')
      .select('id, profile_id, uid, hem_sha256, primary_email, personal_emails, business_emails, phones, first_name, last_name, company_name, company_domain, job_title, city, state, email_validation_status, deliverability_score, visit_count, first_seen_at, last_seen_at, lead_id, created_at', { count: 'exact' })
      .eq('workspace_id', userData.workspace_id)
      .order('last_seen_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (q) {
      const term = sanitizeSearchTerm(q)
      query = query.or(`primary_email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,company_name.ilike.%${term}%,profile_id.ilike.%${term}%`)
    }

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    safeError('[AL Identities API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
