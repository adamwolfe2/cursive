// Campaign Builder Types
// Data models for automated campaign creation

// ============================================================================
// CLIENT ONBOARDING
// ============================================================================

export interface ClientOnboardingForm {
  // Company Info
  companyName: string
  companyWebsite: string
  companyDescription: string
  industryVertical: string

  // Product/Service
  productName: string
  productDescription: string
  mainBenefit: string
  uniqueSellingPoints: string[]
  priceRange?: string

  // ICP (Ideal Customer Profile)
  targetJobTitles: string[]
  targetCompanySize: 'startup' | 'smb' | 'midmarket' | 'enterprise' | 'any'
  targetIndustries: string[]
  targetLocations: string[]
  excludeCompetitors?: string[]

  // Campaign Goals
  campaignGoal: 'demo_booking' | 'free_trial' | 'consultation' | 'webinar' | 'content_download' | 'custom'
  customGoal?: string
  desiredOutcome: string

  // Offer
  offerType: 'free_trial' | 'discount' | 'consultation' | 'demo' | 'audit' | 'resource' | 'custom'
  offerDetails: string
  callToAction: string

  // Tone & Style
  tonePreference: 'casual' | 'professional' | 'friendly' | 'formal' | 'provocative'
  avoidTopics?: string[]
  brandVoiceNotes?: string
}

// ============================================================================
// CAMPAIGN CONFIGURATION
// ============================================================================

export interface CampaignConfig {
  id: string
  workspaceId: string
  clientId?: string // If created for a client
  name: string
  status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'paused' | 'completed'

  // From onboarding form
  onboardingData: ClientOnboardingForm

  // Generated campaign settings
  settings: CampaignSettings

  // Email sequence
  sequence: EmailSequenceStep[]

  // Metadata
  createdAt: string
  approvedAt?: string
  approvedBy?: string
  launchedAt?: string
}

export interface CampaignSettings {
  // Sending settings
  dailySendLimit: number
  sendingWindowStart: string // HH:MM
  sendingWindowEnd: string // HH:MM
  sendingTimezone: string
  sendOnWeekends: boolean

  // Deliverability
  enableSpintax: boolean
  warmupEnabled: boolean
  replyHandling: 'ai_auto' | 'ai_draft' | 'manual'

  // Targeting
  maxLeadsPerCompany: number
  excludeDomains: string[]

  // Tracking
  trackOpens: boolean
  trackClicks: boolean
}

// ============================================================================
// EMAIL SEQUENCE
// ============================================================================

export interface EmailSequenceStep {
  id: string
  order: number
  type: 'initial' | 'followup' | 'breakup'
  delayDays: number // Days after previous step
  subject: string
  subjectVariants?: string[] // A/B testing
  body: string
  bodyVariants?: string[] // A/B testing

  // Spintax versions (generated)
  subjectWithSpintax?: string
  bodyWithSpintax?: string

  // Conditions
  sendIf?: {
    noReply: boolean
    noOpen?: boolean
    noClick?: boolean
  }
}

// ============================================================================
// COLD EMAIL BEST PRACTICES KB
// ============================================================================

export interface ColdEmailBestPractice {
  id: string
  category:
    | 'subject_line'
    | 'opening_line'
    | 'body_structure'
    | 'cta'
    | 'personalization'
    | 'timing'
    | 'deliverability'
    | 'spintax'
    | 'offer'
    | 'followup'
  title: string
  content: string
  examples?: string[]
  doList?: string[]
  dontList?: string[]
  tags: string[]
  priority: number // 1-10, higher = more important
}

export interface SpintaxTemplate {
  id: string
  category: 'greeting' | 'opening' | 'transition' | 'cta' | 'signoff' | 'general'
  original: string
  spintax: string
  context?: string // When to use this
}

// ============================================================================
// GENERATED OUTPUT
// ============================================================================

export interface GeneratedCampaign {
  campaignConfig: Omit<CampaignConfig, 'id' | 'createdAt'>
  reasoning: {
    settingsRationale: string
    sequenceRationale: string
    offerRationale: string
  }
  estimatedMetrics: {
    expectedOpenRate: string
    expectedReplyRate: string
    bestSendTimes: string[]
  }
  warnings?: string[]
  suggestions?: string[]
}
