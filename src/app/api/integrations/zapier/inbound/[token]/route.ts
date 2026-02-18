/**
 * Zapier Inbound Webhook Route
 * GET/POST /api/integrations/zapier/inbound/[token]
 *
 * This is the endpoint that Zapier interacts with:
 * - GET: Zapier calls this to test the webhook and retrieve sample data
 *        for field mapping during Zap setup.
 * - POST: Our lead system POSTs lead data here; Zapier catches it.
 *
 * No auth check -- this is an external webhook endpoint.
 * Token is validated against the integrations table.
 */


import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * Validate the webhook token against the integrations table.
 * Uses jsonb containment (@>) to find the integration whose config
 * contains the matching webhook_token. This works across multiple
 * workspaces since each has a unique token.
 *
 * Returns the integration record if valid, null otherwise.
 */
async function validateToken(token: string) {
  const supabase = createAdminClient()

  // Use jsonb containment to look up the token directly in config
  const { data: integration, error } = await supabase
    .from('integrations')
    .select('id, workspace_id, config, status, total_events_sent')
    .eq('type', 'zapier')
    .eq('status', 'active')
    .containedBy('config', { webhook_token: token })
    .maybeSingle()

  // Fallback: if containedBy doesn't work as expected with partial match,
  // iterate through active zapier integrations
  if (error || !integration) {
    const { data: integrations, error: listError } = await supabase
      .from('integrations')
      .select('id, workspace_id, config, status, total_events_sent')
      .eq('type', 'zapier')
      .eq('status', 'active')

    if (listError || !integrations || integrations.length === 0) {
      return null
    }

    // Find the integration whose config.webhook_token matches
    const match = integrations.find((i) => {
      const cfg = i.config as Record<string, unknown> | null
      return cfg?.webhook_token === token
    })

    return match ?? null
  }

  return integration
}

/**
 * GET handler - Zapier calls this to test the connection
 * and retrieve sample data for field mapping.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const integration = await validateToken(token)

    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid or expired webhook token' },
        { status: 404 }
      )
    }

    // Return sample lead data so Zapier can set up field mappings
    return NextResponse.json({
      success: true,
      data: [
        {
          lead_id: 'sample-00000000-0000-0000-0000-000000000000',
          email: 'sample@example.com',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Acme Corp',
          title: 'VP Engineering',
          phone: '+1-555-0100',
          city: 'San Francisco',
          state: 'CA',
          linkedin_url: 'https://linkedin.com/in/johndoe',
          intent_score: 85,
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ],
    })
  } catch (error) {
    safeError('[Zapier] Inbound GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Our lead system POSTs lead data here.
 * Zapier's "Catch Hook" trigger will receive the data.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const integration = await validateToken(token)

    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid or expired webhook token' },
        { status: 404 }
      )
    }

    // Update last_used_at and increment event counter
    const supabase = createAdminClient()
    const currentCount = (integration.total_events_sent as number) ?? 0
    await supabase
      .from('integrations')
      .update({
        last_used_at: new Date().toISOString(),
        total_events_sent: currentCount + 1,
      })
      .eq('id', integration.id)

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    })
  } catch (error) {
    safeError('[Zapier] Inbound POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
