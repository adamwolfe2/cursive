export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { deliverWebhook } from '@/lib/services/webhook-delivery.service'
import { publicLeadSource } from '@/lib/leads/public-source'

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

  // Prefer the workspace's most recent real lead so the test shows what this
  // endpoint will actually receive, with this customer's own field coverage,
  // rather than a sample that is always fully populated. Falls back to the
  // sample for a workspace that has not identified anyone yet.
  const { data: recentLead, error: recentLeadError } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, phone, company_name, company_domain, job_title, city, state, source, created_at')
    .eq('workspace_id', user.workspace_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // A lookup failure must not quietly masquerade as "this workspace has no
  // leads yet" — that would report used_real_lead: false as if the real-lead
  // path had run and found nothing.
  if (recentLeadError) {
    return NextResponse.json(
      { success: false, response_status: 0, error: 'Could not load a recent lead to test with. Try again.' },
      { status: 200 }
    )
  }

  const sampleData = {
    id: 'lead_test_' + Date.now(),
    first_name: 'Jane',
    last_name: 'Smith',
    full_name: 'Jane Smith',
    email: 'jane.smith@example.com',
    company_name: 'Acme Corp',
    company_industry: 'Technology',
    intent_score: 85,
    note: 'This is a test delivery from Cursive.',
  }

  const testData = recentLead
    ? {
        id: recentLead.id,
        first_name: recentLead.first_name,
        last_name: recentLead.last_name,
        full_name: [recentLead.first_name, recentLead.last_name].filter(Boolean).join(' ') || null,
        email: recentLead.email,
        phone: recentLead.phone,
        company_name: recentLead.company_name,
        company_domain: recentLead.company_domain,
        job_title: recentLead.job_title,
        city: recentLead.city,
        state: recentLead.state,
        source: publicLeadSource(recentLead.source),
        created_at: recentLead.created_at,
      }
    : sampleData

  let result
  try {
    result = await deliverWebhook(id, eventType, testData, { maxAttempts: 1, test: true })
  } catch (err) {
    // The UI parses this response as JSON — an uncaught throw would hand it an
    // HTML error page and surface as a misleading generic failure.
    return NextResponse.json(
      { success: false, response_status: 0, error: err instanceof Error ? err.message : 'Test delivery failed' },
      { status: 200 }
    )
  }

  return NextResponse.json({
    success: result.success,
    response_status: result.statusCode ?? 0,
    error: result.error ?? null,
    delivery_id: result.deliveryId,
    used_real_lead: !!recentLead,
  })
}
