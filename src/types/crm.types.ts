/**
 * CRM TypeScript Types
 * For companies, contacts, deals, and activities
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface Company {
  id: string
  workspace_id: string
  name: string
  domain?: string
  industry?: string
  employees_range?: string
  revenue_range?: string
  website?: string
  phone?: string
  email?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  linkedin_url?: string
  twitter_url?: string
  status: string
  owner_user_id?: string
  enriched_at?: string
  enrichment_data?: Record<string, any>
  created_at: string
  updated_at: string
  created_by_user_id?: string
  updated_by_user_id?: string
}

export interface Contact {
  id: string
  workspace_id: string
  company_id?: string
  first_name?: string
  last_name?: string
  full_name?: string
  title?: string
  email?: string
  phone?: string
  mobile?: string
  linkedin_url?: string
  twitter_url?: string
  status: string
  owner_user_id?: string
  seniority_level?: string
  created_at: string
  updated_at: string
  created_by_user_id?: string
  updated_by_user_id?: string
}

/** Contact with joined company data from Supabase relation query */
export interface ContactWithCompany extends Contact {
  companies?: {
    name: string
  } | null
}

export interface Deal {
  id: string
  workspace_id: string
  company_id?: string
  contact_id?: string
  name: string
  description?: string
  value: number
  currency: string
  stage: string
  probability: number
  close_date?: string
  closed_at?: string
  owner_user_id?: string
  created_at: string
  updated_at: string
  created_by_user_id?: string
  updated_by_user_id?: string
}

export interface Activity {
  id: string
  workspace_id: string
  activity_type: string
  company_id?: string
  contact_id?: string
  deal_id?: string
  subject?: string
  body?: string
  due_date?: string
  completed_at?: string
  owner_user_id?: string
  created_at: string
  updated_at: string
  created_by_user_id?: string
}

// ============================================================================
// INSERT TYPES
// ============================================================================

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at' | 'full_name'>
export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'full_name'>
export type DealInsert = Omit<Deal, 'id' | 'created_at' | 'updated_at'>
export type ActivityInsert = Omit<Activity, 'id' | 'created_at' | 'updated_at'>

// ============================================================================
// UPDATE TYPES
// ============================================================================

export type CompanyUpdate = Partial<CompanyInsert>
export type ContactUpdate = Partial<ContactInsert>
export type DealUpdate = Partial<DealInsert>
export type ActivityUpdate = Partial<ActivityInsert>

// ============================================================================
// ENUMS
// ============================================================================

export type CompanyStatus = 'Active' | 'Prospect' | 'Inactive' | 'Lost'
export type ContactStatus = 'Active' | 'Prospect' | 'Inactive' | 'Lost'
export type DealStage = 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task'
export type SeniorityLevel = 'C-Level' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor'

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

export interface CompanyFilters {
  status?: CompanyStatus[]
  industry?: string[]
  owner_user_id?: string[]
  search?: string
}

export interface ContactFilters {
  status?: ContactStatus[]
  company_id?: string[]
  seniority_level?: SeniorityLevel[]
  owner_user_id?: string[]
  search?: string
}

export interface DealFilters {
  stage?: DealStage[]
  company_id?: string[]
  contact_id?: string[]
  owner_user_id?: string[]
  probability_min?: number
  probability_max?: number
  value_min?: number
  value_max?: number
  search?: string
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: string
  direction: SortDirection
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

// ============================================================================
// CRM LEADS (Marketplace Leads in CRM Interface)
// ============================================================================

// Lead status enum (imported from database types)
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

// LeadTableRow represents a marketplace lead with joined user data
export interface LeadTableRow {
  id: string
  workspace_id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_name?: string
  company_industry?: string
  business_type?: string
  title?: string
  job_title?: string
  city?: string
  state?: string
  country?: string
  company_size?: string
  company_domain?: string
  source?: string
  status: LeadStatus
  assigned_user_id?: string
  assigned_user?: {
    id: string
    full_name: string
    email: string
  }
  tags?: string[]
  intent_score_calculated?: number
  freshness_score?: number
  verification_status?: string
  marketplace_price?: number
  created_at: string
  updated_at: string
  last_contacted_at?: string
  next_follow_up_at?: string
  notes?: string
  linkedin_url?: string
}

// Column visibility settings for the leads table
export type ColumnVisibility = Record<string, boolean>

// Table display density
export type TableDensity = 'compact' | 'comfortable'

export interface LeadFilters extends PaginationParams {
  status?: string[]
  industries?: string[]
  states?: string[]
  companySizes?: string[]
  intentScoreMin?: number
  intentScoreMax?: number
  freshnessMin?: number
  hasPhone?: boolean
  hasVerifiedEmail?: boolean
  assignedUserId?: string
  tags?: string[]
  search?: string
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface LeadUpdatePayload {
  status?: LeadStatus
  assigned_user_id?: string | null
  tags?: string[]
  notes?: string
  last_contacted_at?: string
  next_follow_up_at?: string
}

// Lead with joined relations (for repository queries)
export interface LeadWithRelations {
  id: string
  workspace_id: string
  query_id: string | null
  company_name: string
  company_industry: string | null
  company_location: any | null
  email: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  job_title: string | null
  phone: string | null
  linkedin_url: string | null
  company_domain: string | null
  source: string
  enrichment_status: string
  delivery_status: string
  routing_rule_id: string | null
  routing_metadata: any | null
  created_at: string
  contact_title: string | null
  contact_seniority: string | null
  contact_department: string | null
  company_size: string | null
  company_revenue: string | null
  company_website: string | null
  company_employee_count: number | null
  company_founded_year: number | null
  company_description: string | null
  city: string | null
  state: string | null
  state_code: string | null
  country: string | null
  country_code: string | null
  postal_code: string | null
  address: string | null
  datashopper_id: number | null
  intent_topic: string | null
  intent_topic_id: string | null
  intent_score: string | null
  intent_signals: any
  datashopper_person_id: string | null
  datashopper_company_id: string | null
  datashopper_record_type: string | null
  datashopper_raw_data: any
  status: LeadStatus
  secondary_email: string | null
  mobile_phone: string | null
  work_phone: string | null
  // Joined relations
  queries?: {
    name: string
    global_topics: {
      topic: string
      category: string
    } | null
  } | null
}
