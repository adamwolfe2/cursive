/**
 * Outbound Agent (Rox-inspired) — TypeScript types
 *
 * The outbound feature reuses existing tables (`agents`, `email_campaigns`,
 * `campaign_leads`, `email_sends`, `email_replies`) and adds three new ones
 * (`outbound_runs`, `outbound_chat_messages`, `outbound_saved_prompts`).
 *
 * Migration: supabase/migrations/20260408000000_outbound_agent_v1.sql
 */

import type { Agent } from '@/types'

// ============================================================================
// FILTERS — what we send to AudienceLab for prospecting
// ============================================================================

export type SeniorityLevel =
  | 'C-Suite'
  | 'VP'
  | 'Director'
  | 'Manager'
  | 'Individual Contributor'
  | 'Entry Level'

/**
 * Persisted on `agents.outbound_filters` JSONB.
 * Drives the AudienceLab `previewAudience` / `createAudience` calls in
 * src/lib/services/outbound/al-prospecting.service.ts
 */
export interface OutboundFilters {
  industries?: string[]
  states?: string[]                    // 2-letter US state codes
  cities?: string[]
  zips?: string[]
  seniority_levels?: SeniorityLevel[]
  job_titles?: string[]
  departments?: string[]
  company_sizes?: string[]             // legacy/display only — AL uses employeeCount range
  employee_count?: { min?: number; max?: number }
  company_revenue?: { min?: number; max?: number }
  sic?: string[]
  naics?: string[]
  /**
   * Per-run cap. The /run endpoint hard-caps to min(target, cap_per_run, 100).
   * Default: 25.
   */
  cap_per_run?: number
}

// ============================================================================
// AGENT WITH OUTBOUND FIELDS — extends the base Agent
// ============================================================================

/**
 * The base `Agent` type from `@/types` only declares the original columns.
 * The migration added 8 more — this interface is the canonical shape used by
 * the outbound feature. Don't extend `Agent` directly because that file is
 * generated; we widen via intersection.
 */
export interface OutboundAgent extends Agent {
  outbound_enabled: boolean
  outbound_auto_approve: boolean
  icp_text: string | null
  persona_text: string | null
  product_text: string | null
  outbound_filters: OutboundFilters
  outbound_campaign_id: string | null
  outbound_last_run_at: string | null
}

export type OutboundAgentInsert = Partial<OutboundAgent> & {
  workspace_id: string
  name: string
}

export type OutboundAgentUpdate = Partial<OutboundAgent>

// ============================================================================
// RUNS
// ============================================================================

export type OutboundRunStatus = 'running' | 'completed' | 'failed' | 'cancelled'

export interface OutboundRun {
  id: string
  workspace_id: string
  agent_id: string
  triggered_by: string | null
  status: OutboundRunStatus
  prospects_target: number
  prospects_found: number
  prospects_enriched: number
  drafts_created: number
  drafts_approved: number
  emails_sent: number
  replies_received: number
  meetings_booked: number
  credits_spent: number
  error_message: string | null
  metadata: Record<string, unknown>
  started_at: string
  completed_at: string | null
}

export type OutboundRunInsert = Partial<OutboundRun> & {
  workspace_id: string
  agent_id: string
}

// ============================================================================
// STAGE COUNTS — what the workflow page polls every 5 seconds
// ============================================================================

export interface StageCounts {
  prospecting: number
  enriching: number
  drafting: number
  engaging: number
  replying: number
  booked: number
}

export interface WorkflowStatsResponse {
  stages: StageCounts
  latest_run: OutboundRun | null
  recent_runs: OutboundRun[]
}

// ============================================================================
// DRAFTS — projection of email_sends rows in pending_approval state
// ============================================================================

export interface OutboundDraft {
  id: string
  campaign_id: string
  workspace_id: string
  lead_id: string
  recipient_email: string | null
  recipient_name: string | null
  subject: string
  body_html: string
  body_text: string | null
  status: string
  step_number: number | null
  composition_metadata: Record<string, unknown> | null
  created_at: string
  // joined fields from leads table
  lead_first_name?: string | null
  lead_last_name?: string | null
  lead_full_name?: string | null
  lead_job_title?: string | null
  lead_company_name?: string | null
  lead_company_domain?: string | null
}

// ============================================================================
// PROSPECTS — projection of campaign_leads rows
// ============================================================================

export interface OutboundProspect {
  id: string                           // campaign_lead id
  campaign_id: string
  lead_id: string
  status: string
  current_step: number
  enriched_at: string | null
  last_email_sent_at: string | null
  // joined from leads
  lead_first_name?: string | null
  lead_last_name?: string | null
  lead_full_name?: string | null
  lead_email?: string | null
  lead_job_title?: string | null
  lead_company_name?: string | null
  // computed
  display_stage?:
    | 'prospecting'
    | 'enriching'
    | 'drafting'
    | 'engaging'
    | 'replying'
    | 'booked'
    | 'skipped'
}

// ============================================================================
// CHAT
// ============================================================================

export type OutboundChatRole = 'user' | 'assistant' | 'system'

export interface OutboundChatContextRef {
  type: 'lead' | 'company' | 'workflow'
  id: string
  /** Display label cached at insert time. */
  label?: string
}

export interface OutboundChatMessage {
  id: string
  workspace_id: string
  user_id: string
  agent_id: string | null
  thread_id: string
  role: OutboundChatRole
  content: string
  context_refs: OutboundChatContextRef[]
  token_count: number | null
  created_at: string
}

export interface OutboundChatThread {
  thread_id: string
  agent_id: string | null
  message_count: number
  last_message_at: string
  preview: string
}

// ============================================================================
// SAVED PROMPTS
// ============================================================================

export interface OutboundSavedPrompt {
  id: string
  workspace_id: string | null          // NULL = global default
  label: string
  description: string | null
  prompt_template: string
  icon_name: string | null
  sort_order: number
  is_default: boolean
  created_by: string | null
  created_at: string
}

// ============================================================================
// ICP GENERATOR — response from POST /api/outbound/icp/generate
// ============================================================================

export interface IcpGenerationResult {
  industries: string[]
  seniority_levels: SeniorityLevel[]
  states: string[]
  job_titles: string[]
  company_sizes: string[]
  departments: string[]
  icp_summary: string
  persona_summary: string
}
