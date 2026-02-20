/**
 * Activity Repository
 * Handles all database operations for CRM activities
 */

import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import type { Activity, ActivityInsert, ActivityUpdate, SortConfig, PaginatedResult } from '@/types/crm.types'

export interface ActivityFilters {
  activity_type?: string[]
  company_id?: string[]
  contact_id?: string[]
  deal_id?: string[]
  owner_user_id?: string[]
  is_completed?: boolean
  search?: string
}

export class ActivityRepository {
  /**
   * Find all activities in a workspace
   */
  async findByWorkspace(
    workspaceId: string,
    filters?: ActivityFilters,
    sort?: SortConfig[],
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Activity>> {
    const supabase = await createClient()

    let query = supabase
      .from('activities')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)

    // Apply filters
    if (filters?.activity_type && filters.activity_type.length > 0) {
      query = query.in('activity_type', filters.activity_type)
    }

    if (filters?.company_id && filters.company_id.length > 0) {
      query = query.in('company_id', filters.company_id)
    }

    if (filters?.contact_id && filters.contact_id.length > 0) {
      query = query.in('contact_id', filters.contact_id)
    }

    if (filters?.deal_id && filters.deal_id.length > 0) {
      query = query.in('deal_id', filters.deal_id)
    }

    if (filters?.owner_user_id && filters.owner_user_id.length > 0) {
      query = query.in('owner_user_id', filters.owner_user_id)
    }

    if (filters?.is_completed !== undefined) {
      if (filters.is_completed) {
        query = query.not('completed_at', 'is', null)
      } else {
        query = query.is('completed_at', null)
      }
    }

    if (filters?.search) {
      const term = sanitizeSearchTerm(filters.search)
      query = query.or(`subject.ilike.%${term}%,body.ilike.%${term}%`)
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
      throw new Error(`Failed to fetch activities: ${error.message}`)
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
   * Find activity by ID
   */
  async findById(id: string, workspaceId: string): Promise<Activity | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch activity: ${error.message}`)
    }

    return data
  }

  /**
   * Find activities by company
   */
  async findByCompany(
    companyId: string,
    workspaceId: string,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Activity>> {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('activities')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch activities by company: ${error.message}`)
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
   * Find activities by contact
   */
  async findByContact(
    contactId: string,
    workspaceId: string,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Activity>> {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('activities')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch activities by contact: ${error.message}`)
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
   * Find activities by deal
   */
  async findByDeal(
    dealId: string,
    workspaceId: string,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Activity>> {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('activities')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch activities by deal: ${error.message}`)
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
   * Find upcoming tasks/activities (not completed, with due date)
   */
  async findUpcoming(
    workspaceId: string,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Activity>> {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('activities')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)
      .is('completed_at', null)
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch upcoming activities: ${error.message}`)
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
   * Find overdue tasks/activities
   */
  async findOverdue(
    workspaceId: string,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Activity>> {
    const supabase = await createClient()

    const now = new Date().toISOString()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('activities')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)
      .is('completed_at', null)
      .lt('due_date', now)
      .order('due_date', { ascending: true })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch overdue activities: ${error.message}`)
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
   * Create a new activity
   */
  async create(activity: ActivityInsert): Promise<Activity> {
    const supabase = await createClient()

    const { data, error } = await supabase.from('activities').insert(activity).select().maybeSingle()

    if (error) {
      throw new Error(`Failed to create activity: ${error.message}`)
    }

    return data
  }

  /**
   * Update an activity
   */
  async update(id: string, workspaceId: string, updates: ActivityUpdate): Promise<Activity> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to update activity: ${error.message}`)
    }

    return data
  }

  /**
   * Delete an activity
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new Error(`Failed to delete activity: ${error.message}`)
    }
  }

  /**
   * Mark activity as completed
   */
  async markComplete(id: string, workspaceId: string): Promise<Activity> {
    const now = new Date().toISOString()
    return this.update(id, workspaceId, { completed_at: now })
  }

  /**
   * Mark activity as incomplete
   */
  async markIncomplete(id: string, workspaceId: string): Promise<Activity> {
    return this.update(id, workspaceId, { completed_at: null } as any)
  }

  /**
   * Count activities in workspace
   */
  async count(workspaceId: string, filters?: ActivityFilters): Promise<number> {
    const supabase = await createClient()

    let query = supabase
      .from('activities')
      .select('*', { count: 'estimated', head: true })
      .eq('workspace_id', workspaceId)

    if (filters?.activity_type && filters.activity_type.length > 0) {
      query = query.in('activity_type', filters.activity_type)
    }

    if (filters?.is_completed !== undefined) {
      if (filters.is_completed) {
        query = query.not('completed_at', 'is', null)
      } else {
        query = query.is('completed_at', null)
      }
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count activities: ${error.message}`)
    }

    return count || 0
  }
}
