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

// AI Email Agent types
export type Agent = Tables<'agents'>
export type EmailInstruction = Tables<'email_instructions'>
export type KBEntry = Tables<'kb_entries'>
export type EmailThread = Tables<'email_threads'>
export type EmailMessage = Tables<'email_messages'>
export type EmailTask = Tables<'email_tasks'>

// Email Campaign types (Sales.co integration)
export type EmailTemplate = Tables<'email_templates'>
export type EmailCampaign = Tables<'email_campaigns'>
export type EmailSend = Tables<'email_sends'>
export type ClientProfile = Tables<'client_profiles'>
export type CampaignLead = Tables<'campaign_leads'>
export type CampaignReview = Tables<'campaign_reviews'>

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

// AI Email Agent insert types
export type AgentInsert = Inserts<'agents'>
export type EmailInstructionInsert = Inserts<'email_instructions'>
export type KBEntryInsert = Inserts<'kb_entries'>
export type EmailThreadInsert = Inserts<'email_threads'>
export type EmailMessageInsert = Inserts<'email_messages'>
export type EmailTaskInsert = Inserts<'email_tasks'>

// AI Email Agent update types
export type AgentUpdate = Updates<'agents'>
export type EmailInstructionUpdate = Updates<'email_instructions'>
export type KBEntryUpdate = Updates<'kb_entries'>
export type EmailThreadUpdate = Updates<'email_threads'>
export type EmailMessageUpdate = Updates<'email_messages'>
export type EmailTaskUpdate = Updates<'email_tasks'>

// Email Campaign insert types
export type EmailTemplateInsert = Inserts<'email_templates'>
export type EmailCampaignInsert = Inserts<'email_campaigns'>
export type EmailSendInsert = Inserts<'email_sends'>
export type ClientProfileInsert = Inserts<'client_profiles'>
export type CampaignLeadInsert = Inserts<'campaign_leads'>
export type CampaignReviewInsert = Inserts<'campaign_reviews'>

// Email Campaign update types
export type EmailTemplateUpdate = Updates<'email_templates'>
export type EmailCampaignUpdate = Updates<'email_campaigns'>
export type EmailSendUpdate = Updates<'email_sends'>
export type ClientProfileUpdate = Updates<'client_profiles'>
export type CampaignLeadUpdate = Updates<'campaign_leads'>
export type CampaignReviewUpdate = Updates<'campaign_reviews'>

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

// ============================================================================
// LEAD DATA TYPES (for DataShopper integration)
// ============================================================================

/**
 * Intent signal from DataShopper
 */
export interface IntentSignal {
  signal_type: string
  detected_at: string
  strength: 'high' | 'medium' | 'low'
  topic?: string
  source?: string
}

/**
 * Company size ranges
 */
export const COMPANY_SIZE_RANGES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1,000 employees' },
  { value: '1001-5000', label: '1,001-5,000 employees' },
  { value: '5001-10000', label: '5,001-10,000 employees' },
  { value: '10000+', label: '10,000+ employees' },
] as const

/**
 * Revenue ranges
 */
export const REVENUE_RANGES = [
  { value: 'Under 1 Million', label: 'Under $1M' },
  { value: '1 Million to 10 Million', label: '$1M - $10M' },
  { value: '10 Million to 50 Million', label: '$10M - $50M' },
  { value: '50 Million to 100 Million', label: '$50M - $100M' },
  { value: '100 Million to 250 Million', label: '$100M - $250M' },
  { value: '250 Million to 500 Million', label: '$250M - $500M' },
  { value: '500 Million to 1 Billion', label: '$500M - $1B' },
  { value: 'Over 1 Billion', label: '$1B+' },
] as const

/**
 * Intent score levels
 */
export const INTENT_SCORES = [
  { value: 'hot', label: 'Hot', color: 'red' },
  { value: 'warm', label: 'Warm', color: 'amber' },
  { value: 'cold', label: 'Cold', color: 'blue' },
] as const

/**
 * Lead source types
 */
export const LEAD_SOURCES = [
  { value: 'datashopper', label: 'DataShopper' },
  { value: 'csv', label: 'CSV Import' },
  { value: 'manual', label: 'Manual Entry' },
  { value: 'query', label: 'Query' },
  { value: 'api', label: 'API' },
] as const

/**
 * DataShopper raw data structure
 */
export interface DataShopperRawData {
  person_id?: string
  company_id?: string
  record_type?: 'person' | 'company'
  matched_topics?: string[]
  intent_signals?: IntentSignal[]
  enrichment_date?: string
  data_quality_score?: number
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
  { value: 'qualified', label: 'Qualified', color: 'blue' },
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

// ============================================================================
// SUPER ADMIN ARCHITECTURE TYPES
// ============================================================================

/**
 * Product tier feature flags
 */
export interface ProductTierFeatures {
  campaigns: boolean
  templates: boolean
  ai_agents: boolean
  people_search: boolean
  integrations: boolean
  api_access: boolean
  white_label: boolean
  dedicated_support: boolean
  custom_domains: boolean
  team_members: number // -1 = unlimited
  max_campaigns: number // -1 = unlimited
  max_templates: number // -1 = unlimited
  max_email_accounts: number // -1 = unlimited
}

/**
 * Product tier definition
 */
export interface ProductTier {
  id: string
  name: string
  slug: string
  display_order: number
  price_monthly: number // in cents
  price_yearly: number // in cents
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
  daily_lead_limit: number
  monthly_lead_limit: number | null
  features: ProductTierFeatures
  description: string | null
  badge_text: string | null
  is_highlighted: boolean
  is_active: boolean
  is_public: boolean
  created_at: string
  updated_at: string
}

/**
 * Workspace tier assignment with overrides
 */
export interface WorkspaceTier {
  id: string
  workspace_id: string
  product_tier_id: string
  billing_cycle: 'monthly' | 'yearly'
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled'
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  feature_overrides: Partial<ProductTierFeatures>
  daily_lead_limit_override: number | null
  monthly_lead_limit_override: number | null
  internal_notes: string | null
  created_at: string
  updated_at: string
  // Relations
  product_tier?: ProductTier
}

/**
 * Super admin impersonation session
 */
export interface SuperAdminSession {
  id: string
  admin_id: string
  workspace_id: string
  started_at: string
  ended_at: string | null
  is_active: boolean
  reason: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  // Relations
  workspace?: Workspace
  admin?: PlatformAdmin
}

/**
 * Platform admin
 */
export interface PlatformAdmin {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Admin audit log entry
 */
export interface AdminAuditLog {
  id: string
  admin_id: string
  action: string
  resource_type: string
  resource_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  workspace_id: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  // Relations
  admin?: PlatformAdmin
  workspace?: Workspace
}

/**
 * Extended workspace with managed account fields
 */
export interface ManagedWorkspace extends Workspace {
  managed_by_cursive: boolean
  onboarding_status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  onboarding_completed_at: string | null
  company_enrichment_data: CompanyEnrichmentData
  logo_url: string | null
  website_url: string | null
  company_size: string | null
  annual_revenue: string | null
  target_industries: string[]
  target_company_sizes: string[]
  target_locations: string[]
  last_activity_at: string
  is_suspended: boolean
  suspended_reason: string | null
  suspended_at: string | null
  // Relations
  tier?: WorkspaceTier
  owner?: User
}

/**
 * Company enrichment data structure
 */
export interface CompanyEnrichmentData {
  clearbit?: {
    name: string
    domain: string
    logo: string | null
    description: string | null
    founded_year: number | null
    employees: number | null
    employee_range: string | null
    annual_revenue: number | null
    revenue_range: string | null
    industry: string | null
    industry_group: string | null
    sub_industry: string | null
    tags: string[]
    tech: string[]
    location: {
      street_number: string | null
      street_name: string | null
      city: string | null
      state: string | null
      state_code: string | null
      country: string | null
      country_code: string | null
      postal_code: string | null
    } | null
    linkedin_handle: string | null
    twitter_handle: string | null
    facebook_handle: string | null
    crunchbase_handle: string | null
    enriched_at: string
  }
  manual?: Record<string, unknown>
  enrichment_status: 'pending' | 'success' | 'failed' | 'not_found'
  enrichment_error: string | null
  last_enriched_at: string | null
}

/**
 * Admin context for authenticated requests
 */
export interface AdminContext {
  admin: PlatformAdmin
  impersonatedWorkspace: Workspace | null
  isImpersonating: boolean
  sessionId: string | null
}

/**
 * Admin action types for audit logging
 */
export type AdminActionType =
  | 'impersonate_start'
  | 'impersonate_end'
  | 'workspace_view'
  | 'workspace_update'
  | 'workspace_suspend'
  | 'workspace_unsuspend'
  | 'tier_change'
  | 'tier_override'
  | 'user_update'
  | 'admin_create'
  | 'admin_update'
  | 'admin_delete'
  | 'settings_change'

/**
 * Tier display info for UI
 */
export interface TierDisplayInfo {
  id: string
  name: string
  slug: string
  price: number // formatted monthly price
  priceYearly: number // formatted yearly price
  features: string[]
  limits: {
    dailyLeads: number | 'Unlimited'
    monthlyLeads: number | 'Unlimited'
    teamMembers: number | 'Unlimited'
    campaigns: number | 'Unlimited'
    templates: number | 'Unlimited'
  }
  isHighlighted: boolean
  badgeText: string | null
}

// ============================================================================
// TIER CONSTANTS
// ============================================================================

export const TIER_SLUGS = {
  FREE: 'free',
  STARTER: 'starter',
  GROWTH: 'growth',
  ENTERPRISE: 'enterprise',
} as const

export type TierSlug = (typeof TIER_SLUGS)[keyof typeof TIER_SLUGS]

export const ONBOARDING_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'gray' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'skipped', label: 'Skipped', color: 'yellow' },
] as const

export const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'trialing', label: 'Trial', color: 'blue' },
  { value: 'past_due', label: 'Past Due', color: 'red' },
  { value: 'canceled', label: 'Canceled', color: 'gray' },
] as const

// ============================================================================
// SERVICE TIER TYPES (for JSONB columns)
// ============================================================================

/**
 * Platform features from service_tiers.platform_features JSONB column
 */
export interface ServiceTierPlatformFeatures {
  lead_downloads?: boolean
  campaigns?: boolean
  ai_agents?: boolean
  api_access?: boolean
  team_seats?: number
  daily_lead_limit?: number
  white_label?: boolean
  custom_integrations?: boolean
}

// ============================================================================
// AI ANALYSIS TYPES (for JSONB columns)
// ============================================================================

/**
 * Structure of the ai_analysis JSONB column on leads
 */
export interface LeadAiAnalysis {
  company?: {
    painPoints?: string[]
    buyingSignals?: string[]
    competitors?: string[]
    opportunities?: string[]
  }
  contact?: {
    interests?: string[]
    communicationStyle?: string
  }
  score?: number
  summary?: string
}

/**
 * Partner data from the payout_requests -> partners join
 */
export interface PayoutPartner {
  id: string
  name: string
  email: string
  stripe_account_id: string | null
  available_balance: number
}

/**
 * Lead contact_data JSONB column structure
 * Supports both flat contact data and nested contacts array format
 */
export interface LeadContactData {
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  title?: string
  linkedin_url?: string
  department?: string
  seniority?: string
  /** Nested contacts array format (used in some enrichment flows) */
  contacts?: Array<{
    full_name?: string
    first_name?: string
    last_name?: string
    title?: string
    email?: string
    phone?: string
    linkedin_url?: string
  }>
  /** Primary contact shorthand (used in some delivery flows) */
  primary_contact?: {
    full_name?: string
    title?: string
    email?: string
    phone?: string
  }
  total_contacts?: number
  enrichment_date?: string | null
}

/**
 * Lead company_data JSONB column structure
 */
export interface LeadCompanyData {
  name?: string
  domain?: string
  industry?: string
  size?: string
  employee_count?: number
  revenue?: string
  description?: string
  website?: string
  location?: {
    city?: string
    state?: string
    country?: string
  }
  technologies?: string[]
  intent_signals?: Array<{
    signal_type: string
    detected_at?: string
    strength?: string
    confidence?: number
  }>
}

/**
 * Lead intent_data JSONB column structure
 */
export interface LeadIntentData {
  topic?: string
  score?: number
  signals?: Array<{
    signal_type: string
    detected_at: string
    strength: string
  }>
}
