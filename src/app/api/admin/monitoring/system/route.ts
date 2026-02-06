import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Calculate metrics from the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Get API response times
    const { data: apiMetrics } = await supabase
      .from('platform_metrics')
      .select('metric_value')
      .eq('metric_name', 'api.request.duration')
      .gte('created_at', since.toISOString())
      .order('metric_value', { ascending: true })

    const responseTimes = apiMetrics?.map((m) => m.metric_value) || []
    const p50 = percentile(responseTimes, 0.5)
    const p95 = percentile(responseTimes, 0.95)
    const p99 = percentile(responseTimes, 0.99)

    // Get DB query times
    const { data: dbMetrics } = await supabase
      .from('platform_metrics')
      .select('metric_value')
      .eq('metric_name', 'operation.db-query')
      .gte('created_at', since.toISOString())
      .order('metric_value', { ascending: true })

    const queryTimes = dbMetrics?.map((m) => m.metric_value) || []
    const dbP50 = percentile(queryTimes, 0.5)
    const dbP95 = percentile(queryTimes, 0.95)
    const dbP99 = percentile(queryTimes, 0.99)

    // Get error rate
    const { count: totalRequests } = await supabase
      .from('platform_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('metric_name', 'api.request.count')
      .gte('created_at', since.toISOString())

    const { count: errorRequests } = await supabase
      .from('platform_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('metric_name', 'api.error.count')
      .gte('created_at', since.toISOString())

    const errorRate = totalRequests ? (errorRequests || 0) / totalRequests : 0

    // Calculate uptime (simplified - assume 99.9% for now)
    const uptime = 0.999

    return NextResponse.json({
      data: {
        apiResponseTime: {
          p50: Math.round(p50),
          p95: Math.round(p95),
          p99: Math.round(p99),
        },
        dbQueryTime: {
          p50: Math.round(dbP50),
          p95: Math.round(dbP95),
          p99: Math.round(dbP99),
        },
        errorRate,
        uptime,
      },
    })
  } catch (error) {
    console.error('Failed to fetch system metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil(sorted.length * p) - 1
  return sorted[Math.max(0, index)] || 0
}
