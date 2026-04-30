import { createAdminClient } from '@/lib/supabase/admin'
import type { ReplyTemplate, TemplateCategory, ConversationStage } from '@/types/sdr'

export class SdrTemplateRepository {
  private get db() {
    return createAdminClient()
  }

  async findByWorkspace(workspaceId: string): Promise<ReplyTemplate[]> {
    const { data, error } = await this.db
      .from('reply_response_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
    if (error) throw new Error(`Failed to fetch templates: ${error.message}`)
    return (data ?? []) as ReplyTemplate[]
  }

  async findByCategory(
    workspaceId: string,
    category: TemplateCategory
  ): Promise<ReplyTemplate[]> {
    const { data, error } = await this.db
      .from('reply_response_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('category', category)
      .eq('is_active', true)
      .order('priority', { ascending: false })
    if (error) throw new Error(`Failed to fetch templates by category: ${error.message}`)
    return (data ?? []) as ReplyTemplate[]
  }

  async findMatchingTemplate(
    workspaceId: string,
    params: {
      sentiment: string
      intentScore: number
      conversationStage?: ConversationStage
    }
  ): Promise<ReplyTemplate | null> {
    const { data, error } = await this.db
      .from('reply_response_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .eq('auto_suggest', true)
      .contains('for_sentiment', [params.sentiment])
      .gte('for_intent_score_max', params.intentScore)
      .lte('for_intent_score_min', params.intentScore)
      .order('priority', { ascending: false })
      .limit(1)
    if (error) throw new Error(`Failed to find matching template: ${error.message}`)
    return (data?.[0] as ReplyTemplate) ?? null
  }

  async findById(id: string, workspaceId: string): Promise<ReplyTemplate | null> {
    const { data, error } = await this.db
      .from('reply_response_templates')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()
    if (error) throw new Error(`Failed to fetch template: ${error.message}`)
    return data as ReplyTemplate | null
  }

  async create(
    template: Omit<ReplyTemplate, 'id' | 'created_at' | 'updated_at' | 'times_used' | 'reply_rate'>
  ): Promise<ReplyTemplate> {
    const { data, error } = await this.db
      .from('reply_response_templates')
      .insert(template)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to create template: ${error.message}`)
    return data as ReplyTemplate
  }

  async update(
    id: string,
    workspaceId: string,
    updates: Partial<ReplyTemplate>
  ): Promise<ReplyTemplate> {
    const { data, error } = await this.db
      .from('reply_response_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to update template: ${error.message}`)
    return data as ReplyTemplate
  }

  async delete(id: string, workspaceId: string): Promise<void> {
    const { error } = await this.db
      .from('reply_response_templates')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)
    if (error) throw new Error(`Failed to delete template: ${error.message}`)
  }

  async incrementUsage(id: string, workspaceId: string): Promise<void> {
    const { error } = await this.db.rpc('increment_template_usage', { template_id: id })
    if (error) {
      const template = await this.findById(id, workspaceId)
      if (!template) throw new Error(`Template not found: ${id}`)
      const { error: updateError } = await this.db
        .from('reply_response_templates')
        .update({
          times_used: template.times_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('workspace_id', workspaceId)
      if (updateError) throw new Error(`Failed to increment template usage: ${updateError.message}`)
    }
  }
}
