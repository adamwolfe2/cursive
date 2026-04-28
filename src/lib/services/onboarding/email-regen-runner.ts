// Shared regen flow used by both the portal endpoint and the admin endpoint.
//
// Lives outside any /api route file because Next.js App Router only allows
// specific named exports (GET/POST/etc) from route.ts files. Both the
// portal `/api/portal/[token]/regenerate-email` and the admin
// `/api/admin/onboarding/[id]/regenerate-email` endpoints call this.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { regenerateSingleEmail, isCreditBalanceError } from '@/lib/services/onboarding/copy-generation'
import { safeError } from '@/lib/utils/log-sanitizer'
import type {
  DraftSequences,
  EnrichedICPBrief,
  OnboardingClient,
  SequenceEmail,
} from '@/types/onboarding'

const REGEN_LIMIT_PER_EMAIL_PER_DAY = 8

interface CommentRow {
  id: string
  sequence_index: number
  email_step: number
  body: string
  status: string
  author_type: string
  author_name: string | null
  created_at: string
}

export async function runRegen(args: {
  supabase: ReturnType<typeof createAdminClient>
  clientId: string
  sequenceIndex: number
  emailStep: number
  authorType: 'client' | 'admin'
}): Promise<NextResponse> {
  const { supabase, clientId, sequenceIndex, emailStep, authorType } = args

  const { data: client, error: clientError } = await supabase
    .from('onboarding_clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle<OnboardingClient>()

  if (clientError || !client) {
    safeError('[regenerate-email] client load failed:', clientError)
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const icpBrief = client.enriched_icp_brief as EnrichedICPBrief | null
  if (!icpBrief) {
    return NextResponse.json(
      { error: 'Cannot regenerate email before ICP enrichment is complete.' },
      { status: 409 }
    )
  }

  const sequences = client.draft_sequences as DraftSequences | null
  if (!sequences || !Array.isArray(sequences.sequences) || sequences.sequences.length === 0) {
    return NextResponse.json(
      { error: 'No draft sequences exist for this client yet.' },
      { status: 409 }
    )
  }

  const sequence = sequences.sequences[sequenceIndex]
  if (!sequence) {
    return NextResponse.json(
      { error: `Sequence index ${sequenceIndex} does not exist.` },
      { status: 400 }
    )
  }

  const targetEmail = sequence.emails.find((e) => e.step === emailStep)
  if (!targetEmail) {
    return NextResponse.json(
      { error: `Email step ${emailStep} does not exist in sequence ${sequenceIndex}.` },
      { status: 400 }
    )
  }

  // Rate limit per email per day. Counts logs of step 'email_regen' for the
  // same (sequence_index, email_step). The automation_log is the cheapest
  // source of truth and is already scoped to this client.
  const todayUtc = new Date().toISOString().slice(0, 10)
  const todayCount = (client.automation_log ?? []).filter((entry) => {
    if (entry.step !== 'email_regen') return false
    const meta = (entry as { metadata?: Record<string, unknown> }).metadata
    if (!meta) return false
    return (
      meta.sequence_index === sequenceIndex &&
      meta.email_step === emailStep &&
      typeof entry.timestamp === 'string' &&
      entry.timestamp.slice(0, 10) === todayUtc
    )
  }).length
  if (todayCount >= REGEN_LIMIT_PER_EMAIL_PER_DAY) {
    return NextResponse.json(
      {
        error: `You have hit the daily regenerate limit (${REGEN_LIMIT_PER_EMAIL_PER_DAY}) for this email. Try again tomorrow or reach out to the team.`,
      },
      { status: 429 }
    )
  }

  // Pull OPEN comments scoped to this exact email.
  const { data: commentRows, error: commentsError } = await supabase
    .from('client_portal_copy_comments')
    .select('id, sequence_index, email_step, body, status, author_type, author_name, created_at')
    .eq('client_id', clientId)
    .eq('sequence_index', sequenceIndex)
    .eq('email_step', emailStep)
    .eq('status', 'open')
    .order('created_at', { ascending: true })

  if (commentsError) {
    safeError('[regenerate-email] comments load failed:', commentsError)
    return NextResponse.json({ error: 'Could not load comments.' }, { status: 500 })
  }

  const openComments = (commentRows ?? []) as CommentRow[]

  let revisedEmail
  try {
    revisedEmail = await regenerateSingleEmail({
      client,
      icpBrief,
      sequences,
      sequenceIndex,
      emailStep,
      comments: openComments.map((c) => ({
        body: c.body,
        author_type: c.author_type,
        author_name: c.author_name,
        created_at: c.created_at,
      })),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown regen error'
    const credits = isCreditBalanceError(err)
    safeError('[regenerate-email] Claude call failed:', msg)
    await appendLog(supabase, clientId, {
      step: 'email_regen',
      status: 'failed',
      error: credits
        ? `BLOCKED: Anthropic credits exhausted, top up at console.anthropic.com/settings/billing then retry.`
        : msg,
      timestamp: new Date().toISOString(),
      metadata: { sequence_index: sequenceIndex, email_step: emailStep, author_type: authorType },
    })
    if (credits) {
      // Surface a clear, action-oriented message to the user instead of a
      // confusing "Regeneration failed: 400 ...credit balance...".
      return NextResponse.json(
        {
          error:
            'Our AI service is temporarily unavailable (out of credits). Cursive has been notified, please try again in a few minutes.',
        },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: `Regeneration failed: ${msg}` }, { status: 502 })
  }

  // Atomically replace ONLY this email in draft_sequences. Deep clone via map.
  const patched: DraftSequences = {
    ...sequences,
    sequences: sequences.sequences.map((seq, sIdx) => {
      if (sIdx !== sequenceIndex) return seq
      return {
        ...seq,
        emails: seq.emails.map((email) => {
          if (email.step !== emailStep) return email
          const merged: SequenceEmail = {
            ...email,
            step: revisedEmail.step,
            delay_days: revisedEmail.delay_days,
            subject_line: revisedEmail.subject_line,
            body: revisedEmail.body,
            preview_text: revisedEmail.preview_text ?? email.preview_text,
            word_count: revisedEmail.word_count ?? email.word_count,
            purpose: revisedEmail.purpose || email.purpose,
            why_it_works: revisedEmail.why_it_works ?? email.why_it_works,
            spintax_test_notes: revisedEmail.spintax_test_notes ?? email.spintax_test_notes,
          }
          return merged
        }),
      }
    }),
  }

  const { error: writeError } = await supabase
    .from('onboarding_clients')
    .update({
      draft_sequences: patched as unknown as Record<string, unknown>,
      copy_approval_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (writeError) {
    safeError('[regenerate-email] DB write failed:', writeError)
    return NextResponse.json({ error: 'Could not save the revised email.' }, { status: 500 })
  }

  // Auto-resolve only the comments we just sent to Claude.
  if (openComments.length > 0) {
    const now = new Date().toISOString()
    const ids = openComments.map((c) => c.id)
    await supabase
      .from('client_portal_copy_comments')
      .update({
        status: 'resolved',
        resolved_by: authorType,
        resolved_at: now,
        updated_at: now,
      })
      .in('id', ids)
  }

  await appendLog(supabase, clientId, {
    step: 'email_regen',
    status: 'complete',
    timestamp: new Date().toISOString(),
    metadata: {
      sequence_index: sequenceIndex,
      email_step: emailStep,
      author_type: authorType,
      comments_resolved: openComments.length,
    },
  })

  return NextResponse.json({
    revised_email: revisedEmail,
    comments_resolved: openComments.length,
  })
}

async function appendLog(
  supabase: ReturnType<typeof createAdminClient>,
  clientId: string,
  entry: {
    step: string
    status: 'complete' | 'failed'
    timestamp: string
    error?: string
    metadata?: Record<string, unknown>
  }
) {
  try {
    const { data } = await supabase
      .from('onboarding_clients')
      .select('automation_log')
      .eq('id', clientId)
      .maybeSingle<{ automation_log: unknown[] }>()
    const log = Array.isArray(data?.automation_log) ? data.automation_log : []
    await supabase
      .from('onboarding_clients')
      .update({ automation_log: [...log, entry] })
      .eq('id', clientId)
  } catch {
    // best effort
  }
}
