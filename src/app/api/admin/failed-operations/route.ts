/**
 * Failed Operations API
 * Admin endpoints for managing failed operations
 */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFailedOperations } from '@/lib/monitoring/failed-operations'
import { safeParseInt } from '@/lib/utils/parse-number'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * GET /api/admin/failed-operations
 * List failed operations with filters
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Verify platform admin access
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()

    const supabase = await createClient()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const operationType = searchParams.get('type') as any
    const resolved = searchParams.get('resolved') === 'true'
    const limit = safeParseInt(searchParams.get('limit'), {
      min: 1,
      max: 1000,
      fallback: 100,
    })
    const offset = safeParseInt(searchParams.get('offset'), {
      min: 0,
      fallback: 0,
    })

    // Get operations
    const operations = await getFailedOperations({
      operationType: operationType || undefined,
      resolved,
      limit,
      offset,
    })

    return NextResponse.json({
      operations,
      count: operations.length,
    })
  } catch (error) {
    safeError('Failed to get failed operations:', error)
    return NextResponse.json({ error: 'Failed to get operations' }, { status: 500 })
  }
}
