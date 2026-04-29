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
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-helpers'
import type { DraftSequences, EmailSequence } from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PushParams {
  clientName: string
  sequences: DraftSequences
  workspaceId: string
  ebWorkspaceId?: number | null
  dryRun?: boolean
  onCampaignCreated?: (campaign: CampaignResult) => Promise<void>
}

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
export async function pushCopyToEmailBison(params: PushParams): Promise<PushResult> {
  const { clientName, sequences, workspaceId, ebWorkspaceId, dryRun = false } = params

  if (!sequences || !Array.isArray(sequences.sequences) || sequences.sequences.length === 0) {
    throw new Error('Invalid draft_sequences: missing or empty sequences array')
  }

  const dateStr = formatDate(new Date())
  const campaigns: CampaignResult[] = []

  // Dry-run mode is used for test/preview clients (is_test_client=true) so the
  // admin can click Approve and see the full downstream flow — Slack
  // notification, automation_log entries, status promotion to active — without
  // creating real EmailBison campaigns. We synthesize a result that matches
  // the real shape closely enough for the UI to render correctly.
  if (dryRun) {
    for (const sequence of sequences.sequences) {
      const subjectVariantsTotal = sequence.emails.reduce((sum, email) => {
        const expanded = expandSpintax(email.subject_line)
        const unique = new Set(expanded).size
        return sum + Math.min(unique, 5)
      }, 0)
      campaigns.push({
        campaignId: `dryrun_${workspaceId.slice(0, 8)}_${campaigns.length + 1}`,
        campaignName: `[DRY-RUN ws:${workspaceId}] ${clientName} - ${sequence.sequence_name} - ${dateStr}`,
        sequenceSteps: subjectVariantsTotal,
        variants: subjectVariantsTotal,
      })
    }
    return { campaigns }
  }

  for (const sequence of sequences.sequences) {
    const result = await pushSingleSequence({
      clientName,
      sequence,
      dateStr,
      workspaceId,
      ebWorkspaceId: ebWorkspaceId ?? undefined,
    })
    campaigns.push(result)

    try {
      await params.onCampaignCreated?.(result)
    } catch (cbErr) {
      safeError(`[EmailBison Push] onCampaignCreated callback failed (continuing): ${getErrorMessage(cbErr)}`)
    }

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
  ebWorkspaceId?: number
}): Promise<CampaignResult> {
  const { clientName, sequence, dateStr, workspaceId, ebWorkspaceId } = params

  if (!Array.isArray(sequence.emails) || sequence.emails.length === 0) {
    throw new Error(`Invalid sequence "${sequence.sequence_name}": missing or empty emails array`)
  }

  // Prefix with workspace ID so all campaigns can be attributed back to their
  // workspace even though EmailBison has no native multi-tenant scoping.
  const campaignName = `[ws:${workspaceId}] ${clientName} - ${sequence.sequence_name} - ${dateStr}`

  // 1. Create campaign in the target EB workspace
  const { campaign_id } = await createCampaign(campaignName, ebWorkspaceId)

  // 2. Add sequence steps with spintax variants
  let totalSteps = 0
  let totalVariants = 0

  const sortedEmails = [...sequence.emails].sort((a, b) => a.step - b.step)

  for (const email of sortedEmails) {
    const { steps, variants } = await addEmailWithVariants(campaign_id, email, ebWorkspaceId)
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
  }, ebWorkspaceId)

  // 4. Attach connected sender emails scoped to the EB workspace (non-fatal)
  await attachSenderEmails(campaign_id, ebWorkspaceId)

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
  }, ebWorkspaceId)

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
  email: { step: number; delay_days: number; subject_line: string; body: string },
  ebWorkspaceId?: number
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
    }, ebWorkspaceId)
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
 * Attaches sender emails to a campaign using EB workspace-scoped lookup.
 *
 * When ebWorkspaceId is set, fetches connected senders directly from that EB
 * workspace via the super-admin key and attaches all of them. No local DB
 * lookup required — the workspace boundary is enforced by EB itself.
 *
 * If ebWorkspaceId is null/undefined, logs a warning and skips — there is no
 * safe fallback because attaching all senders would leak other clients' sending
 * identities.
 */
async function attachSenderEmails(campaignId: string, ebWorkspaceId?: number): Promise<void> {
  if (!ebWorkspaceId) {
    safeError('[EmailBison Push] No eb_workspace_id set; skipping sender attachment. Admin must attach senders manually in EmailBison.')
    return
  }

  try {
    const { sender_emails } = await listSenderEmails({ status: 'connected' }, ebWorkspaceId)

    if (!sender_emails || sender_emails.length === 0) {
      safeError(`[EmailBison Push] No connected senders in EB workspace ${ebWorkspaceId}; campaign will have zero senders. Go to EmailBison UI to connect sender accounts.`)
      return
    }

    const senderIds = sender_emails.map((s) => s.id)
    await addSenderEmailsToCampaign(campaignId, senderIds, ebWorkspaceId)
  } catch (error: unknown) {
    safeError(`[EmailBison Push] Could not attach sender emails for EB workspace ${ebWorkspaceId}: ${getErrorMessage(error)}`)
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
