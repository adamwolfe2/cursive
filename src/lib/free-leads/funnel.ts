/**
 * Funnel recording for /start: one session row per anonymous visitor (first paste onward) and
 * one event per step. Analytics never break the flow: failures are logged and swallowed here,
 * on purpose, because every caller is mid-request for the user.
 *
 * Service role: free_lead_sessions/free_lead_events are server-only (RLS on, no policies).
 * The session id is client-generated (random uuid); it links steps, it grants nothing.
 */
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { IcpSchema, SESSION_HEADER, SessionIdSchema, type Attribution, type FunnelStep, type Icp } from './contract'

type Admin = ReturnType<typeof createAdminClient>

export function sessionIdFrom(req: NextRequest): string | null {
  const parsed = SessionIdSchema.safeParse(req.headers.get(SESSION_HEADER)?.trim())
  return parsed.success ? parsed.data : null
}

export interface SessionPatch {
  website?: string
  domain?: string
  icp?: Icp
  total?: number
  email?: string
  claim_id?: string
  ip_hash?: string
}

export interface StepOptions {
  meta?: Record<string, unknown>
  patch?: SessionPatch
  /** First-touch attribution; only written when the session row is created. */
  attribution?: Attribution
  admin?: Admin
}

export async function recordStep(sessionId: string | null, step: FunnelStep, opts: StepOptions = {}): Promise<void> {
  if (!sessionId) return
  try {
    const admin = opts.admin ?? createAdminClient()
    const now = new Date().toISOString()
    const created = await admin
      .from('free_lead_sessions')
      .upsert({ id: sessionId, attribution: opts.attribution ?? {}, ip_hash: opts.patch?.ip_hash ?? null }, { onConflict: 'id', ignoreDuplicates: true })
    if (created.error) throw new Error(`session insert: ${created.error.message}`)
    const updated = await admin
      .from('free_lead_sessions')
      .update({ ...opts.patch, updated_at: now, last_step: step })
      .eq('id', sessionId)
    if (updated.error) throw new Error(`session update: ${updated.error.message}`)
    const event = await admin.from('free_lead_events').insert({ session_id: sessionId, step, meta: opts.meta ?? {} })
    if (event.error) throw new Error(`event insert: ${event.error.message}`)
  } catch (err) {
    safeError('[free-leads/funnel] step not recorded', { step, err: String(err) })
  }
}

/** The ICP our own scan stored for this session (null when none, unreadable, or not from a site). */
export async function sessionIcp(sessionId: string, admin: Admin = createAdminClient()): Promise<{ icp: Icp; domain: string } | null> {
  const { data, error } = await admin.from('free_lead_sessions').select('icp, domain').eq('id', sessionId).maybeSingle()
  if (error) {
    safeError('[free-leads/funnel] session read failed', error.message)
    return null
  }
  const row = data as { icp: unknown; domain: string | null } | null
  const icp = IcpSchema.safeParse(row?.icp)
  return icp.success && row?.domain ? { icp: icp.data, domain: row.domain } : null
}
