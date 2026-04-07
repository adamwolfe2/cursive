/**
 * Email Account Gate
 * ------------------
 * Phase 0 safety lock for the Outbound Agent.
 *
 * The platform-wide EMAILBISON_API_KEY belongs to the platform owner. We
 * cannot let random workspaces hit it (their emails would land in the
 * owner's inboxes / from the owner's domains). Until per-workspace Gmail
 * OAuth ships in Phase 1, the Outbound Agent's Run Now action MUST refuse
 * to start unless the workspace has at least one verified sending account
 * of its own (gmail / outlook / smtp).
 *
 * Schema reference: supabase/migrations/20260125000001_enrichment_queue_system.sql
 *   email_accounts(workspace_id, email_address, provider, is_verified, ...)
 *
 * Used by:
 *   - POST /api/outbound/workflows/[id]/run        (block run)
 *   - GET  /api/outbound/workflows/[id]/stats      (surface gate to UI)
 */

import { createAdminClient } from '@/lib/supabase/admin'

export interface ConnectedSendingAccount {
  id: string
  email_address: string
  provider: string
  is_primary: boolean
  connection_status: 'active' | 'needs_reconnect' | 'disabled'
}

export interface SendingAccountGate {
  /** True if the workspace has at least one verified, ACTIVE sending account. */
  ready: boolean
  /**
   * First (or primary) connected account, if any. May be in needs_reconnect
   * state — caller should check connection_status.
   */
  account: ConnectedSendingAccount | null
  /** Total verified accounts in the workspace, regardless of connection_status. */
  count: number
  /** True if the only available accounts are in needs_reconnect state. */
  needs_reconnect: boolean
}

/**
 * Returns the workspace's sending-account state.
 *
 * The gate considers only verified accounts whose provider is one of the
 * supported per-user providers (gmail, outlook, smtp). It deliberately
 * excludes any internal "platform" entries.
 */
export async function getSendingAccountGate(workspaceId: string): Promise<SendingAccountGate> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('email_accounts')
    .select('id, email_address, provider, is_primary, is_verified, connection_status')
    .eq('workspace_id', workspaceId)
    .eq('is_verified', true)
    .in('provider', ['gmail', 'outlook', 'smtp'])
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load sending accounts: ${error.message}`)
  }

  type Row = {
    id: string
    email_address: string
    provider: string
    is_primary: boolean
    is_verified: boolean
    connection_status: 'active' | 'needs_reconnect' | 'disabled' | null
  }
  const rows = (data ?? []) as Row[]

  if (rows.length === 0) {
    return { ready: false, account: null, count: 0, needs_reconnect: false }
  }

  // Prefer an active account; fall back to surfacing the needs_reconnect one
  // so the UI knows what to prompt about.
  const activeRow = rows.find(r => (r.connection_status ?? 'active') === 'active')
  const surfaceRow = activeRow ?? rows[0]
  const status = (surfaceRow.connection_status ?? 'active') as 'active' | 'needs_reconnect' | 'disabled'

  return {
    ready: !!activeRow,
    account: {
      id: surfaceRow.id,
      email_address: surfaceRow.email_address,
      provider: surfaceRow.provider,
      is_primary: !!surfaceRow.is_primary,
      connection_status: status,
    },
    count: rows.length,
    needs_reconnect: !activeRow && status === 'needs_reconnect',
  }
}

/**
 * Convenience: returns true/false. Use when you don't need the account details.
 */
export async function hasConnectedSendingAccount(workspaceId: string): Promise<boolean> {
  const gate = await getSendingAccountGate(workspaceId)
  return gate.ready
}
