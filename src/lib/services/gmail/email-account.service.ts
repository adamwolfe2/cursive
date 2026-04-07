/**
 * Gmail Email Account Service
 * ---------------------------
 * Higher-level orchestrator that ties OAuth + encryption + the email_accounts
 * table together.
 *
 * Public API:
 *   - connectGmailAccount({ workspaceId, userId, code }) → row id
 *   - getValidAccessToken(accountId) → fresh access token (refreshes if needed)
 *   - disconnectAccount(accountId, workspaceId)
 *   - findGmailAccountForWorkspace(workspaceId)
 *
 * Used by:
 *   - /api/integrations/gmail/callback   (connect)
 *   - /api/integrations/gmail/disconnect (disconnect)
 *   - src/lib/services/gmail/send.service.ts  (Phase 2 — send via gmail.users.messages.send)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserInfo,
  GMAIL_SCOPES,
} from './oauth.service'
import { encryptToken, decryptToken } from './encryption'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// Refresh the access token this many seconds BEFORE its declared expiry,
// so we never hand out a token that's about to expire mid-request.
const REFRESH_LEEWAY_SECONDS = 90

export interface ConnectGmailParams {
  workspaceId: string
  userId: string
  code: string
}

export interface ConnectedGmailAccount {
  id: string
  email_address: string
  display_name: string | null
  oauth_provider_user_id: string | null
  is_primary: boolean
  is_verified: boolean
}

// ============================================================================
// CONNECT
// ============================================================================

/**
 * Exchange the OAuth `code` for tokens, fetch the user's Gmail address,
 * encrypt the refresh token, and upsert into email_accounts.
 *
 * Idempotent: re-connecting the same Gmail account in the same workspace
 * updates the existing row instead of creating a duplicate.
 */
export async function connectGmailAccount(
  params: ConnectGmailParams
): Promise<ConnectedGmailAccount> {
  const { workspaceId, userId, code } = params
  const supabase = createAdminClient()

  // 1. Exchange code → tokens
  const tokens = await exchangeCodeForTokens(code)

  // 2. Fetch the user's actual Gmail address
  const userInfo = await getUserInfo(tokens.access_token)
  if (!userInfo.email) {
    throw new Error('Google did not return an email address — cannot connect account')
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const refreshTokenCt = encryptToken(tokens.refresh_token!)

  // 3. Promote to primary if this is the first account in the workspace
  const { count } = await supabase
    .from('email_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
  const isPrimary = (count ?? 0) === 0

  // 4. Upsert by (workspace_id, email_address) — schema has a unique index there
  const { data, error } = await supabase
    .from('email_accounts')
    .upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        email_address: userInfo.email,
        display_name: userInfo.name ?? null,
        provider: 'gmail',
        is_verified: true,
        is_primary: isPrimary,
        daily_send_limit: 500,
        oauth_refresh_token_ct: refreshTokenCt,
        oauth_access_token: tokens.access_token,
        oauth_expires_at: expiresAt,
        oauth_scope: tokens.scope ?? GMAIL_SCOPES.join(' '),
        oauth_provider_user_id: userInfo.id,
        last_token_refresh_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,email_address' }
    )
    .select('id, email_address, display_name, oauth_provider_user_id, is_primary, is_verified')
    .maybeSingle()

  if (error || !data) {
    safeError('[gmail] connect upsert failed:', error)
    throw new Error(`Failed to save Gmail account: ${error?.message ?? 'unknown error'}`)
  }

  safeLog('[gmail] account connected', {
    workspace_id: workspaceId,
    email: userInfo.email,
    account_id: data.id,
  })
  return data as ConnectedGmailAccount
}

// ============================================================================
// REFRESH / READ
// ============================================================================

interface AccountTokenRow {
  id: string
  workspace_id: string
  oauth_refresh_token_ct: string | null
  oauth_access_token: string | null
  oauth_expires_at: string | null
}

/**
 * Returns a non-expired access token for the given account, refreshing
 * via Google if the cached one is missing or near expiry. Persists the
 * refreshed token back to email_accounts.
 *
 * Throws if the account is not a Gmail OAuth account or has no refresh
 * token on file.
 */
export async function getValidAccessToken(accountId: string): Promise<string> {
  const supabase = createAdminClient()

  const { data: row, error } = await supabase
    .from('email_accounts')
    .select('id, workspace_id, oauth_refresh_token_ct, oauth_access_token, oauth_expires_at, provider')
    .eq('id', accountId)
    .maybeSingle()

  if (error || !row) {
    throw new Error(`Email account ${accountId} not found`)
  }
  if (row.provider !== 'gmail') {
    throw new Error(`Email account ${accountId} is not a Gmail account`)
  }
  if (!row.oauth_refresh_token_ct) {
    throw new Error(`Email account ${accountId} has no refresh token on file — reconnect required`)
  }

  // Cached token still valid (with leeway)?
  const expiresAt = row.oauth_expires_at ? new Date(row.oauth_expires_at).getTime() : 0
  const valid = row.oauth_access_token && expiresAt - Date.now() > REFRESH_LEEWAY_SECONDS * 1000
  if (valid) {
    return row.oauth_access_token!
  }

  // Refresh
  const refreshToken = decryptToken(row.oauth_refresh_token_ct)
  const fresh = await refreshAccessToken(refreshToken)
  const newExpiresAt = new Date(Date.now() + fresh.expires_in * 1000).toISOString()

  const { error: updateError } = await supabase
    .from('email_accounts')
    .update({
      oauth_access_token: fresh.access_token,
      oauth_expires_at: newExpiresAt,
      last_token_refresh_at: new Date().toISOString(),
      // Google sometimes rotates refresh tokens — persist the new one if returned
      ...(fresh.refresh_token && { oauth_refresh_token_ct: encryptToken(fresh.refresh_token) }),
    })
    .eq('id', accountId)

  if (updateError) {
    safeError('[gmail] failed to persist refreshed token:', updateError)
  }

  return fresh.access_token
}

// ============================================================================
// DISCONNECT
// ============================================================================

/**
 * Removes the Gmail account from the workspace. Workspace ownership enforced.
 */
export async function disconnectAccount(accountId: string, workspaceId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('email_accounts')
    .delete()
    .eq('id', accountId)
    .eq('workspace_id', workspaceId)
  if (error) throw new Error(`Failed to disconnect Gmail account: ${error.message}`)
}

// ============================================================================
// LOOKUP
// ============================================================================

/**
 * Returns the workspace's primary Gmail account (or first available),
 * or null if none. Used by the outbound run orchestrator to attach a
 * sending account to each draft.
 */
export async function findGmailAccountForWorkspace(
  workspaceId: string
): Promise<{ id: string; email_address: string; display_name: string | null } | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_accounts')
    .select('id, email_address, display_name')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'gmail')
    .eq('is_verified', true)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to look up Gmail account: ${error.message}`)
  }
  return data ?? null
}
