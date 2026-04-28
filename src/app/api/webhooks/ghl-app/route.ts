/**
 * GHL Marketplace App — webhook handler.
 *
 * Subscribes to AppInstall and AppUninstall events from GHL. Verifies the
 * Ed25519 signature, persists the raw payload for idempotency, and updates
 * app_installs accordingly.
 *
 * Per PRD §F6: respond 200 OK immediately, process async.
 */

export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGhlWebhookSignature } from '@/lib/marketplace/signature-verify'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

interface GhlWebhookPayload {
  type: 'INSTALL' | 'UNINSTALL' | string
  appId?: string
  companyId?: string
  locationId?: string
  installType?: 'Company' | 'Location'
  timestamp?: string
  webhookId?: string
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sigHeader =
    req.headers.get('x-ghl-signature') ??
    req.headers.get('x-wh-signature') // legacy fallback per PRD §F6

  // Always 200 to GHL even on signature failure — but record + alert.
  // Reason: GHL retries on 5xx, which would compound a config error.
  const publicKey = process.env.GHL_WEBHOOK_PUBLIC_KEY
  let signatureVerified = false

  if (publicKey) {
    signatureVerified = verifyGhlWebhookSignature(rawBody, sigHeader, publicKey)
  } else {
    safeError('[ghl-app webhook] GHL_WEBHOOK_PUBLIC_KEY not configured — accepting unverified')
  }

  let payload: GhlWebhookPayload
  try {
    payload = JSON.parse(rawBody) as GhlWebhookPayload
  } catch {
    safeError('[ghl-app webhook] invalid JSON body')
    return NextResponse.json({ received: true })
  }

  const admin = createAdminClient()

  // Persist raw event for idempotency + audit
  const { error: insertErr } = await admin.from('marketplace_webhook_events').insert({
    source: 'ghl',
    topic: payload.type ?? 'unknown',
    external_event_id: payload.webhookId ?? null,
    payload,
    signature_verified: signatureVerified,
    status: signatureVerified ? 'received' : 'skipped',
  })

  if (insertErr && !insertErr.message.includes('uq_marketplace_webhook_dedup')) {
    safeError('[ghl-app webhook] event log insert failed', insertErr)
  }

  if (!signatureVerified) {
    void sendSlackAlert({
      type: 'system_event',
      severity: 'warning',
      message: 'GHL webhook signature verification failed — event ignored',
    })
    return NextResponse.json({ received: true })
  }

  // Route handling
  try {
    if (payload.type === 'INSTALL') {
      // Real INSTALL events for new sub-accounts (post-bulk install) — provision
      // them now. The OAuth callback handles the initial bulk install; this
      // handler catches sub-accounts added LATER.
      safeLog('[ghl-app webhook] INSTALL event', {
        installType: payload.installType,
        locationId: payload.locationId,
      })
      // Best-effort marker for ops — full provisioning happens via the OAuth
      // callback flow when the agency's app sees the new location.
      // (The PRD allows queuing a reconcile job; that's a future enhancement.)
    } else if (payload.type === 'UNINSTALL') {
      // Mark the install row uninstalled
      const externalId = payload.locationId ?? payload.companyId
      if (externalId) {
        const { error: updateErr } = await admin
          .from('app_installs')
          .update({
            status: 'uninstalled',
            uninstalled_at: new Date().toISOString(),
            access_token: null,
            refresh_token: null,
          })
          .eq('source', 'ghl')
          .eq('external_id', externalId)

        if (updateErr) {
          safeError('[ghl-app webhook] uninstall update failed', updateErr)
        }
      }
    }

    // Mark event processed
    if (payload.webhookId) {
      await admin
        .from('marketplace_webhook_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('source', 'ghl')
        .eq('external_event_id', payload.webhookId)
    }
  } catch (err) {
    safeError('[ghl-app webhook] handler threw', err)
  }

  return NextResponse.json({ received: true })
}
