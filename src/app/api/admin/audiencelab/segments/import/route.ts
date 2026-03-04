/**
 * POST /api/admin/audiencelab/segments/import
 * Batched upsert of segment catalog rows. Idempotent — safe to re-run.
 * Body: { rows: SegmentRow[] }
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

interface SegmentRow {
  segment_id: string
  category: string
  sub_category: string | null
  name: string
  description: string | null
  keywords: string | null
  type: string
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminRole()

    const body = await request.json()
    const rows: SegmentRow[] = body.rows

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'rows array required' }, { status: 400 })
    }

    if (rows.length > 200) {
      return NextResponse.json({ error: 'Max 200 rows per batch' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { error, count } = await adminClient
      .from('al_segment_catalog')
      .upsert(
        rows.map(r => ({
          segment_id:   String(r.segment_id).trim(),
          category:     r.category?.trim() ?? '',
          sub_category: r.sub_category?.trim() ?? null,
          name:         r.name?.trim() ?? '',
          description:  r.description?.trim() ?? null,
          keywords:     r.keywords?.trim() ?? null,
          type:         r.type?.trim() ?? 'B2C',
        })),
        { onConflict: 'segment_id', count: 'exact' }
      )

    if (error) throw error

    return NextResponse.json({ success: true, count: count ?? rows.length })
  } catch (error) {
    safeError('[Admin Segments Import]', error)
    return handleApiError(error)
  }
}
