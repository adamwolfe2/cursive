/**
 * Deal Repository
 * Handles all database operations for CRM deals
 */

import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import type {
  Deal,
  DealInsert,
  DealUpdate,
  DealFilters,
  SortConfig,
  PaginatedResult,
} from '@/types/crm.types'

export class DealRepository {
  /**
   * Find all deals in a workspace
   */
  async findByWorkspace(
    workspaceId: string,
    filters?: DealFilters,
    sort?: SortConfig[],
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Deal>> {
    const supabase = await createClient()

    let query = supabase
      .from('deals')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)

    // Apply filters
    if (filters?.stage && filters.stage.length > 0) {
      query = query.in('stage', filters.stage)
    }

    if (filters?.company_id && filters.company_id.length > 0) {
      query = query.in('company_id', filters.company_id)
    }

    if (filters?.contact_id && filters.contact_id.length > 0) {
      query = query.in('contact_id', filters.contact_id)
    }

    if (filters?.owner_user_id && filters.owner_user_id.length > 0) {
      query = query.in('owner_user_id', filters.owner_user_id)
    }

    if (filters?.probability_min !== undefined) {
      query = query.gte('probability', filters.probability_min)
    }

    if (filters?.probability_max !== undefined) {
      query = query.lte('probability', filters.probability_max)
    }

    if (filters?.value_min !== undefined) {
      query = query.gte('value', filters.value_min)
    }

    if (filters?.value_max !== undefined) {
      query = query.lte('value', filters.value_max)
    }

    if (filters?.search) {
      const term = sanitizeSearchTerm(filters.search)
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    }

    // Apply sorting
    if (sort && sort.length > 0) {
      sort.forEach(({ field, direction }) => {
        query = query.order(field, { ascending: direction === 'asc' })
      })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch deals: ${error.message}`)
    }

    return {
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    }
  }

  /**
   * Find deal by ID
   */
  async findById(id: string, workspaceId: string): Promise<Deal | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch deal: ${error.message}`)
    }

    return data
  }

  /**
   * Find deals by company
   */
  async findByCompany(
    companyId: string,
    workspaceId: string,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Deal>> {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('deals')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch deals by company: ${error.message}`)
    }

    return {
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    }
  }

  /**
   * Find deals by contact
   */
  async findByContact(
    contactId: string,
    workspaceId: string,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Deal>> {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('deals')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch deals by contact: ${error.message}`)
    }

    return {
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    }
  }

  /**
   * Find deals by stage
   */
  async findByStage(
    stage: string,
    workspaceId: string,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Deal>> {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('deals')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)
      .eq('stage', stage)
      .order('value', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch deals by stage: ${error.message}`)
    }

    return {
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    }
  }

  /**
   * Create a new deal
   */
  async create(deal: DealInsert): Promise<Deal> {
    const supabase = await createClient()

    const { data, error } = await supabase.from('deals').insert(deal).select().single()

    if (error) {
      throw new Error(`Failed to create deal: ${error.message}`)
    }

    return data
  }

  /**
   * Update a deal
   */
  async update(id: string, workspaceId: string, updates: DealUpdate): Promise<Deal> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update deal: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a deal
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new Error(`Failed to delete deal: ${error.message}`)
    }
  }

  /**
   * Move deal to a different stage
   */
  async moveToStage(id: string, workspaceId: string, newStage: string): Promise<Deal> {
    const now = new Date().toISOString()
    const updates: DealUpdate = {
      stage: newStage,
    }

    // If moving to Closed Won or Closed Lost, set closed_at
    if (newStage === 'Closed Won' || newStage === 'Closed Lost') {
      updates.closed_at = now
      updates.probability = newStage === 'Closed Won' ? 100 : 0
    }

    return this.update(id, workspaceId, updates)
  }

  /**
   * Calculate total deal value in workspace
   */
  async calculateTotalValue(workspaceId: string, filters?: DealFilters): Promise<number> {
    const supabase = await createClient()

    let query = supabase.from('deals').select('value').eq('workspace_id', workspaceId)

    if (filters?.stage && filters.stage.length > 0) {
      query = query.in('stage', filters.stage)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to calculate total deal value: ${error.message}`)
    }

    return (data || []).reduce((sum, deal) => sum + (deal.value || 0), 0)
  }

  /**
   * Calculate weighted deal value (value * probability)
   */
  async calculateWeightedValue(workspaceId: string, filters?: DealFilters): Promise<number> {
    const supabase = await createClient()

    let query = supabase
      .from('deals')
      .select('value, probability')
      .eq('workspace_id', workspaceId)

    if (filters?.stage && filters.stage.length > 0) {
      query = query.in('stage', filters.stage)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to calculate weighted deal value: ${error.message}`)
    }

    return (data || []).reduce(
      (sum, deal) => sum + (deal.value || 0) * ((deal.probability || 0) / 100),
      0
    )
  }

  /**
   * Count deals in workspace
   */
  async count(workspaceId: string, filters?: DealFilters): Promise<number> {
    const supabase = await createClient()

    let query = supabase
      .from('deals')
      .select('*', { count: 'estimated', head: true })
      .eq('workspace_id', workspaceId)

    if (filters?.stage && filters.stage.length > 0) {
      query = query.in('stage', filters.stage)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count deals: ${error.message}`)
    }

    return count || 0
  }
}
