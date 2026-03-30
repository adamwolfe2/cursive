/**
 * Email Account Repository
 * Handles all DB access for email_accounts table
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
  email: string
  name: string | null
  is_primary: boolean
  is_verified: boolean
  daily_send_limit: number
  sends_today: number
  smtp_host: string | null
  smtp_port: number | null
  smtp_username: string | null
  created_at: string
  updated_at: string
}

export interface EmailAccountPublic {
  id: string
  workspace_id: string
  provider: 'gmail' | 'outlook' | 'smtp' | 'resend'
  email: string
  name: string | null
  is_primary: boolean
  is_verified: boolean
  daily_send_limit: number
  sends_today: number
  smtp_host: string | null
  smtp_port: number | null
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
// REPOSITORY
// ============================================================================

export class EmailAccountRepository {
  // --------------------------------------------------------
  // List accounts for a workspace (never return tokens/password)
  // --------------------------------------------------------
  async findByWorkspace(workspaceId: string): Promise<EmailAccountPublic[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_accounts')
      .select(
        'id, workspace_id, provider, email, name, is_primary, is_verified, daily_send_limit, sends_today, smtp_host, smtp_port, smtp_username, created_at, updated_at'
      )
      .eq('workspace_id', workspaceId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) throw new DatabaseError(error.message)
    return (data ?? []) as EmailAccountPublic[]
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
      .select(
        'id, workspace_id, provider, email, name, is_primary, is_verified, daily_send_limit, sends_today, smtp_host, smtp_port, smtp_username, created_at, updated_at'
      )
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    return data as EmailAccountPublic | null
  }

  // --------------------------------------------------------
  // Create SMTP account (password stored directly — no encryption layer yet)
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
        email: input.email,
        name: input.name,
        is_primary: isPrimary,
        is_verified: false,
        daily_send_limit: input.dailySendLimit,
        sends_today: 0,
        smtp_host: input.smtpHost,
        smtp_port: input.smtpPort,
        smtp_username: input.smtpUsername,
        smtp_password: input.smtpPassword,
      })
      .select(
        'id, workspace_id, provider, email, name, is_primary, is_verified, daily_send_limit, sends_today, smtp_host, smtp_port, smtp_username, created_at, updated_at'
      )
      .single()

    if (error) throw new DatabaseError(error.message)
    return data as EmailAccountPublic
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
  // Get SMTP credentials for sending (includes password)
  // --------------------------------------------------------
  async getSmtpCredentials(
    id: string,
    workspaceId: string
  ): Promise<{
    smtp_host: string
    smtp_port: number
    smtp_username: string
    smtp_password: string
    email: string
    name: string | null
  } | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_accounts')
      .select('smtp_host, smtp_port, smtp_username, smtp_password, email, name')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .eq('provider', 'smtp')
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    if (!data) return null
    return data as {
      smtp_host: string
      smtp_port: number
      smtp_username: string
      smtp_password: string
      email: string
      name: string | null
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
