/**
 * Inline sequence edit service.
 *
 * Powers autosave inline editing of draft email copy from two surfaces:
 *   - Admin onboarding screen (/admin/onboarding/[id] -> SequenceReview)
 *   - Client portal (/portal/[token] -> ClientPortal)
 *
 * Both surfaces call the same core function via thin HTTP wrappers so the
 * lock/concurrency/audit logic only lives in one place.
 *
 * Policy (decided 2026-06):
 *   - Client edits DO NOT reset copy_approval_status. The client owns the
 *     brand; trusting their edits matches how the portal already handles
 *     per-email regenerations.
 *   - Edits are LOCKED once campaign_deployed=true (campaigns are already
 *     in EB; further edits should happen in EmailBison UI to avoid copy
 *     drift between Cursive's preview and the live campaign).
 *   - Edits are LOCKED while copy_generation_status='processing' (a Claude
 *     rewrite is in flight and would clobber the edit on completion).
 *   - Optimistic concurrency: caller passes expected_updated_at; if the
 *     DB row has moved since the editor loaded it, return 409 with the
 *     current state instead of stomping the other writer.
 *   - Quality check is re-run after the edit; warnings are returned but
 *     do not block the save. The client/admin owns final approval.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { checkCopyQuality } from '@/lib/services/onboarding/copy-quality-check'
import { safeError } from '@/lib/utils/log-sanitizer'
import type {
  OnboardingClient,
  DraftSequences,
  QualityIssue,
} from '@/types/onboarding'

export type EditField = 'subject_line' | 'body'

export interface SequenceEditInput {
  clientId: string
  sequenceIndex: number
  emailStep: number
  field: EditField
  value: string
  /** Optimistic-concurrency token: the updated_at the editor saw when the
   *  field was loaded. Mismatched value -> 409 with current state. */
  expectedUpdatedAt: string
  actor: 'admin' | 'client'
  actorEmail?: string | null
  actorTokenId?: string | null
}

export type SequenceEditResult =
  | {
      ok: true
      draft_sequences: DraftSequences
      updated_at: string
      warnings: QualityIssue[]
    }
  | {
      ok: false
      status:
        | 'locked'
        | 'conflict'
        | 'not_found'
        | 'invalid_position'
        | 'invalid_field'
        | 'invalid_value'
        | 'server_error'
      message: string
      current_updated_at?: string
      current_draft_sequences?: DraftSequences
    }

// Defense-in-depth: cap field length so a runaway client (or a bug) can't
// blow up the JSONB column. Subject + body sizes are well above the V3
// word caps with room for spintax expansion.
const MAX_SUBJECT_LENGTH = 500
const MAX_BODY_LENGTH = 5000

export async function saveSequenceEdit(
  input: SequenceEditInput
): Promise<SequenceEditResult> {
  const {
    clientId,
    sequenceIndex,
    emailStep,
    field,
    value,
    expectedUpdatedAt,
    actor,
    actorEmail,
    actorTokenId,
  } = input

  // Validate field shape early so we never write garbage to the JSONB
  // column. The HTTP wrapper also validates with Zod, but defending here
  // means direct callers (cron, background jobs) can't bypass it.
  if (field !== 'subject_line' && field !== 'body') {
    return {
      ok: false,
      status: 'invalid_field',
      message: `Unknown field "${field}". Allowed: subject_line, body.`,
    }
  }
  if (typeof value !== 'string') {
    return {
      ok: false,
      status: 'invalid_value',
      message: 'value must be a string.',
    }
  }
  const maxLen = field === 'subject_line' ? MAX_SUBJECT_LENGTH : MAX_BODY_LENGTH
  if (value.length > maxLen) {
    return {
      ok: false,
      status: 'invalid_value',
      message: `${field} exceeds max length ${maxLen} (received ${value.length}).`,
    }
  }

  const supabase = createAdminClient()

  // Load the client. We fetch only what we need to make the lock + merge
  // decisions; the full client object is also needed by checkCopyQuality.
  const { data: client, error: loadErr } = await supabase
    .from('onboarding_clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle()

  if (loadErr) {
    safeError('[sequence-edit] failed to load client', loadErr)
    return {
      ok: false,
      status: 'server_error',
      message: 'Failed to load client.',
    }
  }
  if (!client) {
    return {
      ok: false,
      status: 'not_found',
      message: 'Client not found.',
    }
  }

  const typedClient = client as OnboardingClient

  // Lock checks. These two states mean editing is unsafe.
  if (typedClient.campaign_deployed) {
    return {
      ok: false,
      status: 'locked',
      message:
        'Campaigns have already been pushed to EmailBison. Edit copy in the EmailBison UI to update sent or scheduled emails.',
    }
  }
  if (typedClient.copy_generation_status === 'processing') {
    return {
      ok: false,
      status: 'locked',
      message:
        'Copy regeneration is currently running. Your edit would be overwritten when it completes — try again in a moment.',
    }
  }

  // Optimistic concurrency. If the editor's last-seen updated_at no longer
  // matches the row, someone else (another admin, the regen runner, etc.)
  // wrote in the meantime — bounce the edit and let the UI reload.
  if (typedClient.updated_at !== expectedUpdatedAt) {
    return {
      ok: false,
      status: 'conflict',
      message:
        'This client was updated by another writer since you loaded the editor. Reload the page to pick up the latest copy.',
      current_updated_at: typedClient.updated_at,
      current_draft_sequences:
        (typedClient.draft_sequences as DraftSequences | null) ?? undefined,
    }
  }

  // Locate the target email inside draft_sequences.
  const current = (typedClient.draft_sequences as DraftSequences | null) ?? null
  if (!current || !Array.isArray(current.sequences)) {
    return {
      ok: false,
      status: 'invalid_position',
      message: 'This client has no draft sequences to edit.',
    }
  }
  if (sequenceIndex < 0 || sequenceIndex >= current.sequences.length) {
    return {
      ok: false,
      status: 'invalid_position',
      message: `sequence_index ${sequenceIndex} is out of range (0..${current.sequences.length - 1}).`,
    }
  }
  const sequence = current.sequences[sequenceIndex]
  const emailIdx = sequence.emails.findIndex((e) => e.step === emailStep)
  if (emailIdx === -1) {
    return {
      ok: false,
      status: 'invalid_position',
      message: `email step ${emailStep} not found in sequence ${sequenceIndex}.`,
    }
  }
  const targetEmail = sequence.emails[emailIdx]
  const prevValue = (targetEmail[field] ?? '') as string

  // No-op short-circuit: identical value, skip the DB roundtrip + audit row.
  if (prevValue === value) {
    return {
      ok: true,
      draft_sequences: current,
      updated_at: typedClient.updated_at,
      warnings: (current.quality_check?.issues ?? []) as QualityIssue[],
    }
  }

  // Deep-merge immutably (never mutate the loaded object).
  const nextSequences: DraftSequences = {
    ...current,
    sequences: current.sequences.map((seq, sIdx) => {
      if (sIdx !== sequenceIndex) return seq
      return {
        ...seq,
        emails: seq.emails.map((email, eIdx) => {
          if (eIdx !== emailIdx) return email
          return { ...email, [field]: value }
        }),
      }
    }),
  }

  // Re-run quality checks so the editor can surface fresh warnings. Errors
  // here are non-blocking (the user owns the brand), but we still want to
  // store them on the JSONB so the next page load shows them.
  let warnings: QualityIssue[] = []
  try {
    const check = checkCopyQuality(nextSequences, typedClient)
    warnings = check.issues
    nextSequences.quality_check = {
      passed: check.passed,
      issues: check.issues,
    }
  } catch (qErr) {
    safeError('[sequence-edit] quality recheck failed (non-fatal)', qErr)
  }

  const now = new Date().toISOString()

  // Conditional update using expected_updated_at again as a second guard.
  // The earlier in-process check covers the common case; this WHERE clause
  // protects against a race between the load and the update.
  const { data: updated, error: updateErr } = await supabase
    .from('onboarding_clients')
    .update({
      draft_sequences: nextSequences as unknown as Record<string, unknown>,
      updated_at: now,
    })
    .eq('id', clientId)
    .eq('updated_at', expectedUpdatedAt)
    .select('id, updated_at')
    .maybeSingle()

  if (updateErr) {
    safeError('[sequence-edit] update failed', updateErr)
    return {
      ok: false,
      status: 'server_error',
      message: 'Failed to save edit.',
    }
  }
  if (!updated) {
    // Optimistic concurrency lost the race. Reload state for the UI.
    const { data: latest } = await supabase
      .from('onboarding_clients')
      .select('updated_at, draft_sequences')
      .eq('id', clientId)
      .maybeSingle()
    return {
      ok: false,
      status: 'conflict',
      message:
        'Another writer updated this client between load and save. Reload to pick up the latest copy.',
      current_updated_at:
        (latest?.updated_at as string | undefined) ?? typedClient.updated_at,
      current_draft_sequences:
        (latest?.draft_sequences as DraftSequences) ?? current,
    }
  }

  // Best-effort audit row. Failure here doesn't block the save — the
  // edit is already persisted; we just lose the audit entry.
  try {
    await supabase.from('draft_sequence_edits').insert({
      client_id: clientId,
      actor,
      actor_email: actorEmail ?? null,
      actor_token_id: actorTokenId ?? null,
      sequence_index: sequenceIndex,
      email_step: emailStep,
      field,
      prev_value: prevValue,
      next_value: value,
    })
  } catch (auditErr) {
    safeError('[sequence-edit] audit insert failed (non-fatal)', auditErr)
  }

  return {
    ok: true,
    draft_sequences: nextSequences,
    updated_at: (updated.updated_at as string) ?? now,
    warnings,
  }
}
