// Re-export database types
export type { Database, Json, LeadStatus, NoteType, ActivityType } from './database.types'
export type * from './database.types'

// Helper type for table rows
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

// Helper type for table inserts
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

// Helper type for table updates
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Import database types
import type { Database } from './database.types'

// Convenience type aliases
export type Workspace = Tables<'workspaces'>
export type User = Tables<'users'>
export type GlobalTopic = Tables<'global_topics'>
export type Trend = Tables<'trends'>
export type Query = Tables<'queries'>
export type SavedSearch = Tables<'saved_searches'>
export type Lead = Tables<'leads'>
export type CreditUsage = Tables<'credit_usage'>
export type ExportJob = Tables<'export_jobs'>
export type PeopleSearchResult = Tables<'people_search_results'>
export type SavedPeopleSearch = Tables<'saved_people_searches'>
export type Integration = Tables<'integrations'>
export type BillingEvent = Tables<'billing_events'>
export type NotificationPreferences = Tables<'notification_preferences'>
export type StripeCustomer = Tables<'stripe_customers'>
export type LeadStatusHistory = Tables<'lead_status_history'>
export type LeadNote = Tables<'lead_notes'>
export type LeadActivity = Tables<'lead_activities'>

// Insert types
export type WorkspaceInsert = Inserts<'workspaces'>
export type UserInsert = Inserts<'users'>
export type QueryInsert = Inserts<'queries'>
export type LeadInsert = Inserts<'leads'>
export type LeadNoteInsert = Inserts<'lead_notes'>
export type LeadActivityInsert = Inserts<'lead_activities'>

// Update types
export type WorkspaceUpdate = Updates<'workspaces'>
export type UserUpdate = Updates<'users'>
export type QueryUpdate = Updates<'queries'>
export type LeadUpdate = Updates<'leads'>

// ============================================================================
// STRUCTURED DATA TYPES (from JSONB columns)
// ============================================================================

export interface WorkspaceBranding {
  logo_url: string | null
  primary_color: string
  secondary_color: string
}

export interface QueryFilters {
  location?: {
    country?: string
    state?: string
    city?: string
  } | null
  company_size?: {
    min?: number
    max?: number
  } | null
  industry?: string[] | null
  revenue_range?: {
    min?: number
    max?: number
  } | null
  employee_range?: {
    min?: number
    max?: number
  } | null
  technologies?: string[] | null
  exclude_companies?: string[]
}

export interface CompanyData {
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  location: {
    country?: string
    state?: string
    city?: string
  } | null
  description: string | null
  technologies: string[]
  intent_score: number | null
  intent_signals: Array<{
    signal_type: string
    timestamp: string
    confidence: number
  }>
}

export interface ContactData {
  contacts: Array<{
    full_name: string
    title: string
    email: string
    phone?: string
    linkedin_url?: string
  }>
  total_contacts: number
  enrichment_date: string | null
}

export interface PersonData {
  full_name: string
  title: string | null
  company: string | null
  location: string | null
  linkedin_url: string | null
  email: string | null
  email_revealed: boolean
  phone: string | null
  seniority_level: string | null
  department: string | null
  technologies: string[]
}

export interface PeopleSearchFilters {
  title?: string | null
  company?: string | null
  location?: string | null
  seniority_level?: string | null
  department?: string | null
  industry?: string | null
}

export interface IntegrationConfig {
  // Slack
  webhook_url?: string
  channel?: string
  access_token?: string

  // Zapier
  zapier_webhook_url?: string

  // Generic webhook
  url?: string
  method?: 'GET' | 'POST' | 'PUT'
  headers?: Record<string, string>

  // Email
  recipients?: string[]
  subject_template?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface QueryWizardState {
  step: number
  topic_id: string | null
  topic_name: string | null
  filters: QueryFilters
}

export interface LeadTableFilters {
  query_id?: string
  enrichment_status?: string[]
  delivery_status?: string[]
  date_from?: string
  date_to?: string
  search?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class InsufficientCreditsError extends Error {
  constructor(message: string = 'Insufficient credits') {
    super(message)
    this.name = 'InsufficientCreditsError'
  }
}

// ============================================================================
// LEAD STATUS CONSTANTS
// ============================================================================

export const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'gray' },
  { value: 'contacted', label: 'Contacted', color: 'blue' },
  { value: 'qualified', label: 'Qualified', color: 'purple' },
  { value: 'proposal', label: 'Proposal', color: 'yellow' },
  { value: 'negotiation', label: 'Negotiation', color: 'orange' },
  { value: 'won', label: 'Won', color: 'green' },
  { value: 'lost', label: 'Lost', color: 'red' },
] as const

export const NOTE_TYPES = [
  { value: 'note', label: 'Note', icon: 'document' },
  { value: 'call', label: 'Call', icon: 'phone' },
  { value: 'email', label: 'Email', icon: 'envelope' },
  { value: 'meeting', label: 'Meeting', icon: 'calendar' },
  { value: 'task', label: 'Task', icon: 'check' },
] as const
