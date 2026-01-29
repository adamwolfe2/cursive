/**
 * Campaign Builder Types
 * For Sales.co-style campaign crafting wizard
 * NOT for email sending - content is exported to EmailBison
 */

export type CampaignDraftStatus = 'draft' | 'generating' | 'review' | 'approved' | 'exported'

export type SequenceType = 'cold_outreach' | 'follow_up' | 'nurture' | 're_engagement'
export type SequenceGoal = 'meeting_booked' | 'reply' | 'click' | 'awareness'

export type EmailTone = 'professional' | 'casual' | 'witty' | 'direct' | 'friendly'
export type EmailLength = 'short' | 'medium' | 'long'
export type PersonalizationLevel = 'light' | 'medium' | 'heavy'
export type ReferenceStyle = 'formal' | 'casual' | 'first_name'

export type ExportFormat = 'csv' | 'api' | 'manual'

// ============================================================================
// WIZARD STEP DATA INTERFACES
// ============================================================================

export interface CompanyProfileData {
  company_name: string
  industry: string
  company_size: string
  website_url?: string
  value_proposition: string
  differentiators: string[]
}

export interface ProductDetailsData {
  product_name: string
  problem_solved: string
  key_features: Array<{
    title: string
    description: string
  }>
  pricing_model?: string
  social_proof?: string
  objection_rebuttals: Record<string, string> // objection -> rebuttal
}

export interface ICPData {
  target_titles: string[]
  target_company_sizes: string[]
  target_industries: string[]
  target_locations: string[]
  pain_points: string[]
  buying_triggers: string[]
}

export interface OfferData {
  primary_cta: string
  secondary_cta?: string
  urgency_elements?: string
  meeting_link?: string
}

export interface ToneStyleData {
  tone: EmailTone
  email_length: EmailLength
  personalization_level: PersonalizationLevel
  reference_style?: ReferenceStyle
}

export interface SequenceConfigData {
  email_count: number
  sequence_type: SequenceType
  days_between_emails: number
  sequence_goal: SequenceGoal
}

// ============================================================================
// GENERATED EMAIL INTERFACE
// ============================================================================

export interface GeneratedEmail {
  step: number // 1, 2, 3, etc
  day: number // Day in sequence (0, 3, 6, etc)
  subject: string
  body: string
  personalization_notes?: string // Tips for personalizing this email
  variables?: string[] // Merge tags used in this email
}

// ============================================================================
// CAMPAIGN DRAFT (Full Database Record)
// ============================================================================

export interface CampaignDraft {
  id: string
  workspace_id: string
  created_by: string

  // Metadata
  name: string
  status: CampaignDraftStatus

  // Step 1: Company Profile
  company_name?: string
  industry?: string
  company_size?: string
  website_url?: string
  value_proposition?: string
  differentiators?: string[]

  // Step 2: Product Details
  product_name?: string
  problem_solved?: string
  key_features?: ProductDetailsData['key_features']
  pricing_model?: string
  social_proof?: string
  objection_rebuttals?: Record<string, string>

  // Step 3: ICP
  target_titles?: string[]
  target_company_sizes?: string[]
  target_industries?: string[]
  target_locations?: string[]
  pain_points?: string[]
  buying_triggers?: string[]

  // Step 4: Offer
  primary_cta?: string
  secondary_cta?: string
  urgency_elements?: string
  meeting_link?: string

  // Step 5: Tone & Style
  tone?: EmailTone
  email_length?: EmailLength
  personalization_level?: PersonalizationLevel
  reference_style?: ReferenceStyle

  // Step 6: Sequence
  email_count?: number
  sequence_type?: SequenceType
  days_between_emails?: number
  sequence_goal?: SequenceGoal

  // AI Generation
  generated_emails?: GeneratedEmail[]
  generation_prompt?: string
  ai_model?: string
  generation_error?: string
  generated_at?: string

  // Export
  exported_at?: string
  export_format?: ExportFormat
  emailbison_campaign_id?: string

  // Timestamps
  created_at: string
  updated_at: string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateCampaignDraftRequest {
  name: string
}

export interface UpdateCampaignDraftRequest {
  // Any subset of the wizard fields
  name?: string

  // Step 1
  company_name?: string
  industry?: string
  company_size?: string
  website_url?: string
  value_proposition?: string
  differentiators?: string[]

  // Step 2
  product_name?: string
  problem_solved?: string
  key_features?: ProductDetailsData['key_features']
  pricing_model?: string
  social_proof?: string
  objection_rebuttals?: Record<string, string>

  // Step 3
  target_titles?: string[]
  target_company_sizes?: string[]
  target_industries?: string[]
  target_locations?: string[]
  pain_points?: string[]
  buying_triggers?: string[]

  // Step 4
  primary_cta?: string
  secondary_cta?: string
  urgency_elements?: string
  meeting_link?: string

  // Step 5
  tone?: EmailTone
  email_length?: EmailLength
  personalization_level?: PersonalizationLevel
  reference_style?: ReferenceStyle

  // Step 6
  email_count?: number
  sequence_type?: SequenceType
  days_between_emails?: number
  sequence_goal?: SequenceGoal
}

export interface GenerateCampaignRequest {
  // Optional overrides for generation
  custom_prompt?: string
  regenerate?: boolean // Force regeneration even if content exists
}

export interface GenerateCampaignResponse {
  success: boolean
  draft: CampaignDraft
  emails?: GeneratedEmail[]
  error?: string
}

export interface ExportCampaignResponse {
  success: boolean
  format: ExportFormat
  content?: string // CSV content or JSON
  download_url?: string
  emailbison_campaign_id?: string
}

// ============================================================================
// WIZARD STATE (UI)
// ============================================================================

export interface CampaignBuilderState {
  currentStep: number
  draft: Partial<CampaignDraft>
  loading: boolean
  error: string | null
  completedSteps: Set<number>
}

export const WIZARD_STEPS = [
  { id: 1, key: 'company', title: 'Company Profile', description: 'Tell us about your company' },
  { id: 2, key: 'product', title: 'Product Details', description: 'What are you selling?' },
  { id: 3, key: 'icp', title: 'Ideal Customer', description: 'Who are you targeting?' },
  { id: 4, key: 'offer', title: 'Offer & CTA', description: 'What action do you want?' },
  { id: 5, key: 'tone', title: 'Tone & Style', description: 'How should we communicate?' },
  { id: 6, key: 'sequence', title: 'Sequence Setup', description: 'Timing and follow-ups' },
] as const

export type WizardStepKey = typeof WIZARD_STEPS[number]['key']
