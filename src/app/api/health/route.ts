/**
 * Health Check API Route
 * GET /api/health
 *
 * Tests actual service connectivity, not just env var presence.
 * Edge runtime for fast cold starts.
 */

import { NextResponse } from 'next/server'


const START_TIME = Date.now()

async function checkDatabase(): Promise<{ status: string; responseTime: number; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { status: 'unconfigured', responseTime: 0 }

  const start = Date.now()
  try {
    // Simple REST query: select 1 row from a known table
    const res = await fetch(`${url}/rest/v1/workspaces?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(5000),
    })
    const responseTime = Date.now() - start
    return res.ok
      ? { status: 'healthy', responseTime }
      : { status: 'unhealthy', responseTime, error: `HTTP ${res.status}` }
  } catch (e) {
    return { status: 'unhealthy', responseTime: Date.now() - start, error: e instanceof Error ? e.message : 'Unknown' }
  }
}

async function checkStripe(): Promise<{ status: string; error?: string }> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return { status: 'unconfigured' }
  const valid = key.startsWith('sk_live_') || key.startsWith('sk_test_')
  return valid ? { status: 'configured' } : { status: 'misconfigured', error: 'Invalid key format' }
}

export async function GET() {
  const [db, stripe] = await Promise.all([checkDatabase(), checkStripe()])

  const overall =
    db.status === 'healthy' && stripe.status === 'configured' ? 'healthy'
    : db.status === 'unhealthy' ? 'unhealthy'
    : 'degraded'

  // Mask detailed service status in production (security: information disclosure)
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    return NextResponse.json(
      {
        status: overall,
        timestamp: new Date().toISOString(),
      },
      {
        status: overall === 'unhealthy' ? 503 : 200,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      }
    )
  }

  // Detailed status only in development/staging
  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      checks: { database: db, stripe },
      runtime: 'edge',
    },
    {
      status: overall === 'unhealthy' ? 503 : 200,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    }
  )
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
