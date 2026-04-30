export const maxDuration = 30

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Optionally protect with automation secret
  const secret = request.headers.get('x-automation-secret')
  const expectedSecret = process.env.AUTOMATION_SECRET

  // In production, always require the secret (reject if unset or wrong)
  if (process.env.NODE_ENV === 'production' && (!expectedSecret || secret !== expectedSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks: Record<string, boolean | string> = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    inngest_event: !!process.env.INNGEST_EVENT_KEY,
    inngest_signing: !!process.env.INNGEST_SIGNING_KEY,
    slack_webhook: !!process.env.SLACK_WEBHOOK_URL,
    resend: !!process.env.RESEND_API_KEY,
    resend_from: !!process.env.RESEND_FROM_EMAIL,
    automation_secret: !!process.env.AUTOMATION_SECRET,
    admin_alert_email: !!process.env.ADMIN_ALERT_EMAIL,
    crm_webhook: process.env.CRM_WEBHOOK_URL ? true : 'optional - using fallback logging',
    crm_api_url: process.env.CRM_API_URL ? true : 'optional',
    crm_api_key: process.env.CRM_API_KEY ? true : 'optional',
  }

  const optionalKeys = ['crm_webhook', 'crm_api_url', 'crm_api_key']
  const allRequired = Object.entries(checks)
    .filter(([key]) => !optionalKeys.includes(key))
    .every(([, val]) => val === true)

  return NextResponse.json({
    status: allRequired ? 'ready' : 'missing_env_vars',
    timestamp: new Date().toISOString(),
    checks,
  }, { status: allRequired ? 200 : 503 })
}
