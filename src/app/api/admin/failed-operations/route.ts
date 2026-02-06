/**
 * Failed Operations API
 * Admin endpoints for managing failed operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFailedOperations } from '@/lib/monitoring/failed-operations'

/**
 * GET /api/admin/failed-operations
 * List failed operations with filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check - admin only
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const operationType = searchParams.get('type') as any
    const resolved = searchParams.get('resolved') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

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
    console.error('Failed to get failed operations:', error)
    return NextResponse.json({ error: 'Failed to get operations' }, { status: 500 })
  }
}
