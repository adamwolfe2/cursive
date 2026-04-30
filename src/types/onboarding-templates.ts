// Onboarding Template Types
// Types for the template system and AI intake parsing

import type { PackageSlug } from './onboarding'

// ---------------------------------------------------------------------------
// Template record (matches DB schema)
// ---------------------------------------------------------------------------

export interface OnboardingTemplate {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  category: TemplateCategory | null
  is_default: boolean
  template_data: TemplateData
}

export type TemplateCategory = 'Agency' | 'SaaS' | 'E-commerce' | 'Services' | 'Custom'

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Agency',
  'SaaS',
  'E-commerce',
  'Services',
  'Custom',
]

// ---------------------------------------------------------------------------
// Template data shape (partial onboarding fields)
// ---------------------------------------------------------------------------

export interface TemplateData {
  packages_selected?: PackageSlug[]
  target_industries?: string[]
  sub_industries?: string[]
  target_company_sizes?: string[]
  target_titles?: string[]
  target_geography?: string[]
  specific_regions?: string
  must_have_traits?: string
  exclusion_criteria?: string
  pain_points?: string
  intent_keywords?: string[]
  competitor_names?: string[]
  copy_tone?: string
  primary_cta?: string
  data_use_cases?: string[]
  primary_crm?: string
  data_format?: string
  audience_count?: string
  sending_volume?: string
  lead_volume?: string
  [key: string]: unknown
}

export type OnboardingTemplateInsert = Omit<OnboardingTemplate, 'id' | 'created_at' | 'updated_at'>

// ---------------------------------------------------------------------------
// AI Parsed Intake Data
// ---------------------------------------------------------------------------

export interface ParsedIntakeData {
  // Company basics
  company_name: string | null
  company_website: string | null
  industry: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  billing_contact_name: string | null
  billing_contact_email: string | null
  team_members: string | null
  communication_channel: string | null

  // Package selection
  packages_selected: PackageSlug[]
  packages_reasoning: string

  // Commercial
  setup_fee: number | null
  recurring_fee: number | null
  billing_cadence: string | null
  outbound_tier: string | null
  payment_method: string | null

  // ICP
  icp_description: string | null
  target_industries: string[]
  sub_industries: string[]
  target_company_sizes: string[]
  target_titles: string[]
  target_geography: string[]
  specific_regions: string | null
  must_have_traits: string | null
  exclusion_criteria: string | null
  pain_points: string | null
  intent_keywords: string[]
  competitor_names: string[]
  best_customers: string | null
  sample_accounts: string | null

  // Email setup
  sending_volume: string | null
  lead_volume: string | null
  start_timeline: string | null
  sender_names: string | null
  domain_variations: string | null
  domain_provider: string | null
  copy_tone: string | null
  primary_cta: string | null
  calendar_link: string | null
  reply_routing_email: string | null

  // Pixel setup
  pixel_urls: string | null
  uses_gtm: string | null
  pixel_installer: string | null
  monthly_traffic: string | null
  audience_refresh: string | null

  // Data delivery
  data_use_cases: string[]
  primary_crm: string | null
  data_format: string | null
  audience_count: string | null

  // Metadata
  confidence_score: number
  fields_inferred: string[]
  missing_critical_fields: string[]
  additional_context: string | null
}

// ---------------------------------------------------------------------------
// Context format hints for AI parsing
// ---------------------------------------------------------------------------

export type ContextFormat = 'call_notes' | 'email_thread' | 'transcript' | 'client_brief' | 'mixed'

export const CONTEXT_FORMATS: Record<ContextFormat, { label: string; hint: string }> = {
  call_notes: {
    label: 'Call Notes',
    hint: 'The following input is formatted as call notes from a sales/discovery call. Expect discussion of the client\'s needs, ICP, and package fit.',
  },
  email_thread: {
    label: 'Email Thread',
    hint: 'The following input is formatted as an email thread or correspondence. Extract client details from the conversation.',
  },
  transcript: {
    label: 'Transcript',
    hint: 'The following input is a raw transcript with speaker labels. Focus on extracting client-specific details from the discussion.',
  },
  client_brief: {
    label: 'Client Brief',
    hint: 'The following input is a structured client brief or document. It may already be partially organized — extract all relevant fields.',
  },
  mixed: {
    label: 'Mixed / Other',
    hint: '',
  },
}

// ---------------------------------------------------------------------------
// Field status tracking for parsed preview
// ---------------------------------------------------------------------------

export type FieldStatus = 'ai_filled' | 'inferred' | 'needs_input' | 'manual'

export interface FieldMeta {
  status: FieldStatus
  fieldName: string
}
