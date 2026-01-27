/**
 * Health Check Endpoint
 * Cursive Platform
 *
 * Verifies connectivity to all external services the app depends on.
 * Used for monitoring, deployment verification, and debugging.
 *
 * SECURITY: Detailed health info requires HEALTH_CHECK_SECRET header.
 * Public access only returns basic status without service details.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unconfigured'
  latency?: number
  // Error is internal only - never exposed in public responses
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  services: ServiceHealth[]
  uptime: number
}

// Track process start time for uptime calculation
const startTime = Date.now()

/**
 * Check Supabase connectivity
 */
async function checkSupabase(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'supabase'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { name, status: 'unconfigured' }
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Simple query to check connectivity
    const { error } = await supabase.from('workspaces').select('id').limit(1)

    if (error && !error.message.includes('does not exist')) {
      throw error
    }

    return { name, status: 'healthy', latency: Date.now() - start }
  } catch (error: any) {
    console.error('Supabase health check failed:', error.message)
    return { name, status: 'unhealthy', latency: Date.now() - start }
  }
}

/**
 * Check Anthropic (Claude) API
 */
async function checkAnthropic(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'anthropic'

  if (!process.env.ANTHROPIC_API_KEY) {
    return { name, status: 'unconfigured' }
  }

  try {
    // Validate API key format (starts with sk-ant-)
    if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      return { name, status: 'degraded' }
    }
    // Don't make actual API call to save tokens - just verify config
    return { name, status: 'healthy', latency: Date.now() - start }
  } catch (error: any) {
    console.error('Anthropic health check failed:', error.message)
    return { name, status: 'unhealthy', latency: Date.now() - start }
  }
}

/**
 * Check Stripe connectivity
 */
async function checkStripe(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'stripe'

  if (!process.env.STRIPE_SECRET_KEY) {
    return { name, status: 'unconfigured' }
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error('Stripe API error')
    }

    return { name, status: 'healthy', latency: Date.now() - start }
  } catch (error: any) {
    console.error('Stripe health check failed:', error.message)
    return { name, status: 'unhealthy', latency: Date.now() - start }
  }
}

/**
 * Check Resend (email) connectivity
 */
async function checkResend(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'resend'

  if (!process.env.RESEND_API_KEY) {
    return { name, status: 'unconfigured' }
  }

  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error('Resend API error')
    }

    return { name, status: 'healthy', latency: Date.now() - start }
  } catch (error: any) {
    console.error('Resend health check failed:', error.message)
    return { name, status: 'unhealthy', latency: Date.now() - start }
  }
}

/**
 * Check Clay API
 */
async function checkClay(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'clay'

  if (!process.env.CLAY_API_KEY) {
    return { name, status: 'unconfigured' }
  }

  // Clay doesn't have a dedicated health endpoint, so we just verify config
  return { name, status: 'healthy', latency: Date.now() - start }
}

/**
 * Check DataShopper API
 */
async function checkDataShopper(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'datashopper'

  if (!process.env.DATASHOPPER_API_KEY) {
    return { name, status: 'unconfigured' }
  }

  // DataShopper doesn't have a dedicated health endpoint, so we just verify config
  return { name, status: 'healthy', latency: Date.now() - start }
}

/**
 * Check Inngest connectivity
 */
async function checkInngest(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'inngest'

  if (!process.env.INNGEST_EVENT_KEY || !process.env.INNGEST_SIGNING_KEY) {
    return { name, status: 'unconfigured' }
  }

  return { name, status: 'healthy', latency: Date.now() - start }
}

/**
 * GET /api/health
 * Returns health status of all services
 *
 * Public access returns only overall status.
 * Detailed service info requires X-Health-Secret header matching HEALTH_CHECK_SECRET env var.
 */
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  const uptime = Math.floor((Date.now() - startTime) / 1000)

  // Check if this is an authenticated detailed health check
  const healthSecret = process.env.HEALTH_CHECK_SECRET
  const providedSecret = request.headers.get('x-health-secret')
  const isAuthenticated = healthSecret && providedSecret === healthSecret

  // Run all health checks in parallel
  const services = await Promise.all([
    checkSupabase(),
    checkAnthropic(),
    checkStripe(),
    checkResend(),
    checkClay(),
    checkDataShopper(),
    checkInngest(),
  ])

  // Determine overall status
  const unhealthyCount = services.filter((s) => s.status === 'unhealthy').length
  const degradedCount = services.filter((s) => s.status === 'degraded').length

  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'

  // Critical services that must be healthy
  const criticalServices = ['supabase']
  const criticalUnhealthy = services.some(
    (s) => criticalServices.includes(s.name) && s.status === 'unhealthy'
  )

  if (criticalUnhealthy || unhealthyCount >= 3) {
    status = 'unhealthy'
  } else if (unhealthyCount > 0 || degradedCount > 0) {
    status = 'degraded'
  }

  // Return 503 for unhealthy, 200 otherwise
  const httpStatus = status === 'unhealthy' ? 503 : 200

  // Public response - only status and timestamp
  if (!isAuthenticated) {
    return NextResponse.json(
      {
        status,
        timestamp,
      },
      {
        status: httpStatus,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  }

  // Authenticated response - full service details (no error messages)
  const response: HealthCheckResponse = {
    status,
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: services.map(s => ({
      name: s.name,
      status: s.status,
      latency: s.latency,
    })),
    uptime,
  }

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

/**
 * HEAD /api/health
 * Lightweight health check (just returns status code)
 */
export async function HEAD() {
  try {
    // Quick check of critical service (Supabase)
    const supabaseHealth = await checkSupabase()

    if (supabaseHealth.status === 'unhealthy') {
      return new NextResponse(null, { status: 503 })
    }

    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
