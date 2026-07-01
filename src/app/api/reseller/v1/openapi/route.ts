/**
 * Reseller API — machine-readable docs
 *   GET /api/reseller/v1/openapi  (public; static reference, no secrets)
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import {
  RESELLER_API_VERSION,
  RESELLER_API_ABSOLUTE_BASE,
  RESELLER_ENDPOINTS,
  OUTBOUND_WEBHOOK_SCHEMA,
  RESELLER_QUICKSTART,
  RESELLER_RATE_LIMITS,
  SIGNATURE_VERIFICATION_SAMPLES,
} from '@/lib/reseller/docs'

export async function GET() {
  return NextResponse.json(
    {
      name: 'Cursive Reseller API',
      version: RESELLER_API_VERSION,
      base_url: RESELLER_API_ABSOLUTE_BASE,
      auth: 'Bearer <api_key> in the Authorization header',
      quickstart: RESELLER_QUICKSTART,
      endpoints: RESELLER_ENDPOINTS,
      outbound_webhook: OUTBOUND_WEBHOOK_SCHEMA,
      rate_limits: RESELLER_RATE_LIMITS,
      signature_verification: SIGNATURE_VERIFICATION_SAMPLES,
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  )
}
