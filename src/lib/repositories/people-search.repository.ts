// People Search Repository
// Database access layer for people search with credit tracking

import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export interface PeopleSearchFilters {
  company?: string
  domain?: string
  job_title?: string
  seniority?: string
  department?: string
  location?: string
  industry?: string
}

export interface SavedSearch {
  id: string
  workspace_id: string
  name: string
  filters: PeopleSearchFilters
  created_at: string
}

export interface PeopleSearchResult {
  id: string
  workspace_id: string
  person_data: {
    first_name: string
    last_name: string
    full_name: string
    email?: string
    email_revealed: boolean
    phone?: string
    title?: string
    seniority?: string
    department?: string
    company_name?: string
    company_domain?: string
    location?: string
    linkedin_url?: string
  }
  search_filters: PeopleSearchFilters
  revealed_at?: string
  created_at: string
}

export class PeopleSearchRepository {
  /**
   * Find saved searches by workspace
   */
  async findSavedSearches(workspaceId: string): Promise<SavedSearch[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[PeopleSearchRepository] Find saved searches error:', error)
      throw new Error(`Failed to fetch saved searches: ${error.message}`)
    }

    return (data as any) || []
  }

  /**
   * Save a search
   */
  async saveSearch(
    workspaceId: string,
    name: string,
    filters: PeopleSearchFilters
  ): Promise<SavedSearch> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        workspace_id: workspaceId,
        name,
        filters,
      })
      .select()
      .maybeSingle()

    if (error) {
      safeError('[PeopleSearchRepository] Save search error:', error)
      throw new Error(`Failed to save search: ${error.message}`)
    }

    return data as any
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      safeError('[PeopleSearchRepository] Delete saved search error:', error)
      throw new Error(`Failed to delete saved search: ${error.message}`)
    }
  }

  /**
   * Find search results by workspace
   */
  async findResults(
    workspaceId: string,
    filters?: PeopleSearchFilters
  ): Promise<PeopleSearchResult[]> {
    const supabase = await createClient()

    let query = supabase
      .from('people_search_results')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (filters) {
      // Escape SQL wildcard chars so literal % and _ in filter values don't act as wildcards
      const esc = (s: string) => s.replace(/[%_\\]/g, '\\$&')
      if (filters.company) {
        query = query.ilike('person_data->>company_name', `%${esc(filters.company)}%`)
      }
      if (filters.job_title) {
        query = query.ilike('person_data->>title', `%${esc(filters.job_title)}%`)
      }
      if (filters.location) {
        query = query.ilike('person_data->>location', `%${esc(filters.location)}%`)
      }
    }

    const { data, error } = await query.limit(100)

    if (error) {
      safeError('[PeopleSearchRepository] Find results error:', error)
      throw new Error(`Failed to fetch search results: ${error.message}`)
    }

    return (data as any) || []
  }

  /**
   * Create search result
   */
  async createResult(
    workspaceId: string,
    personData: any,
    searchFilters: PeopleSearchFilters
  ): Promise<PeopleSearchResult> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('people_search_results')
      .insert({
        workspace_id: workspaceId,
        person_data: personData,
        search_filters: searchFilters,
      })
      .select()
      .maybeSingle()

    if (error) {
      safeError('[PeopleSearchRepository] Create result error:', error)
      throw new Error(`Failed to create search result: ${error.message}`)
    }

    return data as any
  }

  /**
   * Reveal email (costs 1 credit)
   */
  async revealEmail(
    resultId: string,
    workspaceId: string,
    userId: string
  ): Promise<{ email: string; credits_remaining: number }> {
    const supabase = await createClient()

    // Use database function to handle atomic credit deduction and email reveal
    const { data, error } = await supabase.rpc('reveal_person_email', {
      p_result_id: resultId,
      p_user_id: userId,
    })

    if (error) {
      safeError('[PeopleSearchRepository] Reveal email error:', error)

      // Check if it's a credit limit error
      if (error.message?.includes('Insufficient credits')) {
        throw new Error('Insufficient credits. Upgrade to Pro or wait for daily reset.')
      }

      throw new Error(`Failed to reveal email: ${error.message}`)
    }

    return data as any
  }

  /**
   * Get credit usage stats
   */
  async getCreditUsage(
    workspaceId: string,
    startDate?: string,
    endDate?: string
  ): Promise<
    Array<{
      action_type: string
      credits_used: number
      count: number
    }>
  > {
    const supabase = await createClient()

    let query = supabase
      .from('credit_usage')
      .select('action_type, credits_used')
      .eq('workspace_id', workspaceId)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      safeError('[PeopleSearchRepository] Get credit usage error:', error)
      throw new Error(`Failed to fetch credit usage: ${error.message}`)
    }

    // Aggregate by action type
    const aggregated: Record<string, { credits_used: number; count: number }> = {}

    ;(data || []).forEach((item: any) => {
      if (!aggregated[item.action_type]) {
        aggregated[item.action_type] = { credits_used: 0, count: 0 }
      }
      aggregated[item.action_type].credits_used += item.credits_used
      aggregated[item.action_type].count += 1
    })

    return Object.entries(aggregated).map(([action_type, stats]) => ({
      action_type,
      ...stats,
    }))
  }

  /**
   * Check if user has credits available
   */
  async checkCredits(userId: string, creditsNeeded: number = 1): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('check_credits_available', {
      p_user_id: userId,
      p_credits_needed: creditsNeeded,
    })

    if (error) {
      safeError('[PeopleSearchRepository] Check credits error:', error)
      return false
    }

    return data as boolean
  }
}
