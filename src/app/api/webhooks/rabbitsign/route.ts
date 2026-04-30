import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyHmacSignature } from '@/lib/utils/crypto'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * RabbitSign webhook handler.
 * Called when a contract is signed or status changes.
 * Updates the onboarding_clients record.
 *
 * SECURITY: Requires RABBITSIGN_WEBHOOK_SECRET to be set. RabbitSign's UI
 * has no header/signature config, so the secret is passed as a query
 * string param on the webhook URL itself:
 *   https://leads.meetcursive.com/api/webhooks/rabbitsign?secret=<value>
 *
 * For backwards compatibility this also accepts the secret via the
 * x-rabbitsign-signature header (HMAC) or x-webhook-secret header (shared
 * secret) in case RabbitSign adds that capability later.
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require webhook secret — fail closed if not configured
    const webhookSecret = process.env.RABBITSIGN_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook signature verification not configured' },
        { status: 500 }
      )
    }

    // Read raw body for signature verification
    const rawBody = await req.text()

    // RabbitSign UI only allows configuring a webhook URL, not headers, so
    // we accept the secret via ?secret=<value> query param. Constant-time
    // compare via the same crypto primitive.
    const url = new URL(req.url)
    const querySecret = url.searchParams.get('secret') || ''
    const hmacHeader = req.headers.get('x-rabbitsign-signature') || ''
    const sharedHeader = req.headers.get('x-webhook-secret') || ''

    let authorized = false
    if (querySecret) {
      // Constant-time compare for query string secret
      authorized =
        querySecret.length === webhookSecret.length &&
        Buffer.from(querySecret).equals(Buffer.from(webhookSecret))
    } else if (hmacHeader) {
      authorized = await verifyHmacSignature(rawBody, hmacHeader, webhookSecret)
    } else if (sharedHeader) {
      authorized =
        sharedHeader.length === webhookSecret.length &&
        Buffer.from(sharedHeader).equals(Buffer.from(webhookSecret))
    }

    if (!authorized) {
      safeError('[RabbitSign Webhook] No valid auth (query/header) provided')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse body
    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // RabbitSign sends: { folderId, event, signers, ... }
    const folderId = (body.folderId || body.folder_id) as string | undefined
    const event = (body.event || body.status) as string | undefined

    if (!folderId) {
      return NextResponse.json({ error: 'Missing folderId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (event === 'COMPLETED' || event === 'ALL_SIGNED' || event === 'completed') {
      // All parties signed — update client record
      const { error } = await supabase
        .from('onboarding_clients')
        .update({
          rabbitsign_status: 'signed',
          contract_signed_at: new Date().toISOString(),
        })
        .eq('rabbitsign_folder_id', folderId)

      if (error) {
        return NextResponse.json({ error: 'Failed to update client record' }, { status: 500 })
      }
    } else if (event === 'VIEWED' || event === 'viewed') {
      await supabase
        .from('onboarding_clients')
        .update({ rabbitsign_status: 'viewed' })
        .eq('rabbitsign_folder_id', folderId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    safeError('[RabbitSign Webhook] Processing failed:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
