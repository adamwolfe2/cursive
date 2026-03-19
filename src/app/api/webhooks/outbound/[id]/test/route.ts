export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createHmac } from 'crypto'
import { isValidWebhookUrl } from '@/lib/utils/ssrf-guard'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user.workspace_id) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 403 })
  }

  const supabase = await createClient()

  // Fetch the webhook, verify it belongs to this workspace
  const { data: webhook } = await supabase
    .from('workspace_webhooks')
    .select('id, url, secret, is_active, events')
    .eq('id', id)
    .eq('workspace_id', user.workspace_id)
    .maybeSingle()

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  // SECURITY: Block SSRF — reject URLs pointing to internal/private networks
  if (!isValidWebhookUrl(webhook.url)) {
    return NextResponse.json(
      { error: 'Webhook URL is invalid or points to a blocked network. Update the URL first.' },
      { status: 400 }
    )
  }

  // Build test payload
  const payload = {
    event: webhook.events?.[0] ?? 'lead.received',
    workspace_id: user.workspace_id,
    timestamp: new Date().toISOString(),
    test: true,
    data: {
      id: 'lead_test_' + Date.now(),
      full_name: 'Jane Smith',
      email: 'jane.smith@example.com',
      company_name: 'Acme Corp',
      company_industry: 'Technology',
      intent_score: 85,
      note: 'This is a test delivery from Cursive.',
    },
  }

  const body = JSON.stringify(payload)

  // Sign the payload
  const signature = createHmac('sha256', webhook.secret ?? '')
    .update(body, 'utf8')
    .digest('hex')

  // Deliver to endpoint
  let responseStatus = 0
  let responseBody = ''
  let success = false

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cursive-Signature': signature,
        'X-Cursive-Event': payload.event,
        'User-Agent': 'Cursive-Webhooks/1.0',
      },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    responseStatus = res.status
    responseBody = await res.text().catch(() => '')
    success = res.status >= 200 && res.status < 300
  } catch (err) {
    responseStatus = 0
    responseBody = err instanceof Error ? err.message : 'Connection failed'
    success = false
  }

  // Log delivery
  await supabase.from('outbound_webhook_deliveries').insert({
    webhook_id: id,
    workspace_id: user.workspace_id,
    event_type: payload.event,
    payload,
    status: success ? 'success' : 'failed',
    response_status: responseStatus || null,
    response_body: responseBody.slice(0, 2000),
    attempts: 1,
    last_attempt_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  // Non-critical: swallow any insert error
  }).then(() => null, () => null)

  return NextResponse.json({
    success,
    response_status: responseStatus,
    response_body: responseBody.slice(0, 500),
    payload,
  })
}
