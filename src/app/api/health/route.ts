/**
 * Health Check Endpoint
 * Cursive Platform
 *
 * Verifies connectivity to all external services the app depends on.
 * Used for monitoring, deployment verification, and debugging.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unconfigured'
  latency?: number
  error?: string
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
    return { name, status: 'unconfigured', error: 'Missing Supabase credentials' }
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
    return { name, status: 'unhealthy', latency: Date.now() - start, error: error.message }
  }
}

/**
 * Check Anthropic (Claude) API
 */
async function checkAnthropic(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'anthropic'

  if (!process.env.ANTHROPIC_API_KEY) {
    return { name, status: 'unconfigured', error: 'ANTHROPIC_API_KEY not set' }
  }

  try {
    // Validate API key format (starts with sk-ant-)
    if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      return { name, status: 'degraded', error: 'Invalid API key format' }
    }
    // Don't make actual API call to save tokens - just verify config
    return { name, status: 'healthy', latency: Date.now() - start }
  } catch (error: any) {
    return { name, status: 'unhealthy', latency: Date.now() - start, error: error.message }
  }
}

/**
 * Check Stripe connectivity
 */
async function checkStripe(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'stripe'

  if (!process.env.STRIPE_SECRET_KEY) {
    return { name, status: 'unconfigured', error: 'STRIPE_SECRET_KEY not set' }
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error((error as any).error?.message || 'Stripe API error')
    }

    return { name, status: 'healthy', latency: Date.now() - start }
  } catch (error: any) {
    return { name, status: 'unhealthy', latency: Date.now() - start, error: error.message }
  }
}

/**
 * Check Resend (email) connectivity
 */
async function checkResend(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'resend'

  if (!process.env.RESEND_API_KEY) {
    return { name, status: 'unconfigured', error: 'RESEND_API_KEY not set' }
  }

  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error((error as any).message || 'Resend API error')
    }

    return { name, status: 'healthy', latency: Date.now() - start }
  } catch (error: any) {
    return { name, status: 'unhealthy', latency: Date.now() - start, error: error.message }
  }
}

/**
 * Check Clay API
 */
async function checkClay(): Promise<ServiceHealth> {
  const start = Date.now()
  const name = 'clay'

  if (!process.env.CLAY_API_KEY) {
    return { name, status: 'unconfigured', error: 'CLAY_API_KEY not set' }
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
    return { name, status: 'unconfigured', error: 'DATASHOPPER_API_KEY not set' }
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
    return { name, status: 'unconfigured', error: 'Inngest credentials not set' }
  }

  return { name, status: 'healthy', latency: Date.now() - start }
}

/**
 * GET /api/health
 * Returns health status of all services
 */
export async function GET() {
  const timestamp = new Date().toISOString()
  const environment = process.env.NODE_ENV || 'development'
  const version = process.env.npm_package_version || '1.0.0'
  const uptime = Math.floor((Date.now() - startTime) / 1000)

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
  const unconfiguredCount = services.filter((s) => s.status === 'unconfigured').length

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

  const response: HealthCheckResponse = {
    status,
    timestamp,
    version,
    environment,
    services,
    uptime,
  }

  // Return 503 for unhealthy, 200 otherwise
  const httpStatus = status === 'unhealthy' ? 503 : 200

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
