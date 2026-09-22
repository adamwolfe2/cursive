export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { deliverWebhook } from '@/lib/services/webhook-delivery.service'

/**
 * Send a test event to one of the workspace's webhook endpoints.
 *
 * Delegates to the same delivery service the live Inngest fan-out uses, so the
 * body shape, the signature scheme and the delivery log a customer sees here
 * are byte-for-byte what they will receive in production. Hand-rolling the
 * signing here is what previously made the test event unverifiable against a
 * verifier written for real events.
 */
export async function POST(
  _req: NextRequest,
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

  // Ownership check — the service loads by id alone, so the tenant scope is enforced here.
  const { data: webhook } = await supabase
    .from('workspace_webhooks')
    .select('id, events')
    .eq('id', id)
    .eq('workspace_id', user.workspace_id)
    .maybeSingle()

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  const eventType = webhook.events?.[0] ?? 'lead.received'

  const result = await deliverWebhook(
    id,
    eventType,
    {
      id: 'lead_test_' + Date.now(),
      first_name: 'Jane',
      last_name: 'Smith',
      full_name: 'Jane Smith',
      email: 'jane.smith@example.com',
      company_name: 'Acme Corp',
      company_industry: 'Technology',
      intent_score: 85,
      note: 'This is a test delivery from Cursive.',
    },
    { maxAttempts: 1, test: true }
  )

  return NextResponse.json({
    success: result.success,
    response_status: result.statusCode ?? 0,
    error: result.error ?? null,
    delivery_id: result.deliveryId,
  })
}
