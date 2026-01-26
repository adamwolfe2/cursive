// Template Repository
// Database access layer for email templates using repository pattern

import { createClient } from '@/lib/supabase/server'
import type {
  EmailTemplate,
  EmailTemplateInsert,
  EmailTemplateUpdate,
} from '@/types'
import { DatabaseError } from '@/types'

export interface TemplateFilters {
  tone?: string
  structure?: string
  cta_type?: string
  target_seniority?: string
  source?: string
  is_active?: boolean
}

export class TemplateRepository {
  /**
   * Find all templates for a workspace
   */
  async findByWorkspace(
    workspaceId: string,
    filters?: TemplateFilters
  ): Promise<EmailTemplate[]> {
    const supabase = await createClient()

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('workspace_id', workspaceId)

    // Apply filters
    if (filters?.tone) {
      query = query.eq('tone', filters.tone)
    }
    if (filters?.structure) {
      query = query.eq('structure', filters.structure)
    }
    if (filters?.cta_type) {
      query = query.eq('cta_type', filters.cta_type)
    }
    if (filters?.target_seniority) {
      query = query.contains('target_seniority', [filters.target_seniority])
    }
    if (filters?.source) {
      query = query.eq('source', filters.source)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailTemplate[]
  }

  /**
   * Find templates by taxonomy (for campaign template matching)
   */
  async findByTaxonomy(
    workspaceId: string,
    options: {
      tones?: string[]
      structures?: string[]
      cta_types?: string[]
      target_seniorities?: string[]
      limit?: number
    }
  ): Promise<EmailTemplate[]> {
    const supabase = await createClient()

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)

    if (options.tones && options.tones.length > 0) {
      query = query.in('tone', options.tones)
    }
    if (options.structures && options.structures.length > 0) {
      query = query.in('structure', options.structures)
    }
    if (options.cta_types && options.cta_types.length > 0) {
      query = query.in('cta_type', options.cta_types)
    }
    if (options.target_seniorities && options.target_seniorities.length > 0) {
      query = query.overlaps('target_seniority', options.target_seniorities)
    }

    // Order by performance (positive reply rate)
    query = query.order('positive_reply_rate', { ascending: false })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailTemplate[]
  }

  /**
   * Find a single template by ID
   */
  async findById(id: string, workspaceId: string): Promise<EmailTemplate | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(error.message)
    }

    return data as EmailTemplate
  }

  /**
   * Create a new template
   */
  async create(template: EmailTemplateInsert): Promise<EmailTemplate> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_templates')
      .insert(template)
      .select('*')
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailTemplate
  }

  /**
   * Create multiple templates (for seeding)
   */
  async createMany(templates: EmailTemplateInsert[]): Promise<EmailTemplate[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_templates')
      .insert(templates)
      .select('*')

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailTemplate[]
  }

  /**
   * Update a template
   */
  async update(
    id: string,
    workspaceId: string,
    template: EmailTemplateUpdate
  ): Promise<EmailTemplate> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_templates')
      .update(template)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailTemplate
  }

  /**
   * Delete a template (soft delete by setting is_active = false)
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: false })
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Hard delete a template (for admin use)
   */
  async hardDelete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Get top performing templates
   */
  async getTopPerforming(
    workspaceId: string,
    limit: number = 10
  ): Promise<EmailTemplate[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .gt('emails_sent', 10) // Only templates with enough data
      .order('positive_reply_rate', { ascending: false })
      .limit(limit)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailTemplate[]
  }

  /**
   * Get template performance stats by taxonomy
   */
  async getPerformanceByTaxonomy(
    workspaceId: string
  ): Promise<{
    byTone: Record<string, { count: number; avgReplyRate: number; avgPositiveRate: number }>
    byStructure: Record<string, { count: number; avgReplyRate: number; avgPositiveRate: number }>
    byCtaType: Record<string, { count: number; avgReplyRate: number; avgPositiveRate: number }>
  }> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('tone, structure, cta_type, reply_rate, positive_reply_rate, emails_sent')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .gt('emails_sent', 0)

    if (error) {
      throw new DatabaseError(error.message)
    }

    const byTone: Record<string, { count: number; totalReplyRate: number; totalPositiveRate: number }> = {}
    const byStructure: Record<string, { count: number; totalReplyRate: number; totalPositiveRate: number }> = {}
    const byCtaType: Record<string, { count: number; totalReplyRate: number; totalPositiveRate: number }> = {}

    for (const template of data || []) {
      // By tone
      if (template.tone) {
        if (!byTone[template.tone]) {
          byTone[template.tone] = { count: 0, totalReplyRate: 0, totalPositiveRate: 0 }
        }
        byTone[template.tone].count++
        byTone[template.tone].totalReplyRate += Number(template.reply_rate) || 0
        byTone[template.tone].totalPositiveRate += Number(template.positive_reply_rate) || 0
      }

      // By structure
      if (template.structure) {
        if (!byStructure[template.structure]) {
          byStructure[template.structure] = { count: 0, totalReplyRate: 0, totalPositiveRate: 0 }
        }
        byStructure[template.structure].count++
        byStructure[template.structure].totalReplyRate += Number(template.reply_rate) || 0
        byStructure[template.structure].totalPositiveRate += Number(template.positive_reply_rate) || 0
      }

      // By CTA type
      if (template.cta_type) {
        if (!byCtaType[template.cta_type]) {
          byCtaType[template.cta_type] = { count: 0, totalReplyRate: 0, totalPositiveRate: 0 }
        }
        byCtaType[template.cta_type].count++
        byCtaType[template.cta_type].totalReplyRate += Number(template.reply_rate) || 0
        byCtaType[template.cta_type].totalPositiveRate += Number(template.positive_reply_rate) || 0
      }
    }

    // Calculate averages
    const calculateAvg = (stats: Record<string, { count: number; totalReplyRate: number; totalPositiveRate: number }>) => {
      const result: Record<string, { count: number; avgReplyRate: number; avgPositiveRate: number }> = {}
      for (const [key, value] of Object.entries(stats)) {
        result[key] = {
          count: value.count,
          avgReplyRate: value.count > 0 ? value.totalReplyRate / value.count : 0,
          avgPositiveRate: value.count > 0 ? value.totalPositiveRate / value.count : 0,
        }
      }
      return result
    }

    return {
      byTone: calculateAvg(byTone),
      byStructure: calculateAvg(byStructure),
      byCtaType: calculateAvg(byCtaType),
    }
  }

  /**
   * Count templates by source
   */
  async countBySource(workspaceId: string): Promise<Record<string, number>> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('source')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)

    if (error) {
      throw new DatabaseError(error.message)
    }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      const source = row.source || 'custom'
      counts[source] = (counts[source] || 0) + 1
    }

    return counts
  }

  /**
   * Duplicate a template
   */
  async duplicate(
    id: string,
    workspaceId: string,
    newName?: string
  ): Promise<EmailTemplate> {
    const supabase = await createClient()

    // Get original template
    const original = await this.findById(id, workspaceId)
    if (!original) {
      throw new DatabaseError('Template not found')
    }

    // Create copy without id, with new name and reset stats
    const { id: _, created_at, updated_at, ...templateData } = original
    const newTemplate: EmailTemplateInsert = {
      ...templateData,
      name: newName || `${original.name} (Copy)`,
      source: 'custom',
      emails_sent: 0,
      total_replies: 0,
      positive_replies: 0,
      reply_rate: 0,
      positive_reply_rate: 0,
    }

    return this.create(newTemplate)
  }
}
