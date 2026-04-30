/**
 * Email Account Repository
 * Handles all DB access for email_accounts table
 *
 * Schema truth (supabase/migrations/20260125000001_enrichment_queue_system.sql):
 *   email_address TEXT NOT NULL   — NOT "email"
 *   display_name TEXT             — NOT "name"
 *   credentials_encrypted JSONB   — SMTP + OAuth creds; no smtp_* flat columns
 *
 * SMTP credentials are stored inside credentials_encrypted as:
 *   { smtp_host, smtp_port, smtp_username, smtp_password }
 * The password is never returned in public-facing methods.
 */

import { createClient } from '@/lib/supabase/server'
import { DatabaseError, NotFoundError } from '@/lib/utils/api-error-handler'

// ============================================================================
// TYPES
// ============================================================================

export interface EmailAccountRow {
  id: string
  workspace_id: string
  provider: 'gmail' | 'outlook' | 'smtp' | 'resend'
  email_address: string
  display_name: string | null
  is_primary: boolean
  is_verified: boolean
  daily_send_limit: number
  sends_today: number
  created_at: string
  updated_at: string
}

export interface EmailAccountPublic {
  id: string
  workspace_id: string
  provider: 'gmail' | 'outlook' | 'smtp' | 'resend'
  /** Canonical column name from schema */
  email_address: string
  display_name: string | null
  is_primary: boolean
  is_verified: boolean
  daily_send_limit: number
  sends_today: number
  /** SMTP host — populated from credentials_encrypted for SMTP accounts, null otherwise */
  smtp_host: string | null
  /** SMTP port — populated from credentials_encrypted for SMTP accounts, null otherwise */
  smtp_port: number | null
  /** SMTP username — populated from credentials_encrypted for SMTP accounts, null otherwise */
  smtp_username: string | null
  created_at: string
  updated_at: string
}

export interface CreateSmtpAccountInput {
  workspaceId: string
  email: string
  name: string
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  dailySendLimit: number
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Map a raw DB row (which has credentials_encrypted JSONB) to the public shape
 * that the rest of the app already consumes (smtp_host / smtp_port / smtp_username).
 * The smtp_password is intentionally NEVER included in the public shape.
 */
function toPublic(row: {
  id: string
  workspace_id: string
  provider: string
  email_address: string
  display_name: string | null
  is_primary: boolean
  is_verified: boolean
  daily_send_limit: number
  sends_today: number
  credentials_encrypted?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}): EmailAccountPublic {
  const creds = (row.credentials_encrypted ?? {}) as Record<string, unknown>
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    provider: row.provider as EmailAccountPublic['provider'],
    email_address: row.email_address,
    display_name: row.display_name,
    is_primary: row.is_primary,
    is_verified: row.is_verified,
    daily_send_limit: row.daily_send_limit,
    sends_today: row.sends_today,
    smtp_host: typeof creds.smtp_host === 'string' ? creds.smtp_host : null,
    smtp_port: typeof creds.smtp_port === 'number' ? creds.smtp_port : null,
    smtp_username: typeof creds.smtp_username === 'string' ? creds.smtp_username : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

const PUBLIC_COLUMNS =
  'id, workspace_id, provider, email_address, display_name, is_primary, is_verified, daily_send_limit, sends_today, credentials_encrypted, created_at, updated_at'

// ============================================================================
// REPOSITORY
// ============================================================================

export class EmailAccountRepository {
  // --------------------------------------------------------
  // List accounts for a workspace (never return smtp_password)
  // --------------------------------------------------------
  async findByWorkspace(workspaceId: string): Promise<EmailAccountPublic[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_accounts')
      .select(PUBLIC_COLUMNS)
      .eq('workspace_id', workspaceId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) throw new DatabaseError(error.message)
    return (data ?? []).map(toPublic)
  }

  // --------------------------------------------------------
  // Find a single account (with workspace ownership check)
  // --------------------------------------------------------
  async findByIdAndWorkspace(
    id: string,
    workspaceId: string
  ): Promise<EmailAccountPublic | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_accounts')
      .select(PUBLIC_COLUMNS)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    if (!data) return null
    return toPublic(data)
  }

  // --------------------------------------------------------
  // Create SMTP account — credentials stored in credentials_encrypted JSONB.
  // smtp_password is NEVER stored in plaintext flat columns.
  // --------------------------------------------------------
  async createSmtp(input: CreateSmtpAccountInput): Promise<EmailAccountPublic> {
    const supabase = await createClient()

    // Determine if this should be primary (first account in workspace)
    const existingCount = await this.countByWorkspace(input.workspaceId)
    const isPrimary = existingCount === 0

    const { data, error } = await supabase
      .from('email_accounts')
      .insert({
        workspace_id: input.workspaceId,
        provider: 'smtp',
        email_address: input.email,
        display_name: input.name,
        is_primary: isPrimary,
        is_verified: false,
        daily_send_limit: input.dailySendLimit,
        sends_today: 0,
        credentials_encrypted: {
          smtp_host: input.smtpHost,
          smtp_port: input.smtpPort,
          smtp_username: input.smtpUsername,
          smtp_password: input.smtpPassword,
        },
      })
      .select(PUBLIC_COLUMNS)
      .single()

    if (error) throw new DatabaseError(error.message)
    return toPublic(data)
  }

  // --------------------------------------------------------
  // Set primary account (unsets all others first)
  // --------------------------------------------------------
  async setPrimary(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    // Verify ownership
    const account = await this.findByIdAndWorkspace(id, workspaceId)
    if (!account) throw new NotFoundError('Email account not found')

    // Unset all primaries
    const { error: unsetError } = await supabase
      .from('email_accounts')
      .update({ is_primary: false })
      .eq('workspace_id', workspaceId)

    if (unsetError) throw new DatabaseError(unsetError.message)

    // Set new primary
    const { error: setError } = await supabase
      .from('email_accounts')
      .update({ is_primary: true })
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (setError) throw new DatabaseError(setError.message)
  }

  // --------------------------------------------------------
  // Mark verified
  // --------------------------------------------------------
  async markVerified(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('email_accounts')
      .update({ is_verified: true })
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) throw new DatabaseError(error.message)
  }

  // --------------------------------------------------------
  // Delete (with workspace ownership check)
  // --------------------------------------------------------
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    // Verify ownership before deleting
    const account = await this.findByIdAndWorkspace(id, workspaceId)
    if (!account) throw new NotFoundError('Email account not found')

    const { error } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) throw new DatabaseError(error.message)

    // If the deleted account was primary and others exist, promote the oldest remaining
    if (account.is_primary) {
      await this.promoteOldestAsPrimary(workspaceId)
    }
  }

  // --------------------------------------------------------
  // Get SMTP credentials for sending (includes password — never expose to client)
  // --------------------------------------------------------
  async getSmtpCredentials(
    id: string,
    workspaceId: string
  ): Promise<{
    smtp_host: string
    smtp_port: number
    smtp_username: string
    smtp_password: string
    email_address: string
    display_name: string | null
  } | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_accounts')
      .select('credentials_encrypted, email_address, display_name')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .eq('provider', 'smtp')
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    if (!data) return null

    const creds = (data.credentials_encrypted ?? {}) as Record<string, unknown>
    if (
      typeof creds.smtp_host !== 'string' ||
      typeof creds.smtp_port !== 'number' ||
      typeof creds.smtp_username !== 'string' ||
      typeof creds.smtp_password !== 'string'
    ) {
      return null
    }

    return {
      smtp_host: creds.smtp_host,
      smtp_port: creds.smtp_port,
      smtp_username: creds.smtp_username,
      smtp_password: creds.smtp_password,
      email_address: data.email_address,
      display_name: data.display_name,
    }
  }

  // --------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------
  private async countByWorkspace(workspaceId: string): Promise<number> {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('email_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)

    if (error) throw new DatabaseError(error.message)
    return count ?? 0
  }

  private async promoteOldestAsPrimary(workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { data } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (data?.id) {
      await supabase
        .from('email_accounts')
        .update({ is_primary: true })
        .eq('id', data.id)
    }
  }
}
