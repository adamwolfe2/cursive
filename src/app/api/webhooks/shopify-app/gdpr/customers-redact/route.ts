/**
 * Shopify GDPR — customers/redact.
 *
 * 30-day SLA: erase all data we hold on the specified customer for that
 * shop. We delete leads/identities/lead-related data scoped to the
 * customer's email + phone within the install's workspace.
 */

export const runtime = 'nodejs'
export const maxDuration = 30

import { makeShopifyWebhookRoute } from '@/lib/marketplace/shopify/webhook-base'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

interface RedactPayload {
  shop_id: number
  shop_domain: string
  customer: {
    id: number
    email?: string
    phone?: string
  }
  orders_to_redact?: number[]
}

export const POST = makeShopifyWebhookRoute(async (ctx) => {
  const payload = ctx.payload as RedactPayload | null
  if (!payload) return { status: 'failed', error: 'malformed payload' }

  const admin = createAdminClient()

  // Locate the install
  const { data: install } = await admin
    .from('app_installs')
    .select('id, workspace_id')
    .eq('source', 'shopify')
    .eq('external_id', ctx.shopDomain)
    .maybeSingle()

  if (!install) {
    safeLog('[shopify customers-redact] no install for shop', { shop: ctx.shopDomain })
    return { status: 'skipped' }
  }

  const email = payload.customer.email
  const phone = payload.customer.phone
  const wsId = install.workspace_id

  // Erase ALL PII we hold for this customer within the install's workspace —
  // both leads AND the AudienceLab identity rows, which separately store the
  // person's emails/phones/name. Deleting only leads left identity PII behind,
  // breaking the GDPR erasure guarantee. Every delete is workspace-scoped.
  const errors: string[] = []

  if (email) {
    const { error: le } = await admin
      .from('leads').delete().eq('workspace_id', wsId).eq('email', email)
    if (le) errors.push(`leads/email: ${le.message}`)

    const { error: i1 } = await admin
      .from('audiencelab_identities').delete().eq('workspace_id', wsId).eq('primary_email', email)
    if (i1) errors.push(`identities/primary_email: ${i1.message}`)
    const { error: i2 } = await admin
      .from('audiencelab_identities').delete().eq('workspace_id', wsId).contains('personal_emails', [email])
    if (i2) errors.push(`identities/personal_emails: ${i2.message}`)
    const { error: i3 } = await admin
      .from('audiencelab_identities').delete().eq('workspace_id', wsId).contains('business_emails', [email])
    if (i3) errors.push(`identities/business_emails: ${i3.message}`)
  }

  if (phone) {
    const { error: lp } = await admin
      .from('leads').delete().eq('workspace_id', wsId).eq('phone', phone)
    if (lp) errors.push(`leads/phone: ${lp.message}`)

    const { error: ip } = await admin
      .from('audiencelab_identities').delete().eq('workspace_id', wsId).contains('phones', [phone])
    if (ip) errors.push(`identities/phones: ${ip.message}`)
  }

  // (Future: delete metafield_writes log entries for this customer once
  // that table exists.)

  if (errors.length > 0) {
    // Surface a partial-erasure failure so it can be retried — GDPR erasure
    // must not silently leave PII behind.
    safeError('[shopify customers-redact] PII erasure incomplete', {
      shop: ctx.shopDomain,
      errors,
    })
    return { status: 'failed', error: `redaction incomplete: ${errors.join('; ')}` }
  }

  return { status: 'processed' }
})
