/**
 * Campaign Builder Repository
 * Handles CRUD operations for campaign_drafts table
 * Follows repository pattern from CLAUDE.md
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CampaignDraft,
  CreateCampaignDraftRequest,
  UpdateCampaignDraftRequest,
  GeneratedEmail,
} from '@/types/campaign-builder'

export class CampaignBuilderRepository {
  /**
   * Create a new campaign draft
   */
  async create(
    workspaceId: string,
    userId: string,
    data: CreateCampaignDraftRequest
  ): Promise<CampaignDraft> {
    const supabase = await createClient()

    const { data: draft, error } = await supabase
      .from('campaign_drafts')
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        name: data.name,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create campaign draft: ${error.message}`)
    }

    return draft as CampaignDraft
  }

  /**
   * Get campaign draft by ID
   */
  async getById(draftId: string, workspaceId: string): Promise<CampaignDraft | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('campaign_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to get campaign draft: ${error.message}`)
    }

    return data as CampaignDraft
  }

  /**
   * List campaign drafts for workspace
   */
  async listByWorkspace(
    workspaceId: string,
    options: {
      status?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ drafts: CampaignDraft[]; total: number }> {
    const supabase = await createClient()

    let query = supabase
      .from('campaign_drafts')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list campaign drafts: ${error.message}`)
    }

    return {
      drafts: (data as CampaignDraft[]) || [],
      total: count || 0,
    }
  }

  /**
   * Update campaign draft
   */
  async update(
    draftId: string,
    workspaceId: string,
    updates: UpdateCampaignDraftRequest
  ): Promise<CampaignDraft> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('campaign_drafts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update campaign draft: ${error.message}`)
    }

    return data as CampaignDraft
  }

  /**
   * Update status
   */
  async updateStatus(
    draftId: string,
    workspaceId: string,
    status: CampaignDraft['status']
  ): Promise<CampaignDraft> {
    return this.update(draftId, workspaceId, { status } as any)
  }

  /**
   * Save generated emails (called after AI generation)
   * SECURITY: Filters by workspace_id to prevent cross-tenant updates
   */
  async saveGeneratedEmails(
    draftId: string,
    workspaceId: string,
    emails: GeneratedEmail[],
    options: {
      prompt?: string
      model?: string
      error?: string
    } = {}
  ): Promise<CampaignDraft> {
    const adminClient = createAdminClient()

    const updateData: any = {
      generated_emails: emails,
      status: options.error ? 'draft' : 'review',
      updated_at: new Date().toISOString(),
    }

    if (options.prompt) {
      updateData.generation_prompt = options.prompt
    }

    if (options.model) {
      updateData.ai_model = options.model
    }

    if (options.error) {
      updateData.generation_error = options.error
    } else {
      updateData.generated_at = new Date().toISOString()
      updateData.generation_error = null
    }

    const { data, error } = await adminClient
      .from('campaign_drafts')
      .update(updateData)
      .eq('id', draftId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save generated emails: ${error.message}`)
    }

    return data as CampaignDraft
  }

  /**
   * Approve campaign (ready for export)
   */
  async approve(draftId: string, workspaceId: string): Promise<CampaignDraft> {
    return this.updateStatus(draftId, workspaceId, 'approved')
  }

  /**
   * Mark as exported
   */
  async markExported(
    draftId: string,
    workspaceId: string,
    exportData: {
      format: CampaignDraft['export_format']
      emailbison_campaign_id?: string
    }
  ): Promise<CampaignDraft> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('campaign_drafts')
      .update({
        status: 'exported',
        exported_at: new Date().toISOString(),
        export_format: exportData.format,
        emailbison_campaign_id: exportData.emailbison_campaign_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to mark as exported: ${error.message}`)
    }

    return data as CampaignDraft
  }

  /**
   * Delete campaign draft
   */
  async delete(draftId: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('campaign_drafts')
      .delete()
      .eq('id', draftId)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new Error(`Failed to delete campaign draft: ${error.message}`)
    }
  }

  /**
   * Get workspace stats
   */
  async getWorkspaceStats(workspaceId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('campaign_drafts')
      .select('status')
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new Error(`Failed to get workspace stats: ${error.message}`)
    }

    const drafts = data || []

    return {
      total: drafts.length,
      draft: drafts.filter((d) => d.status === 'draft').length,
      generating: drafts.filter((d) => d.status === 'generating').length,
      review: drafts.filter((d) => d.status === 'review').length,
      approved: drafts.filter((d) => d.status === 'approved').length,
      exported: drafts.filter((d) => d.status === 'exported').length,
    }
  }
}
