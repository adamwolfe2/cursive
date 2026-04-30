/**
 * GET /api/public/copilot/session
 *
 * Returns the current turn/limit counters for the caller's session so
 * the UI can render a meter ("4 of 10 turns left"). Auth via signed
 * session token in the Authorization: Bearer header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyToken } from '@/lib/copilot/public-session'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TURN_LIMIT_PER_SESSION = 10
const TURNS_PER_DAY_LIMIT = 30

function extractBearer(req: NextRequest): string | null {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1] ?? null
}

export async function GET(req: NextRequest) {
  const token = extractBearer(req)
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()

    const [sessionRes, leadRes, rateRes] = await Promise.all([
      admin
        .from('audience_builder_sessions')
        .select('id, turn_count, created_at, closed_at, email')
        .eq('id', payload.session_id)
        .maybeSingle(),
      admin
        .from('audience_builder_leads')
        .select('email, first_name, company')
        .eq('id', payload.lead_id)
        .maybeSingle(),
      admin.rpc('audience_builder_rate_check', {
        email_filter: payload.email,
        ip_hash_filter: null,
      }),
    ])

    if (sessionRes.error || !sessionRes.data) {
      return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
    }
    if (leadRes.error || !leadRes.data) {
      return NextResponse.json({ error: 'lead_not_found' }, { status: 404 })
    }

    const rateRow = Array.isArray(rateRes.data) ? rateRes.data[0] : rateRes.data
    const turnsToday = Number(rateRow?.turns_today ?? 0)

    return NextResponse.json({
      session_id: sessionRes.data.id,
      turn_count: sessionRes.data.turn_count ?? 0,
      turn_limit: TURN_LIMIT_PER_SESSION,
      turns_today: turnsToday,
      turns_per_day_limit: TURNS_PER_DAY_LIMIT,
      session_created_at: sessionRes.data.created_at,
      email: leadRes.data.email,
      first_name: leadRes.data.first_name,
      company: leadRes.data.company,
    })
  } catch (err) {
    safeError('[copilot/public/session] fatal:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
