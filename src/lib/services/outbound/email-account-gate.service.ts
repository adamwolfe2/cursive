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
}

export interface SendingAccountGate {
  /** True if the workspace has at least one verified sending account. */
  ready: boolean
  /** First (or primary) connected account, if any. */
  account: ConnectedSendingAccount | null
  /** Total verified accounts in the workspace. */
  count: number
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
    .select('id, email_address, provider, is_primary, is_verified')
    .eq('workspace_id', workspaceId)
    .eq('is_verified', true)
    .in('provider', ['gmail', 'outlook', 'smtp'])
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load sending accounts: ${error.message}`)
  }

  const rows = (data ?? []) as Array<{
    id: string
    email_address: string
    provider: string
    is_primary: boolean
    is_verified: boolean
  }>

  if (rows.length === 0) {
    return { ready: false, account: null, count: 0 }
  }

  const first = rows[0]
  return {
    ready: true,
    account: {
      id: first.id,
      email_address: first.email_address,
      provider: first.provider,
      is_primary: !!first.is_primary,
    },
    count: rows.length,
  }
}

/**
 * Convenience: returns true/false. Use when you don't need the account details.
 */
export async function hasConnectedSendingAccount(workspaceId: string): Promise<boolean> {
  const gate = await getSendingAccountGate(workspaceId)
  return gate.ready
}
