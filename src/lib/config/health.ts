/**
 * Health Check Utilities
 * OpenInfo Platform
 *
 * System health monitoring and diagnostic utilities.
 */

// ============================================
// TYPES
// ============================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface ServiceHealth {
  name: string
  status: HealthStatus
  latencyMs?: number
  message?: string
  lastCheck: Date
}

export interface SystemHealth {
  status: HealthStatus
  timestamp: Date
  version: string
  uptime: number
  services: ServiceHealth[]
  memory?: {
    used: number
    total: number
    percentage: number
  }
}

// ============================================
// HEALTH CHECK FUNCTIONS
// ============================================

/**
 * Check Supabase connection health
 */
export async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const name = 'Supabase'
  const start = performance.now()

  try {
    // Make a simple auth status check
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
      {
        method: 'GET',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      }
    )

    const latencyMs = performance.now() - start

    if (response.ok) {
      return {
        name,
        status: latencyMs > 1000 ? 'degraded' : 'healthy',
        latencyMs,
        lastCheck: new Date(),
      }
    }

    return {
      name,
      status: 'unhealthy',
      latencyMs,
      message: `HTTP ${response.status}`,
      lastCheck: new Date(),
    }
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latencyMs: performance.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastCheck: new Date(),
    }
  }
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const name = 'Database'
  const start = performance.now()

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        method: 'HEAD',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      }
    )

    const latencyMs = performance.now() - start

    return {
      name,
      status: response.ok ? (latencyMs > 500 ? 'degraded' : 'healthy') : 'unhealthy',
      latencyMs,
      lastCheck: new Date(),
    }
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latencyMs: performance.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastCheck: new Date(),
    }
  }
}

/**
 * Check external API health (generic)
 */
export async function checkExternalApiHealth(
  name: string,
  url: string,
  options?: {
    method?: string
    headers?: Record<string, string>
    timeout?: number
  }
): Promise<ServiceHealth> {
  const start = performance.now()
  const controller = new AbortController()
  const timeout = options?.timeout || 5000

  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: options?.method || 'HEAD',
      headers: options?.headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latencyMs = performance.now() - start

    return {
      name,
      status: response.ok ? 'healthy' : 'degraded',
      latencyMs,
      message: response.ok ? undefined : `HTTP ${response.status}`,
      lastCheck: new Date(),
    }
  } catch (error) {
    clearTimeout(timeoutId)

    return {
      name,
      status: 'unhealthy',
      latencyMs: performance.now() - start,
      message: error instanceof Error ? error.message : 'Request failed',
      lastCheck: new Date(),
    }
  }
}

// ============================================
// SYSTEM HEALTH
// ============================================

const startTime = Date.now()

/**
 * Get full system health status
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const services = await Promise.all([
    checkSupabaseHealth(),
    checkDatabaseHealth(),
  ])

  // Calculate overall status
  const statuses = services.map(s => s.status)
  let overallStatus: HealthStatus = 'healthy'

  if (statuses.includes('unhealthy')) {
    overallStatus = 'unhealthy'
  } else if (statuses.includes('degraded')) {
    overallStatus = 'degraded'
  }

  // Get memory usage (Node.js only)
  let memory: SystemHealth['memory']
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    memory = {
      used: usage.heapUsed,
      total: usage.heapTotal,
      percentage: (usage.heapUsed / usage.heapTotal) * 100,
    }
  }

  return {
    status: overallStatus,
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Date.now() - startTime,
    services,
    memory,
  }
}

// ============================================
// HEALTH CHECK ENDPOINT HELPER
// ============================================

/**
 * Format health check response for API endpoint
 */
export function formatHealthResponse(health: SystemHealth): {
  status: number
  body: object
} {
  const statusCode =
    health.status === 'healthy' ? 200 :
    health.status === 'degraded' ? 200 :
    503

  return {
    status: statusCode,
    body: {
      status: health.status,
      timestamp: health.timestamp.toISOString(),
      version: health.version,
      uptime: health.uptime,
      services: health.services.map(s => ({
        name: s.name,
        status: s.status,
        latencyMs: s.latencyMs ? Math.round(s.latencyMs) : undefined,
        message: s.message,
      })),
      memory: health.memory ? {
        usedMb: Math.round(health.memory.used / 1024 / 1024),
        totalMb: Math.round(health.memory.total / 1024 / 1024),
        percentage: Math.round(health.memory.percentage),
      } : undefined,
    },
  }
}

// ============================================
// READINESS & LIVENESS
// ============================================

/**
 * Simple liveness check (is the app running?)
 */
export function livenessCheck(): { alive: true } {
  return { alive: true }
}

/**
 * Readiness check (is the app ready to serve traffic?)
 */
export async function readinessCheck(): Promise<{
  ready: boolean
  checks: Record<string, boolean>
}> {
  const [supabase, database] = await Promise.all([
    checkSupabaseHealth(),
    checkDatabaseHealth(),
  ])

  const checks = {
    supabase: supabase.status !== 'unhealthy',
    database: database.status !== 'unhealthy',
  }

  return {
    ready: Object.values(checks).every(Boolean),
    checks,
  }
}

// ============================================
// DIAGNOSTIC UTILITIES
// ============================================

/**
 * Get diagnostic information for debugging
 */
export function getDiagnostics(): object {
  return {
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime ? process.uptime() : undefined,
    memoryUsage: process.memoryUsage ? {
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      external: `${Math.round(process.memoryUsage().external / 1024 / 1024)} MB`,
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
    } : undefined,
    timestamp: new Date().toISOString(),
  }
}
