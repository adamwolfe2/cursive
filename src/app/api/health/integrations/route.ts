/**
 * Integration Health Check API Route
 * GET /api/health/integrations
 *
 * Admin-only endpoint that checks which integrations have their
 * required environment variables configured (not their values).
 */

export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'

interface IntegrationStatus {
  configured: boolean
  missing?: string[]
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const check = (...vars: string[]): IntegrationStatus => {
    const missing = vars.filter((v) => !process.env[v])
    return {
      configured: missing.length === 0,
      ...(missing.length > 0 && { missing }),
    }
  }

  const integrations = {
    supabase: check(
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ),
    stripe: check('STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'),
    audiencelab: check('AUDIENCELAB_WEBHOOK_SECRET', 'AUDIENCELAB_ACCOUNT_API_KEY'),
    emailbison: check('EMAILBISON_API_KEY'),
    ghl: check('GHL_CURSIVE_LOCATION_TOKEN'),
    resend: check('RESEND_API_KEY'),
    inngest: check('INNGEST_EVENT_KEY', 'INNGEST_SIGNING_KEY'),
    slack: check('SLACK_WEBHOOK_URL'),
    anthropic: check('ANTHROPIC_API_KEY'),
    cron: check('CRON_SECRET'),
  }

  const totalConfigured = Object.values(integrations).filter((i) => i.configured).length
  const total = Object.keys(integrations).length

  return NextResponse.json({
    status: totalConfigured === total ? 'all_configured' : 'partial',
    configured: `${totalConfigured}/${total}`,
    integrations,
    timestamp: new Date().toISOString(),
  })
}
