/**
 * EmailBison API Client
 *
 * Outbound email automation integration for cold email campaigns.
 * API docs: https://docs.emailbison.com
 * API reference: https://dedi.emailbison.com/api/reference
 *
 * Key capabilities:
 * - Campaign CRUD with settings management
 * - Lead management (add, move between campaigns, tag)
 * - Sender email management with status filtering
 * - Sequence step variants (activate/deactivate)
 * - Scheduled emails (generic endpoint)
 * - Campaign scheduling with templates
 *
 * Auth: Bearer token via EMAILBISON_API_KEY env var
 * Base URL: https://dedi.emailbison.com (configured via EMAILBISON_API_URL)
 */

import { fetchWithTimeout } from '@/lib/utils/retry'

// ============================================================================
// CONFIGURATION
// ============================================================================

const EMAILBISON_API_URL = process.env.EMAILBISON_API_URL || 'https://dedi.emailbison.com'
const EMAILBISON_API_KEY = process.env.EMAILBISON_API_KEY || ''
const EMAILBISON_TIMEOUT = 30000

// ============================================================================
// TYPES
// ============================================================================

export interface EmailBisonCampaign {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  settings?: CampaignSettings
  created_at?: string
  updated_at?: string
}

export interface CampaignSettings {
  max_emails_per_day?: number | null
  max_new_leads_per_day?: number | null
  plain_text?: boolean
  open_tracking?: boolean
  reputation_building?: boolean
  can_unsubscribe?: boolean
}

export interface CampaignSchedule {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  start_hour: number
  end_hour: number
  timezone: string
}

export interface EmailBisonLead {
  email: string
  first_name?: string
  last_name?: string
  company_name?: string
  custom_variables?: Array<{ name: string; value: string }>
}

export interface EmailBisonSenderEmail {
  id: string
  email: string
  status: 'connected' | 'not_connected' | 'pending_move' | 'pending_deletion'
  warmup_enabled?: boolean
}

export interface SequenceStep {
  step_number: number
  subject: string
  body: string
  wait_days?: number
}

export interface SequenceStepVariant {
  id: string
  step_number: number
  variant_label: string
  subject: string
  body: string
  active: boolean
}

export interface ScheduledEmail {
  id: string
  campaign_id: string
  lead_email: string
  subject: string
  scheduled_at: string
  status: string
}

export interface EmailBisonTag {
  id: string
  name: string
}

// ============================================================================
// API CLIENT
// ============================================================================

class EmailBisonApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: unknown
  ) {
    super(message)
    this.name = 'EmailBisonApiError'
  }
}

async function bisonFetch<T = any>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  if (!EMAILBISON_API_KEY) {
    throw new Error('EMAILBISON_API_KEY not configured')
  }

  const { timeout = EMAILBISON_TIMEOUT, ...fetchOptions } = options

  const url = `${EMAILBISON_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const response = await fetchWithTimeout(url, {
    ...fetchOptions,
    timeout,
    headers: {
      'Authorization': `Bearer ${EMAILBISON_API_KEY}`,
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new EmailBisonApiError(
      (errorBody as Record<string, unknown>).message as string ||
      `EmailBison API error: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

/**
 * Create a new campaign
 */
export async function createCampaign(
  name: string
): Promise<{ campaign_id: string }> {
  return bisonFetch('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

/**
 * List all campaigns
 */
export async function listCampaigns(params?: {
  page?: number
  per_page?: number
  status?: string
}): Promise<{ campaigns: EmailBisonCampaign[]; total: number }> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString())
  if (params?.status) searchParams.set('status', params.status)

  const query = searchParams.toString()
  return bisonFetch(`/api/campaigns${query ? `?${query}` : ''}`)
}

/**
 * Get campaign details
 */
export async function getCampaign(
  campaignId: string
): Promise<EmailBisonCampaign> {
  return bisonFetch(`/api/campaigns/${campaignId}`)
}

/**
 * Update campaign settings
 */
export async function updateCampaignSettings(
  campaignId: string,
  settings: CampaignSettings
): Promise<void> {
  await bisonFetch(`/api/campaigns/${campaignId}`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  })
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(
  campaignId: string
): Promise<void> {
  await bisonFetch(`/api/campaigns/${campaignId}/pause`, {
    method: 'POST',
  })
}

// ============================================================================
// SEQUENCE STEPS
// ============================================================================

/**
 * Add a sequence step (email) to a campaign
 * Endpoint: POST /api/campaigns/sequence-steps (campaign_id in body)
 */
export async function addSequenceStep(
  campaignId: string,
  step: SequenceStep
): Promise<{ step_id: string }> {
  return bisonFetch('/api/campaigns/sequence-steps', {
    method: 'POST',
    body: JSON.stringify({
      campaign_id: campaignId,
      subject: step.subject,
      body: step.body,
      wait_days: step.wait_days || 1,
    }),
  })
}

/**
 * Activate or deactivate a sequence step variant
 * (New in Feb 3 release)
 */
export async function toggleSequenceVariant(
  campaignId: string,
  variantId: string,
  active: boolean
): Promise<void> {
  await bisonFetch(`/api/campaigns/${campaignId}/sequences/variants/${variantId}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
}

/**
 * Delete a sequence step
 */
export async function deleteSequenceStep(
  stepId: string
): Promise<void> {
  await bisonFetch(`/api/campaigns/sequence-steps/${stepId}`, {
    method: 'DELETE',
  })
}

/**
 * Send a test email for a sequence step
 */
export async function sendTestEmail(
  stepId: string,
  testEmail: string
): Promise<void> {
  await bisonFetch(`/api/campaigns/sequence-steps/${stepId}/send-test`, {
    method: 'POST',
    body: JSON.stringify({ email: testEmail }),
  })
}

// ============================================================================
// LEADS
// ============================================================================

/**
 * List/search leads
 */
export async function listLeads(params?: {
  search?: string
  tag_ids?: string[]
  page?: number
}): Promise<{ leads: EmailBisonLead[]; total: number }> {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set('search', params.search)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.tag_ids) {
    params.tag_ids.forEach((id, i) => searchParams.set(`filters[tag_ids][${i}]`, id))
  }

  const query = searchParams.toString()
  return bisonFetch(`/api/leads${query ? `?${query}` : ''}`)
}

/**
 * Add leads to a campaign
 */
export async function addLeadsToCampaign(
  campaignId: string,
  leads: EmailBisonLead[]
): Promise<{ added: number; skipped: number }> {
  return bisonFetch(`/api/campaigns/${campaignId}/leads`, {
    method: 'POST',
    body: JSON.stringify({ leads }),
  })
}

/**
 * Move leads to another campaign
 * (New in Feb 3 release)
 */
export async function moveLeadsToCampaign(
  fromCampaignId: string,
  toCampaignId: string,
  leadIds: string[]
): Promise<{ moved: number }> {
  return bisonFetch(`/api/campaigns/${fromCampaignId}/leads/move`, {
    method: 'POST',
    body: JSON.stringify({
      target_campaign_id: toCampaignId,
      lead_ids: leadIds,
    }),
  })
}

/**
 * Create or update a lead (global, not campaign-specific)
 */
export async function createOrUpdateLead(
  lead: EmailBisonLead
): Promise<{ lead_id: string }> {
  return bisonFetch('/api/leads', {
    method: 'POST',
    body: JSON.stringify(lead),
  })
}

/**
 * Manage lead tags within a campaign
 * (New in Feb 3 release)
 */
export async function addLeadTagsInCampaign(
  campaignId: string,
  leadId: string,
  tagIds: string[]
): Promise<void> {
  await bisonFetch(`/api/campaigns/${campaignId}/leads/${leadId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tag_ids: tagIds }),
  })
}

// ============================================================================
// SENDER EMAILS
// ============================================================================

/**
 * List sender emails with optional status filter
 * Status options: connected, not_connected, pending_move, pending_deletion
 * (Status filter new in Feb 3 release, warmup_enabled boolean also new)
 */
export async function listSenderEmails(params?: {
  status?: 'connected' | 'not_connected' | 'pending_move' | 'pending_deletion'
}): Promise<{ sender_emails: EmailBisonSenderEmail[] }> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)

  const query = searchParams.toString()
  return bisonFetch(`/api/sender-emails${query ? `?${query}` : ''}`)
}

/**
 * Add sender emails to a campaign
 * Endpoint: POST /api/campaigns/{id}/attach-sender-emails
 */
export async function addSenderEmailsToCampaign(
  campaignId: string,
  senderEmailIds: string[]
): Promise<void> {
  await bisonFetch(`/api/campaigns/${campaignId}/attach-sender-emails`, {
    method: 'POST',
    body: JSON.stringify({ sender_email_ids: senderEmailIds }),
  })
}

/**
 * Remove sender emails from a campaign
 * Endpoint: POST /api/campaigns/{id}/remove-sender-emails
 */
export async function removeSenderEmailsFromCampaign(
  campaignId: string,
  senderEmailIds: string[]
): Promise<void> {
  await bisonFetch(`/api/campaigns/${campaignId}/remove-sender-emails`, {
    method: 'POST',
    body: JSON.stringify({ sender_email_ids: senderEmailIds }),
  })
}

// ============================================================================
// TAGS
// ============================================================================

/**
 * Create a new tag
 * (Note: deprecated 'default' parameter removed in Feb 3 release)
 */
export async function createTag(
  name: string
): Promise<{ tag: EmailBisonTag }> {
  return bisonFetch('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

/**
 * Attach tags to leads
 */
export async function attachTagsToLeads(
  leadIds: string[],
  tagIds: string[]
): Promise<void> {
  await bisonFetch('/api/tags/attach-to-leads', {
    method: 'POST',
    body: JSON.stringify({ lead_ids: leadIds, tag_ids: tagIds }),
  })
}

/**
 * Remove tags from leads
 */
export async function removeTagsFromLeads(
  leadIds: string[],
  tagIds: string[]
): Promise<void> {
  await bisonFetch('/api/tags/remove-from-leads', {
    method: 'POST',
    body: JSON.stringify({ lead_ids: leadIds, tag_ids: tagIds }),
  })
}

// ============================================================================
// SCHEDULED EMAILS
// ============================================================================

/**
 * Get scheduled emails (generic endpoint, not campaign-scoped)
 * (New in Feb 3 release - avoids looping through campaign IDs)
 */
export async function getScheduledEmails(params?: {
  page?: number
  per_page?: number
  campaign_id?: string
  lead_id?: string
}): Promise<{ scheduled_emails: ScheduledEmail[]; total: number }> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString())
  if (params?.campaign_id) searchParams.set('campaign_id', params.campaign_id)
  if (params?.lead_id) searchParams.set('lead_id', params.lead_id)

  const query = searchParams.toString()
  return bisonFetch(`/api/scheduled-emails${query ? `?${query}` : ''}`)
}

// ============================================================================
// CAMPAIGN SCHEDULING
// ============================================================================

/**
 * List schedule templates
 */
export async function listScheduleTemplates(): Promise<{ templates: Array<{ id: string; name: string }> }> {
  return bisonFetch('/api/campaigns/schedule/templates')
}

/**
 * Apply a schedule template to a campaign
 */
export async function applyScheduleTemplate(
  campaignId: string,
  scheduleId: string
): Promise<void> {
  await bisonFetch(`/api/campaigns/${campaignId}/create-schedule-from-template`, {
    method: 'POST',
    body: JSON.stringify({ schedule_id: scheduleId }),
  })
}

/**
 * Create a custom schedule for a campaign
 */
export async function createCampaignSchedule(
  campaignId: string,
  schedule: CampaignSchedule
): Promise<void> {
  await bisonFetch(`/api/campaigns/${campaignId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(schedule),
  })
}

// ============================================================================
// WEBHOOKS
// ============================================================================

/**
 * Verify EmailBison webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = process.env.EMAILBISON_WEBHOOK_SECRET || ''
): boolean {
  if (!secret) return false

  const crypto = require('crypto')
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// ============================================================================
// REPLIES (Master Inbox)
// ============================================================================

export interface EmailBisonReply {
  id: string
  campaign_id: string
  lead_email: string
  subject: string
  body: string
  received_at: string
  is_interested?: boolean
}

/**
 * List replies (master inbox)
 */
export async function listReplies(): Promise<{ replies: EmailBisonReply[] }> {
  return bisonFetch('/api/replies')
}

/**
 * Get a single reply
 */
export async function getReply(
  replyId: string
): Promise<EmailBisonReply> {
  return bisonFetch(`/api/replies/${replyId}`)
}

/**
 * Reply to a reply (send response in same thread)
 */
export async function replyToReply(
  replyId: string,
  body: string
): Promise<void> {
  await bisonFetch(`/api/replies/${replyId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

/**
 * Mark a reply as interested
 */
export async function markReplyAsInterested(
  replyId: string
): Promise<void> {
  await bisonFetch(`/api/replies/${replyId}/mark-as-interested`, {
    method: 'PATCH',
  })
}

/**
 * Push interested reply to a follow-up campaign
 */
export async function pushToFollowupCampaign(
  replyId: string
): Promise<void> {
  await bisonFetch(`/api/replies/${replyId}/followup-campaign/push`, {
    method: 'POST',
  })
}

// ============================================================================
// HIGH-LEVEL: Campaign Builder Export
// ============================================================================

/**
 * Export a Cursive campaign draft directly to EmailBison
 *
 * Flow:
 * 1. Create campaign in EmailBison
 * 2. Add sequence steps (AI-generated emails)
 * 3. Configure settings (send limits, tracking)
 * 4. Add sender emails (all connected ones by default)
 * 5. Apply schedule (weekday business hours)
 * 6. Campaign starts paused for final review
 *
 * Returns the EmailBison campaign ID for tracking
 */
export async function exportCampaignToEmailBison(options: {
  name: string
  emails: Array<{
    step: number
    day: number
    subject: string
    body: string
  }>
  settings?: Partial<CampaignSettings>
  schedule?: CampaignSchedule
  leads?: EmailBisonLead[]
  autoAddSenderEmails?: boolean
}): Promise<{
  success: boolean
  campaignId?: string
  stepsAdded?: number
  leadsAdded?: number
  error?: string
}> {
  try {
    // 1. Create campaign
    const { campaign_id } = await createCampaign(options.name)

    // 2. Add sequence steps
    let stepsAdded = 0
    const sortedEmails = [...options.emails].sort((a, b) => a.step - b.step)

    for (const email of sortedEmails) {
      await addSequenceStep(campaign_id, {
        step_number: email.step,
        subject: email.subject,
        body: email.body,
        wait_days: email.day > 0
          ? email.day - (sortedEmails[email.step - 2]?.day || 0)
          : 1,
      })
      stepsAdded++

      // Rate limiting between API calls
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // 3. Configure settings
    if (options.settings) {
      await updateCampaignSettings(campaign_id, options.settings)
    } else {
      // Sensible defaults for cold email
      await updateCampaignSettings(campaign_id, {
        max_emails_per_day: 100,
        max_new_leads_per_day: 50,
        plain_text: true,
        open_tracking: false,
        reputation_building: true,
      })
    }

    // 4. Auto-add connected sender emails
    if (options.autoAddSenderEmails !== false) {
      try {
        const { sender_emails } = await listSenderEmails({ status: 'connected' })
        if (sender_emails.length > 0) {
          await addSenderEmailsToCampaign(
            campaign_id,
            sender_emails.map((s) => s.id)
          )
        }
      } catch {
        // Non-fatal - user can add sender emails manually
        console.warn('[EmailBison] Could not auto-add sender emails')
      }
    }

    // 5. Apply schedule (default: weekday business hours)
    if (options.schedule) {
      await createCampaignSchedule(campaign_id, options.schedule)
    } else {
      await createCampaignSchedule(campaign_id, {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        start_hour: 8,
        end_hour: 17,
        timezone: 'America/New_York',
      })
    }

    // 6. Add leads if provided
    let leadsAdded = 0
    if (options.leads && options.leads.length > 0) {
      const result = await addLeadsToCampaign(campaign_id, options.leads)
      leadsAdded = result.added
    }

    return {
      success: true,
      campaignId: campaign_id,
      stepsAdded,
      leadsAdded,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
