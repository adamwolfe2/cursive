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
 * Attaches sender emails to a campaign.
 *
 * Onboarding clients pass their `client.id` as `workspaceId` because they have
 * no real workspace. Production users pass a true `workspace_id`. The lookup
 * works the same in both cases: try to match by workspace, and if zero rows
 * match (which is always the case for onboarding clients) fall back to ALL
 * connected senders. Without this fallback, campaigns ship with zero senders
 * and silently never send, the worst possible failure mode at launch.
 *
 * EmailBison has no native workspace scoping, so:
 * 1. Try to resolve workspace-owned email addresses from email_accounts.
 * 2. If none found, attach all connected senders (onboarding fallback).
 * 3. Otherwise intersect with the EB connected list and attach only the match.
 */
async function attachSenderEmails(campaignId: string, workspaceId: string): Promise<void> {
  try {
    // Always fetch the EB connected list, we need it either way.
    const { sender_emails } = await listSenderEmails({ status: 'connected' })

    if (!sender_emails || sender_emails.length === 0) {
      safeError('[EmailBison Push] No connected sender emails available, campaign will have zero senders')
      return
    }

    // 1. Resolve workspace-owned email addresses from local DB
    const supabase = createAdminClient()
    const { data: localAccounts, error: dbError } = await supabase
      .from('email_accounts')
      .select('email_address')
      .eq('workspace_id', workspaceId)
      .eq('is_verified', true)

    if (dbError) {
      safeError(`[EmailBison Push] Could not fetch local email accounts: ${dbError.message}, falling back to all connected senders`)
    }

    const matched = (localAccounts || []).map((a) => a.email_address.toLowerCase())
    const workspaceAddresses = new Set(matched)

    let senderIdsToAttach: string[]
    if (workspaceAddresses.size === 0) {
      // ONBOARDING FALLBACK: attach all connected senders so the campaign is
      // not empty. Real-workspace users go through the matched path below.
      senderIdsToAttach = sender_emails.map((s) => s.id)
      safeError(`[EmailBison Push] No workspace-matched senders for ${workspaceId}, attaching all ${senderIdsToAttach.length} connected senders as fallback`)
    } else {
      senderIdsToAttach = sender_emails
        .filter((s) => workspaceAddresses.has(s.email.toLowerCase()))
        .map((s) => s.id)
      if (senderIdsToAttach.length === 0) {
        // Workspace had local accounts but none matched EB. Fall back too.
        senderIdsToAttach = sender_emails.map((s) => s.id)
        safeError(`[EmailBison Push] Workspace ${workspaceId} accounts did not match any EB connected sender, attaching all ${senderIdsToAttach.length} as fallback`)
      }
    }

    if (senderIdsToAttach.length > 0) {
      await addSenderEmailsToCampaign(campaignId, senderIdsToAttach)
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
