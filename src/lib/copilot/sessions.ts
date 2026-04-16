/**
 * Server-side repo for copilot chat history.
 * All writes go through the service-role admin client (bypasses RLS);
 * reads are gated in API routes by verifying user ownership.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { SegmentResult } from './types'

export interface CopilotSessionRow {
  id: string
  user_id: string
  surface: string
  title: string
  message_count: number
  created_at: string
  last_message_at: string
}

export interface CopilotMessageRow {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  segments: SegmentResult[] | null
  tool_calls: Array<{ id: string; name: string; input: unknown; summary?: string }> | null
  created_at: string
}

const TITLE_MAX_CHARS = 64

function makeTitle(firstUserMessage: string): string {
  const trimmed = firstUserMessage.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= TITLE_MAX_CHARS) return trimmed || 'New chat'
  return trimmed.slice(0, TITLE_MAX_CHARS - 1).trimEnd() + '…'
}

/**
 * Create the session row if it doesn't exist, or return the existing one.
 * Returns the canonical session_id to use for subsequent writes.
 */
export async function ensureSession(params: {
  session_id: string
  user_id: string
  first_user_message: string
  surface?: 'admin' | 'public'
}): Promise<string> {
  const admin = createAdminClient()
  const { data: existing, error: fetchErr } = await admin
    .from('copilot_sessions')
    .select('id')
    .eq('id', params.session_id)
    .maybeSingle()
  if (fetchErr) {
    console.error('[copilot/sessions] ensureSession fetch error:', fetchErr)
  }
  if (existing?.id) return existing.id

  const { data, error } = await admin
    .from('copilot_sessions')
    .insert({
      id: params.session_id,
      user_id: params.user_id,
      surface: params.surface ?? 'admin',
      title: makeTitle(params.first_user_message),
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('[copilot/sessions] ensureSession insert error:', error)
    return params.session_id
  }
  return data.id
}

interface PersistTurnParams {
  session_id: string
  user_message: string
  assistant_text: string
  segments?: SegmentResult[]
  tool_calls?: Array<{ id: string; name: string; input: unknown; summary?: string }>
}

export async function persistTurn(params: PersistTurnParams): Promise<void> {
  const admin = createAdminClient()

  const rows = [
    {
      session_id: params.session_id,
      role: 'user' as const,
      content: params.user_message,
      segments: null,
      tool_calls: null,
    },
    {
      session_id: params.session_id,
      role: 'assistant' as const,
      content: params.assistant_text,
      segments: params.segments && params.segments.length > 0 ? params.segments : null,
      tool_calls: params.tool_calls && params.tool_calls.length > 0 ? params.tool_calls : null,
    },
  ]

  const { error: msgErr } = await admin.from('copilot_messages').insert(rows)
  if (msgErr) {
    console.error('[copilot/sessions] persistTurn insert error:', msgErr)
    return
  }

  const { error: updErr } = await admin
    .from('copilot_sessions')
    .update({
      last_message_at: new Date().toISOString(),
      message_count: (await getMessageCount(params.session_id)) ?? 0,
    })
    .eq('id', params.session_id)
  if (updErr) console.error('[copilot/sessions] persistTurn update error:', updErr)
}

async function getMessageCount(session_id: string): Promise<number | null> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('copilot_messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session_id)
  if (error) return null
  return count ?? 0
}

export async function listSessions(user_id: string, limit = 50): Promise<CopilotSessionRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('copilot_sessions')
    .select('id, user_id, surface, title, message_count, created_at, last_message_at')
    .eq('user_id', user_id)
    .order('last_message_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[copilot/sessions] listSessions error:', error)
    return []
  }
  return (data ?? []) as CopilotSessionRow[]
}

export async function loadSession(
  session_id: string,
  user_id: string
): Promise<{ session: CopilotSessionRow; messages: CopilotMessageRow[] } | null> {
  const admin = createAdminClient()
  const { data: session, error: sessErr } = await admin
    .from('copilot_sessions')
    .select('id, user_id, surface, title, message_count, created_at, last_message_at')
    .eq('id', session_id)
    .eq('user_id', user_id)
    .maybeSingle()
  if (sessErr || !session) return null

  const { data: messages, error: msgErr } = await admin
    .from('copilot_messages')
    .select('id, session_id, role, content, segments, tool_calls, created_at')
    .eq('session_id', session_id)
    .order('created_at', { ascending: true })
  if (msgErr) {
    console.error('[copilot/sessions] loadSession messages error:', msgErr)
    return { session: session as CopilotSessionRow, messages: [] }
  }

  return {
    session: session as CopilotSessionRow,
    messages: (messages ?? []) as CopilotMessageRow[],
  }
}

export async function deleteSession(session_id: string, user_id: string): Promise<boolean> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('copilot_sessions')
    .delete()
    .eq('id', session_id)
    .eq('user_id', user_id)
  if (error) {
    console.error('[copilot/sessions] deleteSession error:', error)
    return false
  }
  return true
}
