/**
 * Audience Labs Events API
 *
 * GET /api/audiencelab/events?start=&end=&source=&q=&page=&limit=
 * Paginated list of raw audiencelab_events.
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
  source: z.enum(['superpixel', 'audiencesync', 'export']).optional(),
  processed: z.enum(['true', 'false']).optional(),
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

    // Parse query params
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = QuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid params', details: parsed.error.issues }, { status: 400 })
    }

    const { start, end, source, processed, q, page, limit } = parsed.data
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('audiencelab_events')
      .select('id, received_at, source, event_type, hem_sha256, profile_id, ip_address, processed, lead_id, identity_id, error, created_at', { count: 'exact' })
      .eq('workspace_id', user.workspace_id)
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (start) query = query.gte('received_at', start)
    if (end) query = query.lte('received_at', end)
    if (source) query = query.eq('source', source)
    if (processed) query = query.eq('processed', processed === 'true')
    if (q) {
      const term = sanitizeSearchTerm(q)
      query = query.or(`hem_sha256.ilike.%${term}%,profile_id.ilike.%${term}%,event_type.ilike.%${term}%`)
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