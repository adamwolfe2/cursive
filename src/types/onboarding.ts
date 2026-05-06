// Onboarding Client Types
// Comprehensive types for the client onboarding intake system

// ---------------------------------------------------------------------------
// Voice profile (drives copy tone in generation)
// ---------------------------------------------------------------------------
//
// A voice profile defines HOW a sender sounds, not just what tone to use. The
// previous `copy_tone` field was a 4-option enum (Professional/Conversational/
// Direct/Friendly) which was too generic to differentiate a founder writing to
// other founders from an SDR running a templated campaign. Voice profiles
// encode signature style, signoff convention, pronoun usage, and sentence
// rhythm.

export const VOICE_PROFILES = [
  'founder_direct',
  'agency_professional',
  'consultant_authoritative',
] as const

export type VoiceProfile = (typeof VOICE_PROFILES)[number]

export const VOICE_PROFILE_LABELS: Record<VoiceProfile, string> = {
  founder_direct: 'Founder Direct',
  agency_professional: 'Agency Professional',
  consultant_authoritative: 'Consultant Authoritative',
}

// ---------------------------------------------------------------------------
// AOV tier (drives generation defaults — spintax, CTA ladder, angle library)
// ---------------------------------------------------------------------------
//
// We tier clients by average order value because the right copy strategy is
// fundamentally different for a $5K SaaS tool sold to ops managers vs. a $50K
// service sold to founders. Spintax-everywhere works at high volume; precision
// openers work for high-trust deals.

export const AOV_TIERS = ['low', 'mid', 'high', 'enterprise'] as const
export type AovTier = (typeof AOV_TIERS)[number]

// ---------------------------------------------------------------------------
// Case studies (REAL social proof — only source the copy engine may reference)
// ---------------------------------------------------------------------------
//
// The previous pipeline let Claude invent client counts and named customers
// because the masterclass doctrine said "use SPECIFIC numbers, name actual
// clients." When the AI had no real data, it fabricated plausible-sounding
// numbers. The fix: every named client / quantified result the copy engine
// emits MUST come from this array. If the array is empty, the engine cannot
// reference any social proof.

export interface CaseStudy {
  /** Casualized client name (e.g., "Adaptive", not "Adaptive AI Inc."). */
  client_name: string
  /** What the engagement was — e.g., "launch film for $4M seed-stage AI co". */
  engagement: string
  /**
   * Quantified results actually delivered. Use natural language with real
   * numbers. Example: "1.2M views in 90 days; revenue doubled that quarter."
   * Empty string if no quantified result is available.
   */
  results: string
  /** Whether this client allows their name to appear in cold outreach. */
  is_named: boolean
  /** Optional URL to a public case study, video, or article. */
  url?: string | null
}

// ---------------------------------------------------------------------------
// CTA types (positional CTA ladder)
// ---------------------------------------------------------------------------
//
// High-trust services need an escalating ladder, not a calendar link in email
// 1. Each CTA type maps to a sequence position; the quality checker enforces
// that mapping.

export const CTA_TYPES = [
  'asset_offer', // email 1 (high-trust): free content, case study link, video
  'reply_only', // email 1 (volume): no link, just ask for a reply
  'soft_call_mention', // email 2: "happy to jump on a quick call if useful"
  'calendar_link', // email 3: direct booking with one suggested time
  'breakup', // email 4: no CTA, close the loop
] as const

export type CtaType = (typeof CTA_TYPES)[number]

// ---------------------------------------------------------------------------
// Package definitions
// ---------------------------------------------------------------------------

export const PACKAGE_SLUGS = [
  'super_pixel',
  'audience',
  'outbound',
  'bundle',
  'affiliate',
  'enrichment',
  'paid_ads',
  'data_delivery',
] as const

export type PackageSlug = (typeof PACKAGE_SLUGS)[number]

export const PACKAGES: Record<PackageSlug, { label: string; description: string }> = {
  super_pixel: {
    label: 'Super Pixel',
    description: 'Identify anonymous website visitors and build targetable audiences',
  },
  audience: {
    label: 'Audience / ICP Segment',
    description: 'Purchase enriched lead lists built to your exact ICP',
  },
  outbound: {
    label: 'Outbound Email Activation',
    description: 'Done-for-you cold email campaigns from lead list to booked meetings',
  },
  bundle: {
    label: 'Pixel + Outbound Bundle',
    description: 'Full system: visitor ID + audience building + outbound campaigns',
  },
  affiliate: {
    label: 'Affiliate / Partner Program',
    description: 'Earn commissions by referring clients to Cursive',
  },
  enrichment: {
    label: 'Enrichment of Existing List',
    description: 'We enrich and verify your existing contact list',
  },
  paid_ads: {
    label: 'Paid Ads Activation / Sync',
    description: 'Sync audiences to Facebook, Google, or LinkedIn ads',
  },
  data_delivery: {
    label: 'Data Delivery Only',
    description: 'Receive lead data via CSV, Google Sheet, or CRM sync',
  },
}

// ---------------------------------------------------------------------------
// Pipeline statuses
// ---------------------------------------------------------------------------

export const CLIENT_STATUSES = [
  'lead',
  'booked',
  'discovery',
  'closed',
  'onboarding',
  'setup',
  'active',
  'reporting',
  'churned',
] as const

export type ClientStatus = (typeof CLIENT_STATUSES)[number]

export const STATUS_LABELS: Record<ClientStatus, string> = {
  lead: 'Lead',
  booked: 'Booked',
  discovery: 'Discovery',
  closed: 'Closed',
  onboarding: 'Onboarding',
  setup: 'Setup',
  active: 'Active',
  reporting: 'Reporting',
  churned: 'Churned',
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function needsOutboundSetup(packages: PackageSlug[]): boolean {
  return packages.includes('outbound') || packages.includes('bundle')
}

export function needsPixelSetup(packages: PackageSlug[]): boolean {
  return packages.includes('super_pixel') || packages.includes('bundle')
}

export function needsAudienceAck(packages: PackageSlug[]): boolean {
  return (
    packages.includes('audience') ||
    packages.includes('enrichment') ||
    packages.includes('data_delivery')
  )
}

// ---------------------------------------------------------------------------
// Full client record type (matches DB schema)
// ---------------------------------------------------------------------------

export interface OnboardingClient {
  id: string
  created_at: string
  updated_at: string
  status: ClientStatus

  // Section 1: Company basics
  company_name: string
  company_website: string
  industry: string
  primary_contact_name: string
  primary_contact_email: string
  primary_contact_phone: string
  billing_contact_name: string | null
  billing_contact_email: string | null
  team_members: string | null
  communication_channel: string
  slack_url: string | null
  referral_source: string | null
  referral_detail: string | null

  // Section 2: Packages
  packages_selected: PackageSlug[]

  // Section 3: Commercial
  setup_fee: number | null
  recurring_fee: number | null
  billing_cadence: string | null
  outbound_tier: string | null
  custom_tier_details: string | null
  payment_method: string | null
  invoice_email: string | null
  domain_cost_acknowledged: boolean
  audience_cost_acknowledged: boolean
  pixel_cost_acknowledged: boolean
  additional_audience_noted: boolean

  // Section 4: ICP intake
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

  // Section 5: Outbound email setup
  sending_volume: string | null
  lead_volume: string | null
  start_timeline: string | null
  sender_names: string | null
  domain_variations: string | null
  domains_approval_url: string | null
  domain_provider: string | null
  existing_domains: string | null
  copy_tone: string | null
  primary_cta: string | null
  custom_cta: string | null
  calendar_link: string | null
  reply_routing_email: string | null
  backup_reply_email: string | null
  compliance_disclaimers: string | null

  // Voice + copy strategy (drives generation pipeline)
  // voice_profile encodes HOW the sender sounds. spintax_enabled toggles
  // multi-variant generation OFF for high-trust copy. case_studies is the
  // ONLY source of real social proof the copy engine may reference.
  // prospect_signal_template is the default cold-read opener pattern when no
  // per-prospect signal is enriched at send time.
  voice_profile: VoiceProfile | null
  spintax_enabled: boolean | null
  case_studies: CaseStudy[]
  prospect_signal_template: string | null

  // Section 6: Pixel setup
  pixel_urls: string | null
  uses_gtm: string | null
  gtm_container_id: string | null
  pixel_installer: string | null
  developer_email: string | null
  pixel_delivery: string[]
  pixel_delivery_other: string | null
  pixel_crm_name: string | null
  conversion_events: string | null
  monthly_traffic: string | null
  audience_refresh: string | null

  // Section 7: Use case and delivery
  data_use_cases: string[]
  primary_crm: string | null
  custom_platform: string | null
  data_format: string | null
  audience_count: string | null
  has_existing_list: string | null

  // Section 8: Content approvals
  copy_approval: boolean
  sender_identity_approval: boolean

  // Section 9: Legal
  sow_signed: boolean
  payment_confirmed: boolean
  data_usage_ack: boolean
  privacy_ack: boolean
  billing_terms_ack: boolean
  additional_notes: string | null
  signature_name: string | null
  signature_date: string | null

  // Intake metadata
  intake_source: 'client_form' | 'internal_intake' | 'template_clone' | 'duplicate'

  // Campaign tracking
  campaign_deployed: boolean
  emailbison_campaign_ids: string[]
  campaign_stats: Record<string, unknown> | null
  assigned_workspace_id: string | null
  eb_workspace_id: number | null
  is_test_client: boolean

  // Invoice & contract tracking
  stripe_invoice_id: string | null
  stripe_invoice_url: string | null
  stripe_invoice_status: string | null
  rabbitsign_folder_id: string | null
  rabbitsign_status: string | null
  contract_signed_at: string | null

  // Portal
  portal_invite_sent_at: string | null
  portal_last_visited_at: string | null

  // Automation outputs
  enriched_icp_brief: EnrichedICPBrief | null
  enrichment_status: 'pending' | 'processing' | 'complete' | 'failed'
  draft_sequences: DraftSequences | null
  copy_generation_status: 'pending' | 'processing' | 'complete' | 'failed' | 'not_applicable'
  copy_approval_status: 'pending' | 'approved' | 'needs_edits' | 'regenerating' | 'not_applicable'
  slack_notification_sent: boolean
  confirmation_email_sent: boolean
  crm_record_id: string | null
  crm_sync_status: 'pending' | 'synced' | 'failed'
  onboarding_complete: boolean
  automation_log: AutomationLogEntry[]
  admin_notes: string | null
}

// ---------------------------------------------------------------------------
// Insert type (omit server-generated fields)
// ---------------------------------------------------------------------------

export type OnboardingClientInsert = Omit<
  OnboardingClient,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'enriched_icp_brief'
  | 'enrichment_status'
  | 'draft_sequences'
  | 'copy_generation_status'
  | 'copy_approval_status'
  | 'slack_notification_sent'
  | 'confirmation_email_sent'
  | 'crm_record_id'
  | 'crm_sync_status'
  | 'automation_log'
  | 'admin_notes'
  | 'campaign_deployed'
  | 'emailbison_campaign_ids'
  | 'campaign_stats'
  | 'stripe_invoice_id'
  | 'stripe_invoice_url'
  | 'stripe_invoice_status'
  | 'rabbitsign_folder_id'
  | 'rabbitsign_status'
  | 'contract_signed_at'
  | 'portal_invite_sent_at'
  | 'portal_last_visited_at'
>

// ---------------------------------------------------------------------------
// Form data (what the client fills in before DB mapping)
// ---------------------------------------------------------------------------

export interface OnboardingFormData {
  // Step 1: Company Info
  company_name: string
  company_website: string
  industry: string
  primary_contact_name: string
  primary_contact_email: string
  primary_contact_phone: string
  billing_contact_name: string
  billing_contact_email: string
  team_members: string
  communication_channel: string
  slack_url: string
  referral_source: string
  referral_detail: string

  // Step 2: Packages
  packages_selected: PackageSlug[]

  // Step 3: Commercial
  setup_fee: number | null
  recurring_fee: number | null
  billing_cadence: string
  outbound_tier: string
  custom_tier_details: string
  payment_method: string
  invoice_email: string
  domain_cost_acknowledged: boolean
  audience_cost_acknowledged: boolean
  pixel_cost_acknowledged: boolean
  additional_audience_noted: boolean

  // Step 4: ICP
  icp_description: string
  target_industries: string[]
  sub_industries: string[]
  target_company_sizes: string[]
  target_titles: string[]
  target_geography: string[]
  specific_regions: string
  must_have_traits: string
  exclusion_criteria: string
  pain_points: string
  intent_keywords: string[]
  competitor_names: string[]
  best_customers: string
  sample_accounts: string

  // Step 5: Outbound
  sending_volume: string
  lead_volume: string
  start_timeline: string
  sender_names: string
  domain_variations: string
  domain_provider: string
  existing_domains: string
  copy_tone: string
  primary_cta: string
  custom_cta: string
  calendar_link: string
  reply_routing_email: string
  backup_reply_email: string
  compliance_disclaimers: string

  // Voice + copy strategy
  voice_profile: VoiceProfile | ''
  spintax_enabled: boolean | null
  case_studies: CaseStudy[]
  prospect_signal_template: string

  // Step 6: Pixel
  pixel_urls: string
  uses_gtm: string
  gtm_container_id: string
  pixel_installer: string
  developer_email: string
  pixel_delivery: string[]
  pixel_delivery_other: string
  pixel_crm_name: string
  conversion_events: string
  monthly_traffic: string
  audience_refresh: string

  // Step 7: Use Case
  data_use_cases: string[]
  primary_crm: string
  custom_platform: string
  data_format: string
  audience_count: string
  has_existing_list: string

  // Step 8: Content
  copy_approval: boolean
  sender_identity_approval: boolean

  // Step 9: Legal
  sow_signed: boolean
  payment_confirmed: boolean
  data_usage_ack: boolean
  privacy_ack: boolean
  billing_terms_ack: boolean
  additional_notes: string
  signature_name: string
  signature_date: string

  // Honeypot (anti-spam, should always be empty for real users)
  website_url_confirm?: string
}

// ---------------------------------------------------------------------------
// File types
// ---------------------------------------------------------------------------

export interface PendingFile {
  file: File
  type: ClientFileType
  preview?: string
}

export type ClientFileType =
  | 'brand_guidelines'
  | 'deck'
  | 'testimonials'
  | 'sample_offers'
  | 'examples'
  | 'existing_list'
  | 'suppression_list'

export interface ClientFile {
  id: string
  client_id: string
  created_at: string
  file_name: string
  file_type: ClientFileType
  storage_path: string
  file_size: number | null
  mime_type: string | null
}

// ---------------------------------------------------------------------------
// Enriched ICP Brief (output from Claude)
// ---------------------------------------------------------------------------

export interface EnrichedICPBrief {
  company_summary: string
  // The precise, specific thing this client SELLS. Grounded in the intake
  // (icp_description, pain_points, must_have_traits) — not generic industry
  // positioning. Drives the copy engine. Optional for backward compat with
  // older briefs generated before this field was introduced.
  service_offering?: string
  ideal_buyer_profile: string
  primary_verticals: string[]
  buyer_personas: BuyerPersona[]
  company_filters: CompanyFilters
  competitive_landscape: string[]
  messaging_angles: MessagingAngle[]
  audience_labs_search_strategy: AudienceLabsStrategy
  copy_research?: CopyResearch
}

// ---------------------------------------------------------------------------
// Copy Research (generated during enrichment for copy engine)
// ---------------------------------------------------------------------------

export interface CopyResearch {
  prospect_world: {
    daily_reality: string
    current_tools: string[]
    current_approach: string
    trigger_events: string[]
    status_quo_cost: string
    objections: string[]
    aspirations: string
  }
  messaging_ammunition: {
    specific_proof_points: string[]
    social_proof_angles: string[]
    contrarian_hooks: string[]
    curiosity_gaps: string[]
    pattern_interrupts: string[]
    fear_of_missing_out: string[]
    ego_hooks: string[]
  }
  email_specific: {
    recommended_subject_line_styles: string[]
    recommended_opening_styles: string[]
    cta_variations: string[]
    personalization_variables_available: string[]
    words_to_avoid: string[]
    tone_calibration: string
  }
}

export interface BuyerPersona {
  title: string
  seniority: string
  department: string
  pain_points: string[]
  buying_triggers: string[]
}

export interface CompanyFilters {
  size_range: string
  revenue_range: string
  geography: string[]
  tech_signals: string[]
  exclusions: string[]
}

export interface MessagingAngle {
  angle_name: string
  hook: string
  value_prop: string
  proof_point: string
}

export interface AudienceLabsStrategy {
  recommended_taxonomy_paths: string[]
  keyword_combinations: string[]
  filters_to_apply: string[]
  estimated_audience_size: string
  notes_for_builder: string
}

// ---------------------------------------------------------------------------
// Draft email sequences (output from Claude)
// ---------------------------------------------------------------------------

export interface DraftSequences {
  sequences: EmailSequence[]
  global_notes?: GlobalCopyNotes
  quality_check?: QualityCheckResult
  angle_selection?: AngleSelection
}

export interface EmailSequence {
  sequence_name: string
  strategy: string
  angle?: {
    category: string
    core_insight: string
    emotional_driver: string
  }
  emails: SequenceEmail[]
  /**
   * Admin/system metadata, NOT shown to the client. Contains regeneration
   * notes, angle reasoning, and spintax test plans. Stored separately from
   * the email objects so the client-facing UI never accidentally renders it.
   */
  metadata?: SequenceMetadata
}

export interface SequenceMetadata {
  strategy?: string
  angle_reasoning?: string
  spintax_test_notes?: string | null
  /** Why each email is sequenced where it is. */
  arc_explanation?: string
}

export interface SequenceEmail {
  step: number
  delay_days: number
  subject_line: string
  body: string
  purpose: string
  preview_text?: string
  word_count?: number
  /**
   * Positional CTA type. Email 1 must be `asset_offer`; email 2
   * `soft_call_mention`; email 3 `calendar_link`; email 4 `breakup`. The
   * quality checker enforces this ladder.
   */
  cta_type?: CtaType
  /** @deprecated kept for backward-compat with sequences generated before the
   * metadata block was introduced. New sequences put this in the metadata
   * field. Prefer `metadata.angle_reasoning` for new code. */
  why_it_works?: string
  /** @deprecated see `cta_type` and `metadata.spintax_test_notes`. */
  spintax_test_notes?: string
}

export interface GlobalCopyNotes {
  deliverability_considerations?: string
  personalization_opportunities?: string
  ab_test_recommendations?: string
  scaling_notes?: string
}

// ---------------------------------------------------------------------------
// Angle Selection (output from angle selection call)
// ---------------------------------------------------------------------------

export interface AngleSelection {
  selected_angles: SelectedAngle[]
  angles_considered_but_rejected?: RejectedAngle[]
}

export interface SelectedAngle {
  angle_name: string
  angle_category: string
  core_insight: string
  emotional_driver: string
  proof_mechanism: string
  sequence_arc: {
    email_1_purpose: string
    email_2_purpose: string
    email_3_purpose: string
    email_4_purpose?: string
  }
  why_this_works: string
}

export interface RejectedAngle {
  angle: string
  reason_rejected: string
}

// ---------------------------------------------------------------------------
// Copy Quality Check
// ---------------------------------------------------------------------------

export interface QualityCheckResult {
  passed: boolean
  issues: QualityIssue[]
}

export interface QualityIssue {
  sequence_index: number
  email_index: number
  severity: 'error' | 'warning'
  check: string
  detail: string
}

// ---------------------------------------------------------------------------
// Automation log
// ---------------------------------------------------------------------------

export interface AutomationLogEntry {
  step: string
  status: 'complete' | 'failed' | 'skipped'
  error?: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Fulfillment checklist
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  completed_at: string | null
  category: 'pixel' | 'audience' | 'outbound' | 'affiliate' | 'paid_ads'
}

export interface FulfillmentChecklist {
  id: string
  client_id: string
  created_at: string
  updated_at: string
  items: ChecklistItem[]
}

// ---------------------------------------------------------------------------
// Form step definitions
// ---------------------------------------------------------------------------

export interface FormStep {
  id: string
  label: string
  isConditional: boolean
  condition?: (packages: PackageSlug[]) => boolean
}

export const FORM_STEPS: FormStep[] = [
  { id: 'company-info', label: 'Company Info', isConditional: false },
  { id: 'packages', label: 'Packages', isConditional: false },
  { id: 'icp', label: 'ICP Intake', isConditional: false },
  { id: 'email-setup', label: 'Email Setup', isConditional: true, condition: needsOutboundSetup },
  { id: 'pixel-setup', label: 'Pixel Setup', isConditional: true, condition: needsPixelSetup },
  { id: 'use-case', label: 'Use Case & Delivery', isConditional: false },
  { id: 'content', label: 'Content & Approvals', isConditional: false },
  { id: 'legal', label: 'Legal & Sign-off', isConditional: false },
  { id: 'review', label: 'Review & Submit', isConditional: false },
]

export function getActiveSteps(packages: PackageSlug[]): FormStep[] {
  return FORM_STEPS.filter((step) => !step.isConditional || step.condition?.(packages))
}

// ---------------------------------------------------------------------------
// URL params for pre-fill
// ---------------------------------------------------------------------------

export interface OnboardingUrlParams {
  company?: string
  email?: string
  name?: string
  phone?: string
  setup_fee?: string
  tier?: string
  packages?: string // comma-separated slugs
  industry?: string
}
