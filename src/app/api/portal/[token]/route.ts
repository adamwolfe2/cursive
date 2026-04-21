export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    // Look up token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, client_id, email, expires_at, revoked')
      .eq('token', token)
      .maybeSingle()

    if (tokenError || !tokenRecord) {
      return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })
    }

    if (tokenRecord.revoked) {
      return NextResponse.json({ error: 'This portal link has been revoked' }, { status: 403 })
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This portal link has expired' }, { status: 403 })
    }

    const now = new Date().toISOString()

    // Update last_accessed_at on token (fire and forget)
    supabase
      .from('client_portal_tokens')
      .update({ last_accessed_at: now })
      .eq('id', tokenRecord.id)
      .then()

    // Update portal_last_visited_at on client (fire and forget)
    supabase
      .from('onboarding_clients')
      .update({ portal_last_visited_at: now })
      .eq('id', tokenRecord.client_id)
      .then()

    // Fetch client data (safe fields only)
    const { data: client, error: clientError } = await supabase
      .from('onboarding_clients')
      .select(
        [
          'id',
          'company_name',
          'primary_contact_name',
          'packages_selected',
          'setup_fee',
          'recurring_fee',
          'domain_variations',
          'sender_names',
          'domains_approval_url',
          'draft_sequences',
          'copy_generation_status',
          'copy_approval_status',
          'stripe_invoice_url',
          'stripe_invoice_status',
          'rabbitsign_folder_id',
          'rabbitsign_status',
          'status',
          'start_timeline',
          'portal_invite_sent_at',
        ].join(', ')
      )
      .eq('id', tokenRecord.client_id)
      .maybeSingle()

    if (clientError || !client) {
      safeError('[Portal] Failed to fetch client:', clientError)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch approvals
    const { data: approvalRows } = await supabase
      .from('client_portal_approvals')
      .select('step_type, status, notes, updated_at')
      .eq('client_id', tokenRecord.client_id)

    const approvals: Record<string, { status: string; notes: string | null; updated_at: string } | null> = {
      contract: null,
      invoice: null,
      domains: null,
      copy: null,
    }

    for (const row of approvalRows ?? []) {
      approvals[row.step_type] = {
        status: row.status,
        notes: row.notes ?? null,
        updated_at: row.updated_at,
      }
    }

    return NextResponse.json({
      client,
      approvals,
      tokenId: tokenRecord.id,
    })
  } catch (error) {
    safeError('[Portal] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
