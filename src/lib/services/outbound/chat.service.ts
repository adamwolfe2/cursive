/**
 * Outbound Chat Service
 * ---------------------
 * Streams a Claude response over SSE for the right-side ChatPanel drawer.
 *
 * Features:
 *   - Loads agent (icp/persona/product/tone) and builds the system prompt
 *   - Resolves @-mention context refs to compact summaries (≤200 tok each)
 *   - If a saved_prompt_id is provided, prepends the template
 *   - Loads up to 10 prior thread messages (truncated to ~4K tokens)
 *   - Streams via Anthropic messages.stream()
 *   - Persists user + assistant messages on completion
 *
 * Used by: POST /api/outbound/chat
 */

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { OutboundChatRepository } from '@/lib/repositories/outbound-chat.repository'
import { OutboundSavedPromptRepository } from '@/lib/repositories/outbound-saved-prompt.repository'
import type { OutboundChatContextRef, OutboundChatMessage } from '@/types/outbound'

const chatRepo = new OutboundChatRepository()
const promptRepo = new OutboundSavedPromptRepository()

let cachedClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
    cachedClient = new Anthropic({ apiKey })
  }
  return cachedClient
}

export interface StreamChatParams {
  workspaceId: string
  userId: string
  agentId: string | null
  threadId: string
  message: string
  contextRefs?: OutboundChatContextRef[]
  savedPromptId?: string
}

export interface ChatStreamChunk {
  delta?: string
  done?: boolean
  error?: string
}

/**
 * Returns an async iterator of SSE chunks. The route handler converts each
 * chunk to a `data: …\n\n` line and writes to the response stream.
 *
 * Persists the user message immediately, the assistant message at the end.
 */
export async function* streamChatResponse(
  params: StreamChatParams
): AsyncGenerator<ChatStreamChunk> {
  const supabase = createAdminClient()

  // 1. Load agent (if any)
  let agent: any = null
  if (params.agentId) {
    const { data } = await supabase
      .from('agents')
      .select('id, name, tone, icp_text, persona_text, product_text')
      .eq('id', params.agentId)
      .eq('workspace_id', params.workspaceId)
      .maybeSingle()
    agent = data
  }

  // 2. Resolve saved prompt (if any)
  let promptPrefix: string | null = null
  if (params.savedPromptId) {
    const sp = await promptRepo.findById(params.savedPromptId, params.workspaceId)
    if (sp) promptPrefix = sp.prompt_template
  }

  // 3. Resolve @mention context refs into compact summaries
  const contextSummaries = await resolveContextRefs(params.contextRefs ?? [], params.workspaceId)

  // 4. Load thread history (last 20 messages, oldest first)
  const history = await chatRepo.getThreadHistory(params.threadId, params.workspaceId, 20)

  // 5. Persist the user message
  await chatRepo.create({
    workspaceId: params.workspaceId,
    userId: params.userId,
    agentId: params.agentId,
    threadId: params.threadId,
    role: 'user',
    content: promptPrefix ? `${promptPrefix}\n\n${params.message}` : params.message,
    contextRefs: params.contextRefs ?? [],
  })

  // 6. Build messages array for Claude
  const systemPrompt = buildSystemPrompt(agent, contextSummaries)
  const claudeMessages = buildClaudeMessages(history, params.message, promptPrefix)

  // 7. Stream the response
  const client = getClient()
  let assembled = ''

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: systemPrompt,
      messages: claudeMessages,
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const delta = event.delta.text
        assembled += delta
        yield { delta }
      }
    }

    // 8. Persist the assembled assistant message
    await chatRepo.create({
      workspaceId: params.workspaceId,
      userId: params.userId,
      agentId: params.agentId,
      threadId: params.threadId,
      role: 'assistant',
      content: assembled,
    })

    yield { done: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Best-effort persist whatever we managed to assemble
    if (assembled.length > 0) {
      await chatRepo
        .create({
          workspaceId: params.workspaceId,
          userId: params.userId,
          agentId: params.agentId,
          threadId: params.threadId,
          role: 'assistant',
          content: assembled + '\n\n[stream interrupted]',
        })
        .catch(() => undefined)
    }
    yield { error: message }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function buildSystemPrompt(agent: any | null, contextSummaries: string[]): string {
  const parts: string[] = []

  if (agent) {
    parts.push(`You are ${agent.name}, an AI revenue agent for an outbound sales workflow.`)
    if (agent.icp_text) parts.push(`ICP: ${agent.icp_text}`)
    if (agent.persona_text) parts.push(`Buyer persona: ${agent.persona_text}`)
    if (agent.product_text) parts.push(`What we sell: ${agent.product_text}`)
    if (agent.tone) parts.push(`Tone: ${agent.tone}`)
  } else {
    parts.push('You are an AI revenue assistant for an outbound sales workflow.')
  }

  if (contextSummaries.length > 0) {
    parts.push('\nReference data:')
    parts.push(...contextSummaries)
  }

  parts.push(
    '\nWhen the user asks for help, be concrete and actionable. Reference specific contacts, companies, or numbers when possible. Be concise — no preamble or unnecessary explanations.'
  )

  return parts.join('\n')
}

function buildClaudeMessages(
  history: OutboundChatMessage[],
  newUserMessage: string,
  promptPrefix: string | null
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = []

  // Truncate history to fit a rough budget — drop oldest until <= 4K tokens (≈16K chars)
  let charBudget = 16_000
  const trimmedHistory: OutboundChatMessage[] = []
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    if (msg.role === 'system') continue
    if (charBudget - msg.content.length < 0) break
    trimmedHistory.unshift(msg)
    charBudget -= msg.content.length
  }

  for (const msg of trimmedHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      out.push({ role: msg.role, content: msg.content })
    }
  }

  out.push({
    role: 'user',
    content: promptPrefix ? `${promptPrefix}\n\n${newUserMessage}` : newUserMessage,
  })

  return out
}

async function resolveContextRefs(
  refs: OutboundChatContextRef[],
  workspaceId: string
): Promise<string[]> {
  if (refs.length === 0) return []
  const supabase = createAdminClient()
  const summaries: string[] = []

  for (const ref of refs) {
    if (ref.type === 'lead') {
      const { data } = await supabase
        .from('leads')
        .select('first_name, last_name, full_name, email, job_title, company_name, company_industry')
        .eq('id', ref.id)
        .eq('workspace_id', workspaceId)
        .maybeSingle()
      if (data) {
        const name = data.full_name || `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || data.email
        summaries.push(
          `[Lead] ${name}, ${data.job_title ?? 'Unknown title'} at ${data.company_name ?? 'Unknown company'}${data.company_industry ? ` (${data.company_industry})` : ''}.`
        )
      }
    } else if (ref.type === 'company') {
      // No `companies` table in core schema — derive from leads
      const { data } = await supabase
        .from('leads')
        .select('company_name, company_industry, company_size, company_domain')
        .eq('workspace_id', workspaceId)
        .eq('company_name', ref.id)
        .limit(1)
        .maybeSingle()
      if (data) {
        summaries.push(
          `[Company] ${data.company_name} (${data.company_industry ?? 'unknown industry'}, ${data.company_size ?? '?'} employees, ${data.company_domain ?? '?'}).`
        )
      }
    } else if (ref.type === 'workflow') {
      const { data: agent } = await supabase
        .from('agents')
        .select('name, icp_text, persona_text, product_text, outbound_last_run_at')
        .eq('id', ref.id)
        .eq('workspace_id', workspaceId)
        .maybeSingle()
      if (agent) {
        summaries.push(
          `[Workflow] ${agent.name} — ICP: ${(agent as any).icp_text ?? 'n/a'}. Last run: ${(agent as any).outbound_last_run_at ?? 'never'}.`
        )
      }
    }

    // Cap summaries to 200 tokens each (≈800 chars). Trim if exceeded.
    if (summaries.length > 0) {
      const last = summaries[summaries.length - 1]
      if (last.length > 800) summaries[summaries.length - 1] = last.slice(0, 797) + '...'
    }
  }

  return summaries
}
