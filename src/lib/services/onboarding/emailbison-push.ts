// EmailBison Push Service
// Creates EmailBison campaigns from approved onboarding copy.
// One campaign per sequence, with spintax expanded into A/B variants.

import {
  createCampaign,
  addSequenceStep,
  updateCampaignSettings,
  listSenderEmails,
  addSenderEmailsToCampaign,
  createCampaignSchedule,
} from '@/lib/integrations/emailbison'
import { expandSpintax } from '@/lib/services/onboarding/copy-quality-check'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-helpers'
import type { DraftSequences, EmailSequence } from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PushResult {
  campaigns: CampaignResult[]
}

export interface CampaignResult {
  campaignId: string
  campaignName: string
  sequenceSteps: number
  variants: number
}

// ---------------------------------------------------------------------------
// Main push function
// ---------------------------------------------------------------------------

/**
 * Creates EmailBison campaigns from approved onboarding copy.
 *
 * Flow per sequence:
 * 1. Create campaign in EmailBison (name: "{client} - {angle} - {date}")
 * 2. For each email, add as a sequence step (first variant = the raw spintax version)
 * 3. Expand spintax to produce A/B variants via additional sequence steps
 * 4. Configure campaign settings (send limits, plain text, etc.)
 * 5. Attach all connected sender emails
 * 6. Apply weekday business-hours schedule
 *
 * Returns campaign IDs for storage on the client record.
 */
export async function pushCopyToEmailBison(params: {
  clientName: string
  sequences: DraftSequences
  workspaceId: string
}): Promise<PushResult> {
  const { clientName, sequences, workspaceId } = params
  const dateStr = formatDate(new Date())
  const campaigns: CampaignResult[] = []

  for (const sequence of sequences.sequences) {
    const result = await pushSingleSequence({
      clientName,
      sequence,
      dateStr,
      workspaceId,
    })
    campaigns.push(result)

    // Rate limit between campaign creations
    await delay(300)
  }

  return { campaigns }
}

// ---------------------------------------------------------------------------
// Per-sequence push
// ---------------------------------------------------------------------------

async function pushSingleSequence(params: {
  clientName: string
  sequence: EmailSequence
  dateStr: string
  workspaceId: string
}): Promise<CampaignResult> {
  const { clientName, sequence, dateStr, workspaceId } = params
  // Prefix with workspace ID so all campaigns can be attributed back to their
  // workspace even though EmailBison has no native multi-tenant scoping.
  const campaignName = `[ws:${workspaceId}] ${clientName} - ${sequence.sequence_name} - ${dateStr}`

  // 1. Create campaign
  const { campaign_id } = await createCampaign(campaignName)

  // 2. Add sequence steps with spintax variants
  let totalSteps = 0
  let totalVariants = 0

  const sortedEmails = [...sequence.emails].sort((a, b) => a.step - b.step)

  for (const email of sortedEmails) {
    const { steps, variants } = await addEmailWithVariants(campaign_id, email)
    totalSteps += steps
    totalVariants += variants
    await delay(200)
  }

  // 3. Configure sensible defaults for cold email
  await updateCampaignSettings(campaign_id, {
    max_emails_per_day: 100,
    max_new_leads_per_day: 50,
    plain_text: true,
    open_tracking: false,
    reputation_building: true,
  })

  // 4. Attach connected sender emails for this workspace only (non-fatal)
  await attachSenderEmails(campaign_id, workspaceId)

  // 5. Apply weekday business-hours schedule
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

  return {
    campaignId: campaign_id,
    campaignName,
    sequenceSteps: totalSteps,
    variants: totalVariants,
  }
}

// ---------------------------------------------------------------------------
// Spintax variant expansion for a single email
// ---------------------------------------------------------------------------

/**
 * Adds the primary email as a sequence step, then expands spintax in the
 * subject and body to create A/B variant steps.
 *
 * Strategy: Expand subject-line spintax into distinct variants. The body
 * keeps its spintax inline (EmailBison's own renderer handles body spintax).
 * Each unique subject variant becomes a separate sequence step at the same
 * position so EmailBison treats them as A/B variants.
 */
async function addEmailWithVariants(
  campaignId: string,
  email: { step: number; delay_days: number; subject_line: string; body: string }
): Promise<{ steps: number; variants: number }> {
  const subjectVariants = expandSpintax(email.subject_line)

  // Deduplicate in case spintax expansion produces identical subjects
  const uniqueSubjects = [...new Set(subjectVariants)]

  // Cap variants to avoid API overload
  const MAX_VARIANTS = 5
  const subjectsToUse = uniqueSubjects.slice(0, MAX_VARIANTS)

  let stepsAdded = 0

  for (const subject of subjectsToUse) {
    await addSequenceStep(campaignId, {
      step_number: email.step,
      subject,
      body: email.body,
      wait_days: email.delay_days,
    })
    stepsAdded++
    await delay(200)
  }

  return {
    steps: stepsAdded,
    variants: subjectsToUse.length,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attaches only the sender emails that belong to the given workspace.
 *
 * EmailBison has no native workspace scoping, so we resolve which sender
 * emails belong to this workspace by:
 * 1. Querying the local email_accounts table filtered by workspace_id to
 *    get the set of email addresses owned by this workspace.
 * 2. Fetching the full EB sender email list (status: connected).
 * 3. Intersecting the two sets so we only attach workspace-scoped senders.
 */
async function attachSenderEmails(campaignId: string, workspaceId: string): Promise<void> {
  try {
    // 1. Resolve workspace-owned email addresses from local DB
    const supabase = createAdminClient()
    const { data: localAccounts, error: dbError } = await supabase
      .from('email_accounts')
      .select('email_address')
      .eq('workspace_id', workspaceId)
      .eq('is_verified', true)

    if (dbError) {
      safeError(`[EmailBison Push] Could not fetch local email accounts: ${dbError.message}`)
      return
    }

    if (!localAccounts || localAccounts.length === 0) {
      return
    }

    const workspaceAddresses = new Set(localAccounts.map((a) => a.email_address.toLowerCase()))

    // 2. Fetch all connected EB sender emails
    const { sender_emails } = await listSenderEmails({ status: 'connected' })

    // 3. Filter to only sender emails that match this workspace's accounts
    const workspaceSenderIds = sender_emails
      .filter((s) => workspaceAddresses.has(s.email.toLowerCase()))
      .map((s) => s.id)

    if (workspaceSenderIds.length > 0) {
      await addSenderEmailsToCampaign(campaignId, workspaceSenderIds)
    }
  } catch (error: unknown) {
    safeError(`[EmailBison Push] Could not attach sender emails: ${getErrorMessage(error)}`)
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
