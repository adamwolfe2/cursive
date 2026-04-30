/**
 * POST /api/public/copilot/start
 *
 * Captures a visitor's email (+ optional profile/UTM), creates-or-upserts
 * a lead row, opens a new session, and returns a short-lived HMAC-signed
 * token the browser presents on subsequent chat/session calls.
 *
 * Rate limits (defense in depth, on top of the RLS INSERT check):
 *   - Per-IP: max 5 sessions / 24h (blocks basic abuse)
 *   - Per-email: max 3 sessions / 24h (steers repeat users to book a call)
 *
 * On the first-ever session for an email we fire a Slack alert + a welcome
 * email. Both are non-blocking — a send failure never blocks session start.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { sendEmail, createEmailTemplate } from '@/lib/email/resend-client'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { hashIp, signToken } from '@/lib/copilot/public-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_IP_SESSIONS_PER_DAY = 5
const MAX_EMAIL_SESSIONS_PER_DAY = 3
const BOOK_URL = 'https://cal.com/meetcursive/intro'

const StartBodySchema = z.object({
  email: z.string().email().max(320),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  username: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  use_case: z.string().max(2000).optional(),
  source: z.string().max(100).optional().default('audience-builder'),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  preview_id: z.string().uuid().optional(),
})

function getIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? ''
}

export async function POST(req: NextRequest) {
  // ── Parse + validate body ────────────────────────────────────────
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = StartBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const body = parsed.data
  const email = body.email.toLowerCase().trim()

  // ── Request metadata ─────────────────────────────────────────────
  const ip = getIp(req)
  const ipHash = ip ? hashIp(ip) : null
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null
  const referrer = req.headers.get('referer')?.slice(0, 500) ?? null

  try {
    const admin = createAdminClient()

    // ── Per-IP rate limit ────────────────────────────────────────────
    if (ipHash) {
      const { data: ipCheck, error: ipErr } = await admin.rpc(
        'audience_builder_rate_check',
        { email_filter: email, ip_hash_filter: ipHash }
      )
      if (ipErr) {
        safeError('[copilot/public/start] rate check error:', ipErr)
      } else {
        const row = Array.isArray(ipCheck) ? ipCheck[0] : ipCheck
        const ipSessionsToday = Number(row?.ip_sessions_today ?? 0)
        if (ipSessionsToday >= MAX_IP_SESSIONS_PER_DAY) {
          return NextResponse.json(
            {
              error: 'rate_limited',
              message: `Too many sessions from this network today. Book a call at ${BOOK_URL} to activate your audience.`,
            },
            { status: 429 }
          )
        }
      }
    }

    // ── Upsert lead ──────────────────────────────────────────────────
    // First: look up existing lead so we know whether this is a fresh signup
    // (drives Slack alert + welcome email below).
    const { data: existingLead, error: lookupErr } = await admin
      .from('audience_builder_leads')
      .select('id, notified_at, total_sessions, first_seen_at')
      .eq('email', email)
      .maybeSingle()
    if (lookupErr) {
      safeError('[copilot/public/start] lead lookup error:', lookupErr)
    }

    const isFirstEver = !existingLead

    let leadId: string
    if (existingLead) {
      const { data: updated, error: updErr } = await admin
        .from('audience_builder_leads')
        .update({
          total_sessions: (existingLead.total_sessions ?? 0) + 1,
          last_seen_at: new Date().toISOString(),
          ...(body.first_name ? { first_name: body.first_name } : {}),
          ...(body.last_name ? { last_name: body.last_name } : {}),
          ...(body.username ? { username: body.username } : {}),
          ...(body.company ? { company: body.company } : {}),
          ...(body.use_case ? { use_case: body.use_case } : {}),
        })
        .eq('id', existingLead.id)
        .select('id')
        .single()
      if (updErr || !updated) {
        safeError('[copilot/public/start] lead update error:', updErr)
        return NextResponse.json({ error: 'lead_update_failed' }, { status: 500 })
      }
      leadId = updated.id
    } else {
      const { data: inserted, error: insErr } = await admin
        .from('audience_builder_leads')
        .insert({
          email,
          first_name: body.first_name ?? null,
          last_name: body.last_name ?? null,
          username: body.username ?? null,
          company: body.company ?? null,
          use_case: body.use_case ?? null,
          source: body.source,
          utm_source: body.utm_source ?? null,
          utm_medium: body.utm_medium ?? null,
          utm_campaign: body.utm_campaign ?? null,
          utm_content: body.utm_content ?? null,
          utm_term: body.utm_term ?? null,
          ip_hash: ipHash,
          user_agent: userAgent,
          referrer,
          total_sessions: 0,
          total_turns: 0,
        })
        .select('id')
        .single()
      if (insErr || !inserted) {
        safeError('[copilot/public/start] lead insert error:', insErr)
        return NextResponse.json({ error: 'lead_insert_failed' }, { status: 500 })
      }
      leadId = inserted.id

      // Bump total_sessions to 1 for the just-inserted row so counts stay in sync
      const { error: bumpErr } = await admin
        .from('audience_builder_leads')
        .update({ total_sessions: 1 })
        .eq('id', leadId)
      if (bumpErr) safeError('[copilot/public/start] lead bump error:', bumpErr)
    }

    // ── Per-email rate limit ─────────────────────────────────────────
    const { data: emailCheck, error: emailErr } = await admin.rpc(
      'audience_builder_rate_check',
      { email_filter: email, ip_hash_filter: null }
    )
    if (emailErr) {
      safeError('[copilot/public/start] email rate check error:', emailErr)
    } else {
      const row = Array.isArray(emailCheck) ? emailCheck[0] : emailCheck
      const sessionsToday = Number(row?.sessions_today ?? 0)
      if (sessionsToday >= MAX_EMAIL_SESSIONS_PER_DAY) {
        return NextResponse.json(
          {
            error: 'rate_limited',
            message: `Daily session limit reached — book a call at ${BOOK_URL}.`,
          },
          { status: 429 }
        )
      }
    }

    // ── Create session ───────────────────────────────────────────────
    const { data: session, error: sessErr } = await admin
      .from('audience_builder_sessions')
      .insert({
        lead_id: leadId,
        email,
        turn_count: 0,
      })
      .select('id')
      .single()
    if (sessErr || !session) {
      safeError('[copilot/public/start] session insert error:', sessErr)
      return NextResponse.json({ error: 'session_insert_failed' }, { status: 500 })
    }

    // ── Sign token ───────────────────────────────────────────────────
    let token: string
    try {
      token = signToken({ lead_id: leadId, email, session_id: session.id })
    } catch (err) {
      safeError('[copilot/public/start] token sign error:', err)
      return NextResponse.json({ error: 'token_config_missing' }, { status: 500 })
    }

    // ── Fire-and-forget notifications on first-ever signup ────────────
    if (isFirstEver) {
      // Mark notified_at so we don't re-alert if the row is ever reset
      void admin
        .from('audience_builder_leads')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', leadId)
        .then(({ error }) => {
          if (error) safeError('[copilot/public/start] notified_at update error:', error)
        })

      void sendSlackAlert({
        type: 'audience_builder_new_lead',
        severity: 'info',
        message: `New Audience Builder lead: ${email}`,
        metadata: {
          email,
          first_name: body.first_name ?? '',
          company: body.company ?? '',
          use_case: (body.use_case ?? '').slice(0, 300),
          source: body.source ?? '',
          utm_source: body.utm_source ?? '',
          utm_campaign: body.utm_campaign ?? '',
          referrer: referrer ?? '',
        },
      }).catch((err) => safeError('[copilot/public/start] slack alert failed:', err))

      const internalTo = process.env.ADMIN_ALERT_EMAIL
      if (internalTo) {
        void sendEmail({
          to: internalTo,
          subject: `Audience Builder lead: ${email}`,
          html: createEmailTemplate({
            preheader: 'New visitor started an Audience Builder session',
            title: 'New Audience Builder lead',
            content: `
              <p class="email-text">A new visitor just started a session.</p>
              <p class="email-text"><strong>Email:</strong> ${email}</p>
              ${body.first_name ? `<p class="email-text"><strong>Name:</strong> ${escapeHtml(body.first_name)}</p>` : ''}
              ${body.company ? `<p class="email-text"><strong>Company:</strong> ${escapeHtml(body.company)}</p>` : ''}
              ${body.use_case ? `<p class="email-text"><strong>Use case:</strong> ${escapeHtml(body.use_case).slice(0, 500)}</p>` : ''}
              ${body.utm_source ? `<p class="email-text"><strong>UTM source:</strong> ${escapeHtml(body.utm_source)}</p>` : ''}
            `,
          }),
        }).catch((err) => safeError('[copilot/public/start] admin email failed:', err))
      }

      // Welcome email to the lead
      void sendEmail({
        to: email,
        subject: 'Welcome to Cursive Audience Builder',
        html: createEmailTemplate({
          preheader: 'Your Audience Builder session is ready',
          title: `Welcome${body.first_name ? ', ' + escapeHtml(body.first_name) : ''}`,
          content: `
            <p class="email-text">You just opened a session with <strong>Cursive's Audience Builder</strong> — the same copilot our team uses to match ICPs to pre-built audience segments across 19,000+ options.</p>
            <p class="email-text">Describe your ideal customer in plain English and the copilot will surface the 2–3 best matches from the catalog.</p>
            <p class="email-text">When you're ready to activate the audience and see live in-market counts, book a 15-minute call:</p>
            <p><a href="${BOOK_URL}" class="email-button">Book a call</a></p>
            <p class="email-text" style="color: #71717a;">Questions? Just reply — we read every message.</p>
          `,
        }),
      }).catch((err) => safeError('[copilot/public/start] welcome email failed:', err))
    }

    // ── Attribute preview → lead conversion (if provided) ─────────────
    if (body.preview_id) {
      const { error: previewConvErr } = await admin
        .from('audience_builder_previews')
        .update({
          converted_lead_id: leadId,
          converted_at: new Date().toISOString(),
        })
        .eq('id', body.preview_id)
        .is('converted_lead_id', null)
      if (previewConvErr) {
        safeError(
          '[copilot/public/start] preview conversion update failed:',
          previewConvErr
        )
      }
    }

    safeLog('[copilot/public/start] session opened', {
      session_id: session.id,
      lead_id: leadId,
      first_ever: isFirstEver,
    })

    return NextResponse.json({ token, session_id: session.id })
  } catch (err) {
    safeError('[copilot/public/start] fatal:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
