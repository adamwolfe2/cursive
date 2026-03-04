/**
 * GET /api/admin/audiencelab/segments/stats
 * Returns accurate segment catalog stats using service role (bypasses Supabase row cap).
 */

export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'

export async function GET() {
  try {
    await requireAdminRole()
    const db = createAdminClient()

    const [
      { count: total },
      { count: b2b },
      { data: typeRows },
      { data: catRows },
    ] = await Promise.all([
      db.from('al_segment_catalog').select('*', { count: 'exact', head: true }),
      db.from('al_segment_catalog').select('*', { count: 'exact', head: true }).eq('type', 'B2B'),
      db.from('al_segment_catalog').select('type').limit(25000),
      db.from('al_segment_catalog').select('category').limit(25000),
    ])

    const types = [...new Set(typeRows?.map(r => r.type) ?? [])].filter(Boolean).sort()
    const categoryList = [...new Set(catRows?.map(r => r.category) ?? [])].filter(Boolean).sort()

    return NextResponse.json({
      total: total ?? 0,
      b2b: b2b ?? 0,
      b2c: (total ?? 0) - (b2b ?? 0),
      categories: categoryList.length,
      types,
      categoryList,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
