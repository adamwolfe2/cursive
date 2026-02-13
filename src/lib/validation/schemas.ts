import { z } from 'zod'

// ============================================================================
// REUSABLE SCHEMAS
// ============================================================================

// Unified password schema used across all auth forms
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema, // Use unified password schema
  confirm_password: z.string(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z.object({
  password: passwordSchema, // Use unified password schema
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

// ============================================================================
// QUERY WIZARD SCHEMAS (5 STEPS)
// ============================================================================

// Step 1: Topic Selection
export const topicSearchSchema = z.object({
  topic_id: z.string().min(1, 'Please select a topic'),
  topic_name: z.string().min(1, 'Topic name is required'),
})

// Step 2: Location Filter
export const locationFilterSchema = z.object({
  location: z.object({
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
})

// Step 3: Company Size Filter
export const companySizeFilterSchema = z.object({
  company_size: z.object({
    min: z.number().min(1).optional(),
    max: z.number().min(1).optional(),
  }).optional(),
  employee_range: z.object({
    min: z.number().min(1).optional(),
    max: z.number().min(1).optional(),
  }).optional(),
}).refine((data) => {
  if (data.company_size?.min && data.company_size?.max) {
    return data.company_size.min <= data.company_size.max
  }
  return true
}, {
  message: 'Minimum company size must be less than maximum',
  path: ['company_size.min'],
}).refine((data) => {
  if (data.employee_range?.min && data.employee_range?.max) {
    return data.employee_range.min <= data.employee_range.max
  }
  return true
}, {
  message: 'Minimum employee count must be less than maximum',
  path: ['employee_range.min'],
})

// Step 4: Industry Filter
export const industryFilterSchema = z.object({
  industry: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  revenue_range: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
}).refine((data) => {
  if (data.revenue_range?.min && data.revenue_range?.max) {
    return data.revenue_range.min <= data.revenue_range.max
  }
  return true
}, {
  message: 'Minimum revenue must be less than maximum',
  path: ['revenue_range.min'],
})

// Step 5: Review and Create
export const createQuerySchema = z.object({
  topic_id: z.string().min(1, 'Topic is required'),
  filters: z.object({
    location: z.object({
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
    }).optional().nullable(),
    company_size: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional().nullable(),
    industry: z.array(z.string()).optional().nullable(),
    revenue_range: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional().nullable(),
    employee_range: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional().nullable(),
    technologies: z.array(z.string()).optional().nullable(),
    exclude_companies: z.array(z.string()).optional(),
  }),
})

// ============================================================================
// PEOPLE SEARCH SCHEMA
// ============================================================================

export const peopleSearchSchema = z.object({
  domain: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  seniority: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  save_search: z.boolean().optional(),
  search_name: z.string().optional(),
}).refine((data) => data.domain || data.company, {
  message: 'Either company domain or company name is required',
  path: ['domain'],
}).refine((data) => {
  if (data.save_search && !data.search_name) {
    return false
  }
  return true
}, {
  message: 'Search name is required when saving a search',
  path: ['search_name'],
})

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================

// Profile Settings
export const profileSettingsSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().optional(),
  job_title: z.string().optional(),
  phone: z.string().optional(),
})

// Password Update
export const passwordUpdateSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema, // Use unified password schema
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
}).refine((data) => data.current_password !== data.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password'],
})

// Notification Settings
export const notificationSettingsSchema = z.object({
  email_notifications: z.boolean(),
  slack_notifications: z.boolean(),
  new_leads: z.boolean(),
  daily_digest: z.boolean(),
  weekly_report: z.boolean(),
  query_updates: z.boolean(),
  credit_alerts: z.boolean(),
})

// Billing Settings
export const billingSettingsSchema = z.object({
  company_name: z.string().optional(),
  billing_email: z.string().email('Please enter a valid email address').optional(),
  tax_id: z.string().optional(),
  billing_address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
})

// ============================================================================
// INTEGRATION SCHEMAS
// ============================================================================

// Slack Integration
export const slackIntegrationSchema = z.object({
  webhook_url: z.string().url('Please enter a valid webhook URL'),
  channel: z.string().min(1, 'Channel name is required'),
  notify_on_new_leads: z.boolean().optional(),
  notify_on_hot_leads: z.boolean().optional(),
})

// Webhook Integration
export const webhookIntegrationSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT']).default('POST'),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().default(true),
})

// Zapier Integration
export const zapierIntegrationSchema = z.object({
  webhook_url: z.string().url('Please enter a valid Zapier webhook URL'),
  enabled: z.boolean().default(true),
})

// ============================================================================
// MARKETPLACE SCHEMAS
// ============================================================================

// Buyer Profile
export const buyerProfileSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry_vertical: z.string().min(1, 'Please select an industry vertical'),
  service_states: z.array(z.string()).min(1, 'Please select at least one service state'),
  budget_per_lead: z.number().min(0.01, 'Budget must be greater than 0').optional(),
  monthly_lead_target: z.number().int().min(1).optional(),
  contact_phone: z.string().optional(),
})

// Lead Purchase
export const leadPurchaseSchema = z.object({
  lead_ids: z.array(z.string()).min(1, 'Please select at least one lead'),
  payment_method: z.enum(['credits', 'card']),
  agree_to_terms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the purchase terms',
  }),
})

// ============================================================================
// LEAD EXPORT SCHEMA
// ============================================================================

export const leadExportSchema = z.object({
  query_id: z.string().optional(),
  format: z.enum(['csv', 'json', 'xlsx']),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  enrichment_status: z.array(z.string()).optional(),
  delivery_status: z.array(z.string()).optional(),
  include_contacts: z.boolean().default(true),
  include_company_data: z.boolean().default(true),
})

// ============================================================================
// CONTACT FORM SCHEMA
// ============================================================================

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export type TopicSearchFormData = z.infer<typeof topicSearchSchema>
export type LocationFilterFormData = z.infer<typeof locationFilterSchema>
export type CompanySizeFilterFormData = z.infer<typeof companySizeFilterSchema>
export type IndustryFilterFormData = z.infer<typeof industryFilterSchema>
export type CreateQueryFormData = z.infer<typeof createQuerySchema>

export type PeopleSearchFormData = z.infer<typeof peopleSearchSchema>

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>
export type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>
export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>
export type BillingSettingsFormData = z.infer<typeof billingSettingsSchema>

export type SlackIntegrationFormData = z.infer<typeof slackIntegrationSchema>
export type WebhookIntegrationFormData = z.infer<typeof webhookIntegrationSchema>
export type ZapierIntegrationFormData = z.infer<typeof zapierIntegrationSchema>

export type BuyerProfileFormData = z.infer<typeof buyerProfileSchema>
export type LeadPurchaseFormData = z.infer<typeof leadPurchaseSchema>
export type LeadExportFormData = z.infer<typeof leadExportSchema>

export type ContactFormData = z.infer<typeof contactFormSchema>
