/**
 * POST /api/ext/verify-email — email deliverability check.
 *
 * Workspace API key with scope `ext:verify` required via
 * `Authorization: Bearer <key>` header.
 *
 * Rate limit: 30/min per workspace (lead-enrich tier).
 * Daily cap: 500 billable calls per workspace per rolling 24h.
 * Cost trail: one api_usage_log row per request.
 *
 * Request body:
 *   { email: string }
 *
 * Response:
 *   { email, status: 'valid'|'catch_all'|'invalid'|'unknown',
 *     is_deliverable: boolean, provider: 'audiencelab' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withExtGuard, getParsedBody } from '@/lib/middleware/ext-api-guard'
import { verifyEmail } from '@/lib/services/email-verification.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface VerifyBody {
  email?: string
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const POST = withExtGuard(
  { requiredScope: 'ext:verify', endpointLabel: 'ext:verify-email', rateLimitTier: 'lead-enrich' },
  async (req: NextRequest) => {
    const body = getParsedBody<VerifyBody>(req)

    if (!body.email || typeof body.email !== 'string') {
      return { status: 400, body: { error: 'Field `email` is required.' } }
    }

    const email = body.email.trim().toLowerCase()
    if (!EMAIL_FORMAT.test(email)) {
      return { status: 400, body: { error: `"${body.email}" is not a valid email format.` } }
    }

    try {
      const result = await verifyEmail(email)
      return {
        status: 200,
        body: {
          email: result.email,
          status: result.status,
          is_deliverable: result.status === 'valid' || result.status === 'catch_all',
          provider: 'audiencelab',
        },
      }
    } catch (err) {
      safeError('[ext:verify-email] verification failed:', err)
      return {
        status: 502,
        body: { error: 'Verification provider error', provider: 'audiencelab' },
      }
    }
  }
)

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
