// Lead Repository
// Database access layer for leads with multi-tenant isolation

import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { Lead, LeadInsert, LeadUpdate } from '@/types'
import type { LeadWithRelations, LeadStatus } from '@/types/crm.types'

export interface LeadFilters {
  query_id?: string
  enrichment_status?: 'pending' | 'enriching' | 'enriched' | 'failed'
  delivery_status?: 'pending' | 'delivered' | 'failed'
  intent_score?: 'hot' | 'warm' | 'cold'
  date_from?: string
  date_to?: string
  search?: string // Company name or domain
}

export interface LeadListResult {
  leads: LeadWithRelations[]
  total: number
  page: number
  per_page: number
}

export class LeadRepository {
  /**
   * Find leads by workspace with filters and pagination
   */
  async findByWorkspace(
    workspaceId: string,
    filters: LeadFilters = {},
    page: number = 1,
    perPage: number = 50
  ): Promise<LeadListResult> {
    const supabase = await createClient()

    // PERFORMANCE FIX: Only select columns needed for table view
    // Reduces data transfer from ~250KB to ~20KB per page
    let query = supabase
      .from('leads')
      .select('id, first_name, last_name, full_name, email, phone, company_name, company_domain, job_title, city, state, country, source, status, intent_score_calculated, freshness_score, enrichment_status, verification_status, delivery_status, delivered_at, tags, created_at, updated_at, query_id, queries(name)', {
        count: 'estimated',  // Faster than 'exact' for large tables
      })
      .eq('workspace_id', workspaceId)

    // Apply filters
    if (filters.query_id) {
      query = query.eq('query_id', filters.query_id)
    }

    if (filters.enrichment_status) {
      query = query.eq('enrichment_status', filters.enrichment_status)
    }

    if (filters.delivery_status) {
      query = query.eq('delivery_status', filters.delivery_status)
    }

    if (filters.intent_score) {
      query = query.eq('intent_data->>score', filters.intent_score)
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters.search) {
      // PERFORMANCE FIX: Search in indexed columns instead of JSONB
      const term = sanitizeSearchTerm(filters.search)
      query = query.or(
        `company_name.ilike.%${term}%,company_domain.ilike.%${term}%,contact_name.ilike.%${term}%,contact_email.ilike.%${term}%`
      )
    }

    // Pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data, error, count } = await query

    if (error) {
      safeError('[LeadRepository] Find by workspace error:', error)
      throw new Error(`Failed to fetch leads: ${error.message}`)
    }

    return {
      leads: (data || []) as unknown as LeadWithRelations[],
      total: count || 0,
      page,
      per_page: perPage,
    }
  }

  /**
   * Find lead by ID
   */
  async findById(id: string, workspaceId: string): Promise<LeadWithRelations | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leads')
      .select('*, queries(name, global_topics(topic, category))')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      safeError('[LeadRepository] Find by ID error:', error)
      throw new Error(`Failed to fetch lead: ${error.message}`)
    }

    return data as LeadWithRelations
  }

  /**
   * Get leads by intent score
   */
  async findByIntentScore(
    workspaceId: string,
    score: 'hot' | 'warm' | 'cold'
  ): Promise<Lead[]> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_leads_by_intent_score', {
      p_workspace_id: workspaceId,
      p_score: score,
    })

    if (error) {
      safeError('[LeadRepository] Find by intent score error:', error)
      throw new Error(`Failed to fetch leads by intent score: ${error.message}`)
    }

    return (data as Lead[]) || []
  }

  /**
   * Get leads ready for platform upload
   */
  async findReadyForUpload(
    workspaceId: string,
    minScore: 'warm' | 'hot' = 'warm'
  ): Promise<Lead[]> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_leads_ready_for_upload', {
      p_workspace_id: workspaceId,
      p_min_score: minScore,
    })

    if (error) {
      safeError('[LeadRepository] Find ready for upload error:', error)
      throw new Error(`Failed to fetch leads ready for upload: ${error.message}`)
    }

    return (data as Lead[]) || []
  }

  /**
   * Get intent breakdown statistics
   */
  async getIntentBreakdown(workspaceId: string): Promise<{
    hot_count: number
    warm_count: number
    cold_count: number
    total_count: number
    hot_percentage: number
    warm_percentage: number
  }> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_intent_breakdown')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      safeError('[LeadRepository] Get intent breakdown error:', error)
      return {
        hot_count: 0,
        warm_count: 0,
        cold_count: 0,
        total_count: 0,
        hot_percentage: 0,
        warm_percentage: 0,
      }
    }

    return data as {
      hot_count: number
      warm_count: number
      cold_count: number
      total_count: number
      hot_percentage: number
      warm_percentage: number
    }
  }

  /**
   * Get platform upload stats
   */
  async getPlatformUploadStats(workspaceId: string): Promise<
    Array<{
      platform_name: string
      hot_leads: number
      warm_leads: number
      total_leads: number
      last_upload: string
    }>
  > {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_platform_upload_stats', {
      p_workspace_id: workspaceId,
    })

    if (error) {
      safeError('[LeadRepository] Get platform stats error:', error)
      return []
    }

    return (
      data as Array<{
        platform_name: string
        hot_leads: number
        warm_leads: number
        total_leads: number
        last_upload: string
      }>
    ) || []
  }

  /**
   * Create lead
   */
  async create(lead: LeadInsert): Promise<Lead> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .maybeSingle()

    if (error) {
      safeError('[LeadRepository] Create error:', error)
      throw new Error(`Failed to create lead: ${error.message}`)
    }

    return data as Lead
  }

  /**
   * Update lead
   */
  async update(
    id: string,
    workspaceId: string,
    lead: LeadUpdate
  ): Promise<Lead> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leads')
      .update(lead)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .maybeSingle()

    if (error) {
      safeError('[LeadRepository] Update error:', error)
      throw new Error(`Failed to update lead: ${error.message}`)
    }

    return data as Lead
  }

  /**
   * Delete lead
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      safeError('[LeadRepository] Delete error:', error)
      throw new Error(`Failed to delete lead: ${error.message}`)
    }
  }

  /**
   * Export leads to CSV format
   */
  async exportToCSV(
    workspaceId: string,
    filters: LeadFilters = {}
  ): Promise<string> {
    // Fetch all leads without pagination for export
    const result = await this.findByWorkspace(workspaceId, filters, 1, 10000)

    // CSV headers
    const headers = [
      'Company Name',
      'Domain',
      'Industry',
      'Employee Count',
      'Location',
      'Intent Score',
      'Contact Name',
      'Contact Email',
      'Contact Title',
      'Enrichment Status',
      'Created Date',
      'Query',
    ]

    // CSV rows
    const rows = result.leads.map((lead: any) => {
      const company = lead.company_data || {}
      const contact = lead.contact_data?.primary_contact || {}
      const intent = lead.intent_data || {}
      const query = lead.queries || {}

      return [
        company.name || '',
        company.domain || '',
        company.industry || '',
        company.employee_count || '',
        [company.location?.city, company.location?.state, company.location?.country]
          .filter(Boolean)
          .join(', '),
        intent.score || '',
        contact.full_name || '',
        contact.email || '',
        contact.title || '',
        lead.enrichment_status || '',
        new Date(lead.created_at).toLocaleDateString(),
        query.global_topics?.topic || query.name || '',
      ]
    })

    // Build CSV
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return csv
  }
}
