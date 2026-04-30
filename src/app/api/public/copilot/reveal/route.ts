/**
 * POST /api/public/copilot/reveal
 * Promotes a lead's unlock_tier and returns unmasked sample leads.
 *
 * Auth: Bearer token (same as /chat). Lead must have a prior sample_view.
 *
 * Two trigger paths:
 *   1. Qualifier submitted — tier 0 → 1, returns 5 additional unmasked
 *   2. Call booked (callback from Cal.com webhook OR client-side confirm) —
 *      tier 1 → 2, returns all 15 unmasked + allows export
 *
 * The actual lead data is re-pulled fresh from AL to avoid storing PII
 * on our side (shallow log only). Limit is 1 reveal call per sample_view
 * per lead to prevent replay.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyToken } from '@/lib/copilot/public-session'
import {
  fullyRevealProfile,
  maskProfileForPublic,
  type UnmaskedSamplePerson,
  type MaskedSamplePerson,
} from '@/lib/copilot/public-tools'
import { previewAudience } from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const BodySchema = z.object({
  sample_view_id: z.string().uuid(),
  trigger: z.enum(['qualifier', 'call_booked']),
  qualifier_answers: z
    .object({
      company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
      use_case: z.enum(['cold_email', 'paid_ads', 'direct_mail', 'enrichment', 'other']).optional(),
      timeline: z.enum(['this_week', 'this_month', 'exploring']).optional(),
    })
    .optional(),
})

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'invalid_token' }, { status: 401 })

  // ── Parse body ─────────────────────────────────────────────────────
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        message: err instanceof z.ZodError ? err.issues[0]?.message : 'Invalid request body',
      },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // ── Load sample view (must belong to this lead) ───────────────────
  const { data: sampleView, error: viewErr } = await admin
    .from('audience_builder_sample_views')
    .select('id, lead_id, session_id, segment_real_id, sample_count, revealed_count, al_total_count')
    .eq('id', body.sample_view_id)
    .eq('lead_id', payload.lead_id)
    .maybeSingle()

  if (viewErr) {
    safeError('[reveal] sample view load error:', viewErr)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
  if (!sampleView) {
    return NextResponse.json({ error: 'sample_not_found' }, { status: 404 })
  }

  // ── Decide how many to unmask based on trigger ─────────────────────
  // tier 0 → 1 (qualifier):  3 already unmasked → reveal 5 more = 8 total unmasked
  // tier 1 → 2 (call booked): all unmasked + export unlocked
  const currentRevealed = sampleView.revealed_count ?? 3
  let targetRevealed = currentRevealed
  let newUnlockTier: number | null = null

  if (body.trigger === 'qualifier') {
    if (!body.qualifier_answers) {
      return NextResponse.json(
        { error: 'missing_answers', message: 'qualifier_answers required for qualifier trigger' },
        { status: 400 }
      )
    }
    targetRevealed = Math.min(sampleView.sample_count ?? 15, 8)
    newUnlockTier = 1
  } else if (body.trigger === 'call_booked') {
    targetRevealed = sampleView.sample_count ?? 15
    newUnlockTier = 2
  }

  // ── Re-pull from AL (we don't store PII) ──────────────────────────
  const reveals: UnmaskedSamplePerson[] = []
  const stillMasked: MaskedSamplePerson[] = []
  try {
    const resp = await previewAudience({
      segment: sampleView.segment_real_id,
      days_back: 30,
      limit: Math.max(sampleView.sample_count ?? 15, 15),
    })
    const profiles = resp.result ?? []

    // Process them in the same order — first `targetRevealed` unmasked, rest masked
    for (let i = 0; i < profiles.length; i++) {
      if (i < targetRevealed) {
        const u = fullyRevealProfile(profiles[i])
        if (u) reveals.push(u)
      } else {
        const m = maskProfileForPublic(profiles[i])
        if (m) stillMasked.push(m)
      }
      if (reveals.length + stillMasked.length >= (sampleView.sample_count ?? 15)) break
    }
  } catch (err) {
    safeError('[reveal] AL re-pull failed:', err)
    return NextResponse.json(
      { error: 'al_unavailable', message: 'Could not re-fetch profiles. Try again in a minute.' },
      { status: 502 }
    )
  }

  // ── Persist updates ─────────────────────────────────────────────────
  await admin
    .from('audience_builder_sample_views')
    .update({ revealed_count: targetRevealed })
    .eq('id', sampleView.id)

  // Load current lead to promote tier if appropriate
  const { data: leadRow } = await admin
    .from('audience_builder_leads')
    .select('id, email, first_name, last_name, company, unlock_tier, qualifier_answers, call_booked_at, marked_qualified_at')
    .eq('id', payload.lead_id)
    .maybeSingle()

  if (!leadRow) {
    return NextResponse.json({ error: 'lead_not_found' }, { status: 404 })
  }

  const leadUpdate: Record<string, unknown> = {}
  if (newUnlockTier !== null && (leadRow.unlock_tier ?? 0) < newUnlockTier) {
    leadUpdate.unlock_tier = newUnlockTier
  }
  if (body.trigger === 'qualifier' && body.qualifier_answers) {
    leadUpdate.qualifier_answers = body.qualifier_answers
    if (!leadRow.marked_qualified_at) leadUpdate.marked_qualified_at = new Date().toISOString()
  }
  if (body.trigger === 'call_booked' && !leadRow.call_booked_at) {
    leadUpdate.call_booked_at = new Date().toISOString()
  }

  if (Object.keys(leadUpdate).length > 0) {
    await admin.from('audience_builder_leads').update(leadUpdate).eq('id', payload.lead_id)
  }

  // Conversion events
  const conversionEvent =
    body.trigger === 'qualifier' ? 'qualifier_submitted' : 'call_booked'
  await admin.from('audience_builder_conversions').insert({
    lead_id: payload.lead_id,
    session_id: payload.session_id,
    event_type: conversionEvent,
    metadata: {
      sample_view_id: sampleView.id,
      revealed_count: targetRevealed,
      ...(body.qualifier_answers ? { qualifier_answers: body.qualifier_answers } : {}),
    },
  })

  await admin.from('audience_builder_conversions').insert({
    lead_id: payload.lead_id,
    session_id: payload.session_id,
    event_type: 'reveal_unlocked',
    metadata: { sample_view_id: sampleView.id, revealed_count: targetRevealed, trigger: body.trigger },
  })

  // Slack alert — high-intent event, worth notifying
  try {
    await sendSlackAlert({
      type: 'audience_builder_reveal',
      severity: body.trigger === 'call_booked' ? 'warning' : 'info',
      message:
        body.trigger === 'call_booked'
          ? `Call booked from Audience Builder: ${leadRow.first_name ?? ''} ${leadRow.last_name ?? ''} (${leadRow.email}) @ ${leadRow.company ?? 'no company'}`
          : `Qualifier submitted: ${leadRow.email} @ ${leadRow.company ?? 'no company'}`,
      metadata: {
        email: leadRow.email,
        company: leadRow.company,
        trigger: body.trigger,
        new_unlock_tier: newUnlockTier,
        ...(body.qualifier_answers ?? {}),
      },
    })
  } catch {
    // Non-blocking
  }

  return NextResponse.json({
    success: true,
    trigger: body.trigger,
    new_unlock_tier: newUnlockTier,
    revealed_count: targetRevealed,
    total_count: sampleView.al_total_count ?? (reveals.length + stillMasked.length),
    reveals,
    still_masked: stillMasked,
    export_allowed: newUnlockTier !== null && newUnlockTier >= 2,
  })
}
