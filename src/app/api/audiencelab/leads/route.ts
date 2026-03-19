/**
 * Audience Labs Leads API
 *
 * GET /api/audiencelab/leads?start=&end=&q=&page=&limit=
 * Paginated list of leads sourced from Audience Labs.
 * Requires authenticated user + workspace membership.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'

const QuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = QuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid params', details: parsed.error.issues }, { status: 400 })
    }

    const { start, end, q, page, limit } = parsed.data
    const offset = (page - 1) * limit

    let query = supabase
      .from('leads')
      .select('id, email, first_name, last_name, company_name, company_domain, job_title, phone, source, intent_score, delivery_status, created_at, updated_at', { count: 'exact' })
      .eq('workspace_id', user.workspace_id)
      .eq('source', 'audiencelab')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (start) query = query.gte('created_at', start)
    if (end) query = query.lte('created_at', end)
    if (q) {
      const term = sanitizeSearchTerm(q)
      query = query.or(`email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,company_name.ilike.%${term}%`)
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
    return handleApiError(error)
  }
}
