// EmailBison Push Service
// Creates EmailBison campaigns from approved onboarding copy.
// One campaign per sequence, with spintax expanded into A/B variants.

import {
  createCampaign,
  addSequenceStep,
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
export async function pushCopyToEmailBison(
  params: PushParams
): Promise<PushResult> {
  const {
    clientName,
    sequences,
    workspaceId,
    ebWorkspaceId,
    dryRun = false,
  } = params

  if (
    !sequences ||
    !Array.isArray(sequences.sequences) ||
    sequences.sequences.length === 0
  ) {
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
        // Dry-run name mirrors the real format below (without the workspace
        // UUID prefix) but adds a [DRY-RUN] tag so test-client previews can't
        // be mistaken for live campaigns in the admin UI.
        campaignName: `[DRY-RUN] ${clientName} · ${sequence.sequence_name} · ${dateStr}`,
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
      safeError(
        `[EmailBison Push] onCampaignCreated callback failed (continuing): ${getErrorMessage(cbErr)}`
      )
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
    throw new Error(
      `Invalid sequence "${sequence.sequence_name}": missing or empty emails array`
    )
  }

  // Campaign name shown in EB UI. Format:
  //   "{ClientName} · {SequenceName} · {YYYY-MM-DD}"
  //   e.g. "JustSearched · Campaign Performance Reality Check · 2026-06-03"
  //
  // Previously prefixed with [ws:{workspaceUuid}] for cross-tenant
  // attribution back when all campaigns lived in one EB workspace
  // ("Adam's Team"). With per-client EB workspaces + scoped API keys,
  // each EB workspace IS the tenant boundary — the UUID prefix was
  // pure noise to the operator scanning the EB UI. Dropped.
  //
  // The sequence name already encodes the angle (e.g. "Campaign
  // Performance Reality Check", "Margin Recovery Through Data
  // Partnerships") so a single glance tells the operator both which
  // client and what the campaign's pitch is. Date suffix
  // disambiguates re-pushes without forcing a delete first.
  //
  // _workspaceId is kept on the signature for callers, but no longer
  // surfaces in the name; intentionally unused here.
  void workspaceId
  const campaignName = `${clientName} · ${sequence.sequence_name} · ${dateStr}`

  // 1. Create campaign in the target EB workspace
  const { campaign_id } = await createCampaign(campaignName, ebWorkspaceId)

  // 2. Add sequence steps (one EB sequence-step per email position).
  //    Subject A/B variants are NOT shipped today — EB's variant primitive
  //    is a separate API surface that creates sibling sequence-steps under
  //    a primary, which we haven't fully modelled yet. Only the primary
  //    (first expanded) subject ships per email position. Spintax in the
  //    body still ships inline; EB's renderer expands it at send time.
  //    TODO: full variant support — see emailbison.ts addSequenceStep notes.
  let totalSteps = 0
  let totalVariants = 0

  const sortedEmails = [...sequence.emails].sort((a, b) => a.step - b.step)

  for (const email of sortedEmails) {
    const { steps, variants } = await addEmailWithVariants(
      campaign_id,
      email,
      ebWorkspaceId
    )
    totalSteps += steps
    totalVariants += variants
    await delay(200)
  }

  // 3. Campaign settings update is currently a no-op — see
  //    updateCampaignSettings JSDoc. EB has no working endpoint to update
  //    send caps / plain_text / open_tracking on existing campaigns; defaults
  //    apply (max_emails_per_day: 1000). Tune in EB UI per campaign for now.

  // 4. Attach connected sender emails scoped to the EB workspace (non-fatal)
  await attachSenderEmails(campaign_id, ebWorkspaceId)

  // 5. Apply weekday business-hours schedule
  await createCampaignSchedule(
    campaign_id,
    {
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
    },
    ebWorkspaceId
  )

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
  email: {
    step: number
    delay_days: number
    subject_line: string
    body: string
  },
  ebWorkspaceId?: number
): Promise<{ steps: number; variants: number }> {
  // Pick the primary subject (first deterministic expansion of spintax).
  // EB's variant API is a separate primitive we don't fully model yet, so
  // we ship one subject per email position for today's launch. Body spintax
  // still ships inline; EB's renderer expands it per-send.
  // TODO: when EB variant support lands, expand to all uniqueSubjects up
  // to MAX_VARIANTS and POST each as a variant of the primary step id.
  const subjectVariants = expandSpintax(email.subject_line)
  const primarySubject = subjectVariants[0] ?? email.subject_line
  const uniqueSubjectCount = new Set(subjectVariants).size

  await addSequenceStep(
    campaignId,
    {
      step_number: email.step,
      subject: primarySubject,
      body: email.body,
      wait_days: email.delay_days,
    },
    ebWorkspaceId
  )

  return {
    steps: 1,
    variants: uniqueSubjectCount,
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
async function attachSenderEmails(
  campaignId: string,
  ebWorkspaceId?: number
): Promise<void> {
  if (!ebWorkspaceId) {
    safeError(
      '[EmailBison Push] No eb_workspace_id set; skipping sender attachment. Admin must attach senders manually in EmailBison.'
    )
    return
  }

  try {
    const { sender_emails } = await listSenderEmails(
      { status: 'connected' },
      ebWorkspaceId
    )

    if (!sender_emails || sender_emails.length === 0) {
      safeError(
        `[EmailBison Push] No connected senders in EB workspace ${ebWorkspaceId}; campaign will have zero senders. Go to EmailBison UI to connect sender accounts.`
      )
      return
    }

    const senderIds = sender_emails.map((s) => s.id)
    await addSenderEmailsToCampaign(campaignId, senderIds, ebWorkspaceId)
  } catch (error: unknown) {
    safeError(
      `[EmailBison Push] Could not attach sender emails for EB workspace ${ebWorkspaceId}: ${getErrorMessage(error)}`
    )
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
