/**
 * API Types
 * OpenInfo Platform
 *
 * Standardized types for API routes, webhooks, and responses.
 */

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Standard success response
 */
export interface SuccessResponse<T = unknown> {
  success: true
  data: T
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * Combined API response type
 */
export type ApiResult<T> = SuccessResponse<T> | ErrorResponse

/**
 * Paginated list response
 */
export interface PaginatedResult<T> {
  success: true
  data: T[]
  pagination: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

// ============================================
// WEBHOOK PAYLOAD TYPES
// ============================================

/**
 * Base webhook event structure
 */
export interface WebhookEvent<T = unknown> {
  id: string
  type: string
  created: number
  data: T
}

/**
 * Stripe webhook event types
 */
export interface StripeWebhookPayload {
  id: string
  object: 'event'
  api_version: string
  created: number
  data: {
    object: Record<string, unknown>
    previous_attributes?: Record<string, unknown>
  }
  livemode: boolean
  pending_webhooks: number
  request: { id: string; idempotency_key: string } | null
  type: string
}

/**
 * Email webhook event (Resend, SendGrid, etc.)
 */
export interface EmailWebhookPayload {
  event: {
    type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained'
    created_at: string
  }
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    tracking_id?: string
  }
}

/**
 * Inbound email webhook payload
 */
export interface InboundEmailPayload {
  from: string
  fromName?: string
  to?: string
  subject?: string
  text?: string
  html?: string
  inReplyTo?: string
}

// ============================================
// LEAD TYPES
// ============================================

/**
 * Lead intent score
 */
export type IntentScore = 'hot' | 'warm' | 'cold'

/**
 * Lead enrichment status
 */
export type EnrichmentStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

/**
 * Lead delivery status
 */
export type DeliveryStatus = 'pending' | 'delivered' | 'failed'

/**
 * Lead location
 */
export interface LeadLocation {
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
}

/**
 * Lead contact
 */
export interface LeadContact {
  name: string
  title?: string
  email?: string
  phone?: string
  linkedin_url?: string
  is_verified?: boolean
}

/**
 * Basic lead data for list views
 */
export interface LeadSummary {
  id: string
  workspace_id: string
  company_name: string | null
  company_industry: string | null
  company_location: LeadLocation | null
  first_name: string | null
  last_name: string | null
  email: string | null
  lead_score: number | null
  intent_score: IntentScore | null
  enrichment_status: EnrichmentStatus
  delivery_status: DeliveryStatus
  created_at: string
}

// ============================================
// CAMPAIGN TYPES
// ============================================

/**
 * Campaign status
 */
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

/**
 * Email send status
 */
export type EmailSendStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
  | 'failed'

/**
 * Reply sentiment
 */
export type ReplySentiment = 'positive' | 'negative' | 'neutral' | 'question' | 'not_interested' | 'out_of_office'

// ============================================
// USER & WORKSPACE TYPES
// ============================================

/**
 * User role
 */
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

/**
 * Subscription tier
 */
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise'

/**
 * Subscription status
 */
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'

/**
 * Basic user info
 */
export interface UserInfo {
  id: string
  auth_user_id: string
  workspace_id: string
  email: string
  full_name: string | null
  role: UserRole
}

/**
 * Workspace info
 */
export interface WorkspaceInfo {
  id: string
  name: string
  slug: string
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  is_active: boolean
}

// ============================================
// REQUEST BODY TYPES
// ============================================

/**
 * Bulk action request body
 */
export interface BulkActionRequest {
  ids: string[]
  action: string
  data?: Record<string, unknown>
}

/**
 * Search/filter request params
 */
export interface SearchParams {
  query?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  filters?: Record<string, string | string[] | number | boolean>
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  from?: string
  to?: string
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Make certain fields optional in a type
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Extract the data type from an ApiResult
 */
export type ExtractData<T> = T extends SuccessResponse<infer D> ? D : never

/**
 * JSON-serializable value
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

/**
 * Type guard for checking if response is successful
 */
export function isSuccess<T>(result: ApiResult<T>): result is SuccessResponse<T> {
  return result.success === true
}

/**
 * Type guard for checking if response is an error
 */
export function isError(result: ApiResult<unknown>): result is ErrorResponse {
  return result.success === false
}
