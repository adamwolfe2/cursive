// ─── Shared Types for Activate Wizard ─────────────────────

export type FlowType = 'audience' | 'campaign' | null

export interface AudienceForm {
  request_type: 'audience' | 'lookalike'
  industries: string[]
  job_titles: string[]
  geographies: string[]
  company_size: string
  seniority_levels: string[]
  icp_description: string
  use_case: string
  data_sources: string[]
  desired_volume: string
  budget_range: string
  timeline: string
  contact_name: string
  contact_email: string
  website_url: string
  additional_notes: string
}

export interface CampaignForm {
  campaign_goal: string
  target_audience: string
  value_prop: string
  message_tone: string
  industries: string[]
  geographies: string[]
  job_titles: string[]
  company_size: string
  monthly_volume: string
  has_existing_copy: boolean
  existing_copy: string
  budget_range: string
  contact_name: string
  contact_email: string
  website_url: string
  additional_notes: string
}
