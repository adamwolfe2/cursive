import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyHmacSignature } from '@/lib/utils/crypto'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * RabbitSign webhook handler.
 * Called when a contract is signed or status changes.
 * Updates the onboarding_clients record.
 *
 * SECURITY: Requires RABBITSIGN_WEBHOOK_SECRET to be set. Verifies the
 * x-rabbitsign-signature header (HMAC-SHA256). If RabbitSign does not
 * provide HMAC signing, falls back to a shared-secret header check via
 * x-webhook-secret matching RABBITSIGN_WEBHOOK_SECRET.
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

    // Try HMAC-SHA256 via x-rabbitsign-signature header first
    const hmacHeader = req.headers.get('x-rabbitsign-signature') || ''
    if (hmacHeader) {
      const isValid = await verifyHmacSignature(rawBody, hmacHeader, webhookSecret)
      if (!isValid) {
        safeError('[RabbitSign Webhook] HMAC signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      // Fallback: shared-secret header check
      const sharedSecret = req.headers.get('x-webhook-secret') || ''
      if (sharedSecret !== webhookSecret) {
        safeError('[RabbitSign Webhook] Shared-secret header missing or invalid')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
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
