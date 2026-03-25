// Shared types for Cursive Chrome Extension

export interface EnrichedContact {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  company_domain: string | null
  job_title: string | null
  headline: string | null
  linkedin_url: string | null
  company_industry: string | null
  company_size: string | null
  company_revenue: string | null
  city: string | null
  state: string | null
  source: string
}

export interface EmailVerification {
  email: string
  status: 'valid' | 'catch_all' | 'invalid' | 'unknown'
  confidence: number
  checks: {
    format: boolean
    disposable: boolean
    role_based: boolean
  }
}

export interface CompanyData {
  domain: string
  name: string | null
  description: string | null
  industry?: string | null
  employee_count?: string | null
  revenue?: string | null
  tech_stack?: string[] | null
}

export interface CreditBalance {
  remaining: number
  plan: string
  workspace_id: string
}

// Message types for content script <-> background communication
export type ExtensionMessage =
  | { type: 'LOOKUP'; data: { first_name: string; last_name: string; company?: string; domain?: string } }
  | { type: 'LOOKUP_BY_EMAIL'; data: { email: string } }
  | { type: 'COMPANY'; data: { domain: string } }
  | { type: 'VERIFY_EMAIL'; data: { email: string } }
  | { type: 'SAVE_LEAD'; data: Partial<EnrichedContact> }
  | { type: 'GET_CREDITS' }
  | { type: 'GET_CACHED'; data: { key: string } }

export type ExtensionResponse =
  | { success: true; data: unknown }
  | { success: false; error: string }
