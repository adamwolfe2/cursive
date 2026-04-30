export const runtime = 'edge'
export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

type GHLWebhookEvent = {
  type: string
  locationId?: string
  companyId?: string
  appId?: string
  userId?: string
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  // Contact/opportunity payloads nest under data
  data?: Record<string, unknown>
}

async function verifySignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return expected === signature
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-ghl-signature')
  const clientSecret = process.env.GHL_CLIENT_SECRET

  if (!clientSecret) {
    safeError('[GHL Webhook] GHL_CLIENT_SECRET not configured')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const valid = await verifySignature(body, signature, clientSecret)
  if (!valid) {
    safeError('[GHL Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: GHLWebhookEvent
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.type
  safeLog(`[GHL Webhook] Received: ${eventType}`)

  try {
    switch (eventType) {
      case 'app.installed':
        await handleAppInstalled(event)
        break

      case 'app.uninstalled':
        await handleAppUninstalled(event)
        break

      case 'contact.created':
      case 'contact.updated':
        await inngest.send({
          name: 'ghl/webhook.contact',
          data: {
            event_type: eventType,
            location_id: event.locationId ?? '',
            payload: event.data ?? {},
          },
        })
        break

      case 'opportunity.created':
      case 'opportunity.updated':
        await inngest.send({
          name: 'ghl/webhook.opportunity',
          data: {
            event_type: eventType,
            location_id: event.locationId ?? '',
            payload: event.data ?? {},
          },
        })
        break

      default:
        safeLog(`[GHL Webhook] Unhandled event type: ${eventType}`)
    }
  } catch (error) {
    safeError('[GHL Webhook] Processing error:', error)
  }

  return NextResponse.json({ received: true })
}

async function handleAppInstalled(event: GHLWebhookEvent) {
  if (!event.locationId) return

  const supabase = createAdminClient()
  const expiresAt = event.expires_in
    ? new Date(Date.now() + event.expires_in * 1000).toISOString()
    : null

  const { error } = await supabase.from('ghl_app_installs').upsert(
    {
      location_id: event.locationId,
      company_id: event.companyId ?? null,
      status: 'active',
      access_token: event.access_token ?? null,
      refresh_token: event.refresh_token ?? null,
      token_expires_at: expiresAt,
      scopes: event.scope ? event.scope.split(' ') : [],
      installed_at: new Date().toISOString(),
      uninstalled_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'location_id' }
  )

  if (error) {
    safeError('[GHL Webhook] Failed to upsert app install:', error)
  }
}

async function handleAppUninstalled(event: GHLWebhookEvent) {
  if (!event.locationId) return

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('ghl_app_installs')
    .update({
      status: 'inactive',
      uninstalled_at: new Date().toISOString(),
      access_token: null,
      refresh_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq('location_id', event.locationId)

  if (error) {
    safeError('[GHL Webhook] Failed to mark uninstall:', error)
  }

  // Also deactivate the crm_connection if one exists
  const { data: install } = await supabase
    .from('ghl_app_installs')
    .select('workspace_id')
    .eq('location_id', event.locationId)
    .maybeSingle()

  if (install?.workspace_id) {
    await supabase
      .from('crm_connections')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', install.workspace_id)
      .eq('provider', 'gohighlevel')
  }
}
