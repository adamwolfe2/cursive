/**
 * Outbound Run Repository
 *
 * CRUD for `outbound_runs` — the audit log + live header for the workflow
 * detail page. Multi-tenant via workspace_id; RLS enforces isolation.
 *
 * Migration: supabase/migrations/20260408000000_outbound_agent_v1.sql
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DatabaseError } from '@/types'
import type { OutboundRun, OutboundRunInsert, OutboundRunStatus } from '@/types/outbound'

export class OutboundRunRepository {
  /**
   * Find the latest run for an agent. Returns null if no runs yet.
   */
  async findLatest(agentId: string, workspaceId: string): Promise<OutboundRun | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outbound_runs')
      .select('*')
      .eq('agent_id', agentId)
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(error.message)
    }
    return (data as OutboundRun) ?? null
  }

  /**
   * Recent runs for the workflow detail page (history list).
   */
  async findRecent(agentId: string, workspaceId: string, limit = 10): Promise<OutboundRun[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outbound_runs')
      .select('*')
      .eq('agent_id', agentId)
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw new DatabaseError(error.message)
    return (data ?? []) as OutboundRun[]
  }

  /**
   * Is there a run currently in `running` status for this agent?
   * Used to prevent overlapping run requests.
   */
  async hasActiveRun(agentId: string, workspaceId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outbound_runs')
      .select('id')
      .eq('agent_id', agentId)
      .eq('workspace_id', workspaceId)
      .eq('status', 'running')
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(error.message)
    }
    return !!data
  }

  /**
   * Create a new run row in `running` status.
   * Uses the user-scoped client so RLS validates the insert.
   */
  async create(payload: OutboundRunInsert): Promise<OutboundRun> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outbound_runs')
      .insert(payload)
      .select('*')
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    return data as OutboundRun
  }

  /**
   * Bump counters / update progress fields. Uses admin client because
   * the Inngest function runs out of any user request context.
   */
  async updateProgress(
    runId: string,
    patch: Partial<Pick<
      OutboundRun,
      | 'status'
      | 'prospects_target'
      | 'prospects_found'
      | 'prospects_enriched'
      | 'drafts_created'
      | 'drafts_approved'
      | 'emails_sent'
      | 'replies_received'
      | 'meetings_booked'
      | 'credits_spent'
      | 'error_message'
      | 'completed_at'
      | 'metadata'
    >>
  ): Promise<OutboundRun> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('outbound_runs')
      .update(patch)
      .eq('id', runId)
      .select('*')
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    return data as OutboundRun
  }

  /**
   * Mark a run as complete (or failed). Idempotent.
   */
  async markComplete(runId: string, status: OutboundRunStatus, errorMessage?: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('outbound_runs')
      .update({
        status,
        error_message: errorMessage ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)

    if (error) throw new DatabaseError(error.message)
  }

  /**
   * All running rows across all agents — used by the stats refresher cron
   * and admin tooling. Uses admin client.
   */
  async findAllRunning(): Promise<OutboundRun[]> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('outbound_runs')
      .select('*')
      .eq('status', 'running')
      .limit(500)

    if (error) throw new DatabaseError(error.message)
    return (data ?? []) as OutboundRun[]
  }
}

export const outboundRunRepository = new OutboundRunRepository()
