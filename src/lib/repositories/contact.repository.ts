/**
 * Contact Repository
 * Handles all database operations for CRM contacts
 */

import { createClient } from '@/lib/supabase/server'
import type {
  Contact,
  ContactInsert,
  ContactUpdate,
  ContactFilters,
  SortConfig,
  PaginatedResult,
} from '@/types/crm.types'

export class ContactRepository {
  /**
   * Find all contacts in a workspace
   */
  async findByWorkspace(
    workspaceId: string,
    filters?: ContactFilters,
    sort?: SortConfig[],
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Contact>> {
    const supabase = await createClient()

    let query = supabase
      .from('contacts')
      .select('*, companies(name)', { count: 'exact' })
      .eq('workspace_id', workspaceId)

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.company_id && filters.company_id.length > 0) {
      query = query.in('company_id', filters.company_id)
    }

    if (filters?.seniority_level && filters.seniority_level.length > 0) {
      query = query.in('seniority_level', filters.seniority_level)
    }

    if (filters?.owner_user_id && filters.owner_user_id.length > 0) {
      query = query.in('owner_user_id', filters.owner_user_id)
    }

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,title.ilike.%${filters.search}%`
      )
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
      throw new Error(`Failed to fetch contacts: ${error.message}`)
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
   * Find contact by ID
   */
  async findById(id: string, workspaceId: string): Promise<Contact | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch contact: ${error.message}`)
    }

    return data
  }

  /**
   * Find contacts by company
   */
  async findByCompany(
    companyId: string,
    workspaceId: string,
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Contact>> {
    const supabase = await createClient()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch contacts by company: ${error.message}`)
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
   * Create a new contact
   */
  async create(contact: ContactInsert): Promise<Contact> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create contact: ${error.message}`)
    }

    return data
  }

  /**
   * Update a contact
   */
  async update(id: string, workspaceId: string, updates: ContactUpdate): Promise<Contact> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update contact: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a contact
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new Error(`Failed to delete contact: ${error.message}`)
    }
  }

  /**
   * Find contact by email
   */
  async findByEmail(email: string, workspaceId: string): Promise<Contact | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', email)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch contact by email: ${error.message}`)
    }

    return data
  }

  /**
   * Count contacts in workspace
   */
  async count(workspaceId: string, filters?: ContactFilters): Promise<number> {
    const supabase = await createClient()

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.company_id && filters.company_id.length > 0) {
      query = query.in('company_id', filters.company_id)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count contacts: ${error.message}`)
    }

    return count || 0
  }
}
