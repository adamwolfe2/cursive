/**
 * Outbound Chat Repository
 *
 * CRUD for `outbound_chat_messages`. Backs the `/api/outbound/chat/*` routes
 * and the right-side ChatPanel drawer on the workflow detail page.
 *
 * Migration: supabase/migrations/20260408000000_outbound_agent_v1.sql
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DatabaseError } from '@/types'
import type {
  OutboundChatMessage,
  OutboundChatRole,
  OutboundChatContextRef,
  OutboundChatThread,
} from '@/types/outbound'

export interface CreateChatMessageParams {
  workspaceId: string
  userId: string
  agentId: string | null
  threadId: string
  role: OutboundChatRole
  content: string
  contextRefs?: OutboundChatContextRef[]
  tokenCount?: number | null
}

export class OutboundChatRepository {
  /**
   * Insert a new chat message.
   * Uses admin client because the SSE chat route writes both user + assistant
   * messages and we don't want RLS surprises mid-stream.
   */
  async create(params: CreateChatMessageParams): Promise<OutboundChatMessage> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('outbound_chat_messages')
      .insert({
        workspace_id: params.workspaceId,
        user_id: params.userId,
        agent_id: params.agentId,
        thread_id: params.threadId,
        role: params.role,
        content: params.content,
        context_refs: params.contextRefs ?? [],
        token_count: params.tokenCount ?? null,
      })
      .select('*')
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    return data as OutboundChatMessage
  }

  /**
   * Last N messages for a thread, oldest first (chronological for prompt building).
   */
  async getThreadHistory(
    threadId: string,
    workspaceId: string,
    limit = 20
  ): Promise<OutboundChatMessage[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outbound_chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new DatabaseError(error.message)
    return ((data ?? []) as OutboundChatMessage[]).reverse()
  }

  /**
   * List a user's recent threads (for the "previous chats" dropdown in ChatPanel).
   * Aggregates by thread_id, returning newest first.
   */
  async listThreads(
    userId: string,
    workspaceId: string,
    agentId: string | null,
    limit = 20
  ): Promise<OutboundChatThread[]> {
    const supabase = await createClient()

    let query = supabase
      .from('outbound_chat_messages')
      .select('thread_id, agent_id, role, content, created_at')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data, error } = await query
    if (error) throw new DatabaseError(error.message)

    // Group by thread_id, keeping the newest message + first user message preview
    const map = new Map<string, OutboundChatThread>()
    for (const m of (data ?? []) as Array<Pick<OutboundChatMessage, 'thread_id' | 'agent_id' | 'role' | 'content' | 'created_at'>>) {
      const existing = map.get(m.thread_id)
      if (!existing) {
        map.set(m.thread_id, {
          thread_id: m.thread_id,
          agent_id: m.agent_id,
          message_count: 1,
          last_message_at: m.created_at,
          preview: m.content.slice(0, 120),
        })
      } else {
        existing.message_count += 1
        if (m.role === 'user' && m.content.length > 0) {
          // Prefer earliest user message as the preview
          existing.preview = m.content.slice(0, 120)
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
      .slice(0, limit)
  }

  /**
   * Delete a thread (and all messages in it). User-scoped via RLS.
   */
  async deleteThread(threadId: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('outbound_chat_messages')
      .delete()
      .eq('thread_id', threadId)
      .eq('workspace_id', workspaceId)

    if (error) throw new DatabaseError(error.message)
  }
}

export const outboundChatRepository = new OutboundChatRepository()
