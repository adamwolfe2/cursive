/**
 * Outbound Saved Prompt Repository
 *
 * CRUD for `outbound_saved_prompts`. Returns globals (workspace_id IS NULL)
 * concatenated with workspace-specific overrides. Globals are seeded by the
 * migration; workspaces can add their own custom prompts.
 *
 * Migration: supabase/migrations/20260408000000_outbound_agent_v1.sql
 */

import { createClient } from '@/lib/supabase/server'
import { DatabaseError } from '@/types'
import type { OutboundSavedPrompt } from '@/types/outbound'

export interface CreateSavedPromptInput {
  workspace_id: string
  label: string
  description?: string | null
  prompt_template: string
  icon_name?: string | null
  sort_order?: number
  created_by?: string | null
}

export interface UpdateSavedPromptInput {
  label?: string
  description?: string | null
  prompt_template?: string
  icon_name?: string | null
  sort_order?: number
}

export class OutboundSavedPromptRepository {
  /**
   * Returns global defaults + workspace-specific prompts, sorted.
   */
  async listForWorkspace(workspaceId: string): Promise<OutboundSavedPrompt[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outbound_saved_prompts')
      .select('*')
      .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw new DatabaseError(error.message)
    return (data ?? []) as OutboundSavedPrompt[]
  }

  /**
   * Get a single prompt by id (workspace-scoped + globals visible).
   */
  async findById(id: string, workspaceId: string): Promise<OutboundSavedPrompt | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outbound_saved_prompts')
      .select('*')
      .eq('id', id)
      .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(error.message)
    }
    return (data as OutboundSavedPrompt) ?? null
  }

  async create(input: CreateSavedPromptInput): Promise<OutboundSavedPrompt> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outbound_saved_prompts')
      .insert({
        workspace_id: input.workspace_id,
        label: input.label,
        description: input.description ?? null,
        prompt_template: input.prompt_template,
        icon_name: input.icon_name ?? null,
        sort_order: input.sort_order ?? 99,
        is_default: false,
        created_by: input.created_by ?? null,
      })
      .select('*')
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    return data as OutboundSavedPrompt
  }

  async update(id: string, workspaceId: string, patch: UpdateSavedPromptInput): Promise<OutboundSavedPrompt> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outbound_saved_prompts')
      .update(patch)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    if (!data) throw new DatabaseError('Saved prompt not found or not editable (globals are read-only)')
    return data as OutboundSavedPrompt
  }

  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('outbound_saved_prompts')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) throw new DatabaseError(error.message)
  }
}

export const outboundSavedPromptRepository = new OutboundSavedPromptRepository()
