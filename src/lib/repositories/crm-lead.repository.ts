// CRM Lead Repository
// Repository pattern for CRM lead data access

import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import type { LeadFilters, LeadTableRow, LeadUpdatePayload } from '@/types/crm.types'
import { safeError } from '@/lib/utils/log-sanitizer'

export class CRMLeadRepository {
  async findByWorkspace(
    workspaceId: string,
    filters: LeadFilters
  ): Promise<{ leads: LeadTableRow[]; total: number }> {
    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('leads')
      .select(
        `
        *,
        assigned_user:users!leads_assigned_user_id_fkey(
          id,
          full_name,
          email
        )
      `,
        { count: 'estimated' }
      )
      .eq('workspace_id', workspaceId)

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.industries && filters.industries.length > 0) {
      query = query.in('company_industry', filters.industries)
    }

    if (filters.states && filters.states.length > 0) {
      query = query.in('state', filters.states)
    }

    if (filters.companySizes && filters.companySizes.length > 0) {
      query = query.in('company_size', filters.companySizes)
    }

    if (filters.intentScoreMin !== undefined) {
      query = query.gte('intent_score_calculated', filters.intentScoreMin)
    }

    if (filters.intentScoreMax !== undefined) {
      query = query.lte('intent_score_calculated', filters.intentScoreMax)
    }

    if (filters.freshnessMin !== undefined) {
      query = query.gte('freshness_score', filters.freshnessMin)
    }

    if (filters.hasPhone) {
      query = query.not('phone', 'is', null)
    }

    if (filters.hasVerifiedEmail) {
      query = query.eq('verification_status', 'valid')
    }

    if (filters.assignedUserId) {
      query = query.eq('assigned_user_id', filters.assignedUserId)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    // Full-text search
    if (filters.search) {
      const term = sanitizeSearchTerm(filters.search)
      query = query.or(
        `first_name.ilike.%${term}%,` +
          `last_name.ilike.%${term}%,` +
          `email.ilike.%${term}%,` +
          `company_name.ilike.%${term}%`
      )
    }

    // Sorting
    const orderBy = filters.orderBy || 'created_at'
    const orderDirection = filters.orderDirection || 'desc'
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Pagination
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      safeError('[CRMLeadRepository] Failed to fetch leads:', error)
      throw new Error('Failed to fetch leads')
    }

    return {
      leads: (data as LeadTableRow[]) || [],
      total: count || 0,
    }
  }

  async findById(
    leadId: string,
    workspaceId: string
  ): Promise<LeadTableRow | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leads')
      .select(
        `
        *,
        assigned_user:users!leads_assigned_user_id_fkey(
          id,
          full_name,
          email
        )
      `
      )
      .eq('id', leadId)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      safeError('[CRMLeadRepository] Failed to fetch lead:', error)
      throw new Error('Failed to fetch lead')
    }

    return data as LeadTableRow
  }

  async create(
    leadData: Omit<LeadTableRow, 'id' | 'updated_at'>
  ): Promise<LeadTableRow> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select(
        `
        *,
        assigned_user:users!leads_assigned_user_id_fkey(
          id,
          full_name,
          email
        )
      `
      )
      .maybeSingle()

    if (error) {
      safeError('[CRMLeadRepository] Failed to create lead:', error)
      throw new Error('Failed to create lead')
    }

    return data as LeadTableRow
  }

  async update(
    leadId: string,
    updates: LeadUpdatePayload,
    workspaceId: string
  ): Promise<LeadTableRow> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .eq('workspace_id', workspaceId) // Security: workspace isolation
      .select(
        `
        *,
        assigned_user:users!leads_assigned_user_id_fkey(
          id,
          full_name,
          email
        )
      `
      )
      .maybeSingle()

    if (error) {
      safeError('[CRMLeadRepository] Failed to update lead:', error)
      throw new Error('Failed to update lead')
    }

    return data as LeadTableRow
  }

  async bulkUpdate(
    leadIds: string[],
    updates: LeadUpdatePayload,
    workspaceId: string
  ): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', leadIds)
      .eq('workspace_id', workspaceId)

    if (error) {
      safeError('[CRMLeadRepository] Failed to bulk update leads:', error)
      throw new Error('Failed to bulk update leads')
    }
  }

  async delete(leadId: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('workspace_id', workspaceId)

    if (error) {
      safeError('[CRMLeadRepository] Failed to delete lead:', error)
      throw new Error('Failed to delete lead')
    }
  }

  async bulkDelete(leadIds: string[], workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', leadIds)
      .eq('workspace_id', workspaceId)

    if (error) {
      safeError('[CRMLeadRepository] Failed to bulk delete leads:', error)
      throw new Error('Failed to bulk delete leads')
    }
  }
}
