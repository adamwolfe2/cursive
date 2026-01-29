// CRM Types
// Defines types for the CRM module

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost'

export interface LeadFilters {
  search?: string
  status?: LeadStatus[]
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
  page: number
  pageSize: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface LeadTableRow {
  id: string
  status: LeadStatus
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  job_title: string | null
  company_name: string | null
  company_domain: string | null
  company_industry: string | null
  company_size: string | null
  city: string | null
  state: string | null
  country: string | null
  linkedin_url: string | null
  intent_score_calculated: number | null
  freshness_score: number | null
  marketplace_price: number | null
  verification_status: string | null
  assigned_user_id: string | null
  assigned_user?: {
    id: string
    full_name: string | null
    email: string | null
  } | null
  tags: string[]
  notes: string | null
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  next_follow_up_at: string | null
}

export interface BulkAction {
  type: 'update_status' | 'assign' | 'add_tags' | 'remove_tags' | 'delete'
  data: Record<string, unknown>
}

export interface ColumnVisibility {
  [key: string]: boolean
}

export type TableDensity = 'comfortable' | 'compact'

export interface LeadUpdatePayload {
  status?: LeadStatus
  assigned_user_id?: string | null
  tags?: string[]
  notes?: string
  last_contacted_at?: string
  next_follow_up_at?: string
}

export interface BulkUpdatePayload {
  ids: string[]
  updates: LeadUpdatePayload
}
