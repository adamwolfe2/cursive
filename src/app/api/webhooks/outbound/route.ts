/**
 * Outbound Webhooks API
 * Cursive Platform
 *
 * GET  /api/webhooks/outbound        — list workspace's configured webhooks
 * POST /api/webhooks/outbound        — create a new webhook endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

const ALLOWED_EVENTS = [
  'lead.received',
  'lead.enriched',
  'lead.purchased',
  'credit.purchased',
] as const

const webhookSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  events: z
    .array(z.enum(ALLOWED_EVENTS))
    .min(1, 'Select at least one event'),
  name: z.string().min(1).max(100).optional(),
})

/** Generate a 32-byte hex secret */
function generateSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---------------------------------------------------------------------------
// GET — list webhooks
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = createAdminClient()
    const { data: webhooks, error } = await supabase
      .from('workspace_webhooks')
      .select(
        `
        id,
        name,
        url,
        events,
        is_active,
        created_at,
        updated_at,
        outbound_webhook_deliveries (
          id,
          status,
          response_status,
          created_at
        )
      `
      )
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })
      // Limit recent deliveries per webhook for the status summary
      .limit(5, { foreignTable: 'outbound_webhook_deliveries' })

    if (error) {
      safeError('[Webhooks/Outbound] GET list error:', error)
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
    }

    // Shape the response — omit the raw secret
    const result = (webhooks ?? []).map((w) => ({
      id: w.id,
      name: w.name,
      url: w.url,
      events: w.events,
      is_active: w.is_active,
      created_at: w.created_at,
      updated_at: w.updated_at,
      recent_deliveries: (w as any).outbound_webhook_deliveries ?? [],
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    return handleApiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST — create webhook
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const parsed = webhookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { url, events, name } = parsed.data
    const secret = generateSecret()

    const supabase = createAdminClient()
    const { data: webhook, error } = await supabase
      .from('workspace_webhooks')
      .insert({
        workspace_id: user.workspace_id,
        url,
        events,
        name: name ?? null,
        secret,
        is_active: true,
      })
      .select('id, name, url, events, is_active, created_at')
      .maybeSingle()

    if (error || !webhook) {
      safeError('[Webhooks/Outbound] POST insert error:', error)
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: {
          ...webhook,
          // Return the plaintext secret once so the user can save it
          secret,
          secret_warning: 'Save this secret — it will never be shown again.',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
