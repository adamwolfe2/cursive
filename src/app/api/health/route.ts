/**
 * Health Check API
 * Provides system health status for monitoring and alerting
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  }

  try {
    // Check database connectivity
    const supabase = createAdminClient()
    const { error: dbError } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)
      .single()

    if (dbError && dbError.code !== 'PGRST116') {
      // PGRST116 = no rows, which is fine for health check
      checks.database = false
      return NextResponse.json(
        {
          status: 'unhealthy',
          checks,
          responseTime: Date.now() - startTime,
        },
        { status: 503 }
      )
    }

    checks.database = true

    return NextResponse.json({
      status: 'healthy',
      checks,
      responseTime: Date.now() - startTime,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        checks,
        error: error.message,
        responseTime: Date.now() - startTime,
      },
      { status: 503 }
    )
  }
}
