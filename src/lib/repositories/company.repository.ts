/**
 * Company Repository
 * Handles all database operations for CRM companies
 */

import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import type {
  Company,
  CompanyInsert,
  CompanyUpdate,
  CompanyFilters,
  SortConfig,
  PaginatedResult,
} from '@/types/crm.types'

export class CompanyRepository {
  /**
   * Find all companies in a workspace
   */
  async findByWorkspace(
    workspaceId: string,
    filters?: CompanyFilters,
    sort?: SortConfig[],
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResult<Company>> {
    const supabase = await createClient()

    let query = supabase
      .from('companies')
      .select('*', { count: 'estimated' })
      .eq('workspace_id', workspaceId)

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.industry && filters.industry.length > 0) {
      query = query.in('industry', filters.industry)
    }

    if (filters?.owner_user_id && filters.owner_user_id.length > 0) {
      query = query.in('owner_user_id', filters.owner_user_id)
    }

    if (filters?.search) {
      const term = sanitizeSearchTerm(filters.search)
      query = query.or(`name.ilike.%${term}%,domain.ilike.%${term}%`)
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
      throw new Error(`Failed to fetch companies: ${error.message}`)
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
   * Find company by ID
   */
  async findById(id: string, workspaceId: string): Promise<Company | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch company: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new company
   */
  async create(company: CompanyInsert): Promise<Company> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create company: ${error.message}`)
    }

    return data
  }

  /**
   * Update a company
   */
  async update(id: string, workspaceId: string, updates: CompanyUpdate): Promise<Company> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update company: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a company
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new Error(`Failed to delete company: ${error.message}`)
    }
  }

  /**
   * Find company by domain
   */
  async findByDomain(domain: string, workspaceId: string): Promise<Company | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('domain', domain)
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch company by domain: ${error.message}`)
    }

    return data
  }

  /**
   * Count companies in workspace
   */
  async count(workspaceId: string, filters?: CompanyFilters): Promise<number> {
    const supabase = await createClient()

    let query = supabase
      .from('companies')
      .select('*', { count: 'estimated', head: true })
      .eq('workspace_id', workspaceId)

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count companies: ${error.message}`)
    }

    return count || 0
  }
}
