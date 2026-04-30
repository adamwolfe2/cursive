/**
 * Extension / Clay provider API guard.
 *
 * Wraps bearer auth, per-workspace daily spend cap, rate limiting, and
 * forensic usage logging for the /api/ext/* endpoints.
 *
 * Context: these endpoints are the Clay-compatible enrichment provider
 * surface. They're exposed to any authenticated workspace API key scoped
 * appropriately (`ext:lookup`, `ext:company`, `ext:verify`, or `*`).
 *
 * Cost protection (lessons from the $135 Vercel bill incident):
 *   - Per-workspace daily cap on total ext:* calls, enforced via
 *     api_usage_log row count in the last 24 hours.
 *   - Per-route per-workspace minute limit via existing rate-limiter.
 *   - Every call writes one api_usage_log row for forensic trail.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateBearer,
  BearerAuthError,
  bearerAuthErrorResponse,
  type BearerAuthResult,
} from '@/lib/middleware/bearer-api-auth'
import { withRateLimit, type RateLimitType } from '@/lib/middleware/rate-limiter'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

// ─── Daily cost cap ────────────────────────────────────────────────────────
// Hard ceiling on billable ext:* calls per workspace per rolling 24h window.
// Set conservatively. Can be overridden per-workspace by setting
// `daily_ext_cap` in workspace_settings in future; defaults to this.
const DEFAULT_DAILY_EXT_CAP = Number(process.env.EXT_DAILY_CAP_PER_WORKSPACE ?? '500')

interface ExtGuardOptions {
  /** Required workspace API key scope, e.g. "ext:lookup". */
  requiredScope: string
  /** Endpoint label written to api_usage_log (e.g. "ext:lookup"). */
  endpointLabel: string
  /**
   * Rate limit tier to apply per call. Both the outer cap and this per-route
   * tier apply. Use 'lead-enrich' for enrichment calls (30/min/workspace).
   */
  rateLimitTier: RateLimitType
}

export interface ExtGuardContext {
  auth: BearerAuthResult
  workspaceId: string
  userId: string
  startedAt: number
}

type ExtHandler = (
  req: NextRequest,
  ctx: ExtGuardContext
) => Promise<{ status: number; body: unknown }>

/**
 * Check whether a workspace is under its daily cost cap for ext:* calls.
 * Returns { allowed, currentCount, cap }.
 */
async function checkDailyCap(workspaceId: string): Promise<{
  allowed: boolean
  currentCount: number
  cap: number
}> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count, error } = await admin
    .from('api_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .like('endpoint', 'ext:%')
    .eq('status_code', 200)
    .gte('created_at', since)

  if (error) {
    // Fail closed — if we can't count, don't let the workspace continue.
    // This is the exact failure mode that caused the $135 incident: we'd
    // rather have one noisy error than a runaway bill.
    safeError('[ext-guard] Daily cap check failed:', error)
    return { allowed: false, currentCount: -1, cap: DEFAULT_DAILY_EXT_CAP }
  }

  const currentCount = count ?? 0
  return {
    allowed: currentCount < DEFAULT_DAILY_EXT_CAP,
    currentCount,
    cap: DEFAULT_DAILY_EXT_CAP,
  }
}

/**
 * Fire-and-forget usage log write. Never throws — logging must not block
 * the request path.
 */
async function logExtUsage(params: {
  workspaceId: string
  userId: string
  endpoint: string
  statusCode: number
  responseTimeMs: number
  req: NextRequest
  requestSize: number
}) {
  try {
    const admin = createAdminClient()
    const forwarded = params.req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : null
    await admin.from('api_usage_log').insert({
      workspace_id: params.workspaceId,
      user_id: params.userId,
      endpoint: params.endpoint,
      method: 'POST',
      status_code: params.statusCode,
      response_time_ms: params.responseTimeMs,
      ip_address: ip,
      user_agent: params.req.headers.get('user-agent'),
      request_size_bytes: params.requestSize,
    })
  } catch (err) {
    safeError('[ext-guard] api_usage_log insert failed:', err)
  }
}

/**
 * Wrap an ext API handler with the full guard stack.
 *
 * Usage:
 *   export const POST = withExtGuard(
 *     { requiredScope: 'ext:lookup', endpointLabel: 'ext:lookup', rateLimitTier: 'lead-enrich' },
 *     async (req, ctx) => {
 *       const body = await req.json()
 *       const result = await enrich({ filter: body })
 *       return { status: 200, body: { data: sanitize(result) } }
 *     }
 *   )
 */
export function withExtGuard(options: ExtGuardOptions, handler: ExtHandler) {
  return async function POST(req: NextRequest): Promise<NextResponse> {
    const startedAt = performance.now()
    let auth: BearerAuthResult
    try {
      auth = await authenticateBearer(req, options.requiredScope)
    } catch (err) {
      if (err instanceof BearerAuthError) return bearerAuthErrorResponse(err)
      safeError('[ext-guard] bearer auth failed:', err)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit check — per-route tier
    const rateLimited = await withRateLimit(
      req,
      options.rateLimitTier,
      `workspace:${auth.workspaceId}`
    )
    if (rateLimited) return rateLimited

    // Daily cost cap check — hard ceiling on total billable calls per workspace
    const cap = await checkDailyCap(auth.workspaceId)
    if (!cap.allowed) {
      const responseTimeMs = Math.round(performance.now() - startedAt)
      void logExtUsage({
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        endpoint: options.endpointLabel,
        statusCode: 402,
        responseTimeMs,
        req,
        requestSize: 0,
      })
      return NextResponse.json(
        {
          error: 'Daily ext API cap reached for this workspace.',
          cap: cap.cap,
          current: cap.currentCount,
          reset_in_hours: 24,
        },
        {
          status: 402,
          headers: {
            'X-RateLimit-Scope': 'daily-ext-cap',
            'X-RateLimit-Limit': String(cap.cap),
            'X-RateLimit-Remaining': String(Math.max(0, cap.cap - cap.currentCount)),
          },
        }
      )
    }

    // Read raw body for size tracking
    const rawBody = await req.text()
    const requestSize = new TextEncoder().encode(rawBody).length

    // Rebuild request with parsed body so downstream can re-read
    // (NextRequest is single-use, so we pass a new object where needed)
    const parsedBody = (() => {
      try {
        return rawBody ? JSON.parse(rawBody) : {}
      } catch {
        return null
      }
    })()

    if (parsedBody === null) {
      const responseTimeMs = Math.round(performance.now() - startedAt)
      void logExtUsage({
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        endpoint: options.endpointLabel,
        statusCode: 400,
        responseTimeMs,
        req,
        requestSize,
      })
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Stash parsed body on the req so the handler can access it without
    // re-reading the stream.
    ;(req as unknown as { parsedBody: unknown }).parsedBody = parsedBody

    let status = 200
    let responseBody: unknown
    try {
      const result = await handler(req, {
        auth,
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        startedAt,
      })
      status = result.status
      responseBody = result.body
    } catch (err) {
      safeError(`[${options.endpointLabel}] handler error:`, err)
      status = 500
      responseBody = { error: 'Internal server error' }
    }

    const responseTimeMs = Math.round(performance.now() - startedAt)
    void logExtUsage({
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      endpoint: options.endpointLabel,
      statusCode: status,
      responseTimeMs,
      req,
      requestSize,
    })

    return NextResponse.json(responseBody, { status })
  }
}

/**
 * Helper to read the parsed body stashed on the request by withExtGuard.
 */
export function getParsedBody<T = Record<string, unknown>>(req: NextRequest): T {
  return ((req as unknown as { parsedBody: unknown }).parsedBody ?? {}) as T
}
