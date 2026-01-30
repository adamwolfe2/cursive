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
  state?: string
  company_size?: string
  status: string
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
  created_at: string
  updated_at: string
  last_contacted_at?: string
  next_follow_up_at?: string
  notes?: string
}

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
  status?: string
  assigned_user_id?: string | null
  tags?: string[]
  notes?: string
  last_contacted_at?: string
  next_follow_up_at?: string
}
