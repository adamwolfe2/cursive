/**
 * POST /api/public/copilot/chat
 * Streaming chat endpoint for the PUBLIC Audience Builder copilot.
 *
 * Auth: signed session token (Authorization: Bearer). Each token binds the
 * caller to a specific lead/session created by /api/public/copilot/start.
 *
 * Flow:
 *   1. Verify token + load session + kill-switch + per-session/per-email caps
 *   2. Stream messages from Claude (Sonnet 4.6 default) with allowlisted tools
 *   3. Sanitize any retrieved segments before streaming to the browser
 *   4. Log total usage/cost with surface='public' for separate budget tracking
 *
 * Hard caps (tighter than admin):
 *   - max_tokens per call: 768
 *   - max tool iterations: 3
 *   - conversation history: last 6 turns sent to model
 *   - per-session turns: 10
 *   - per-email turns / 24h: 30
 */

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { PUBLIC_SYSTEM_PROMPT } from '@/lib/copilot/public-prompt'
import { PUBLIC_TOOLS, runPublicTool, sanitizeText } from '@/lib/copilot/public-tools'
import type { CopilotToolName } from '@/lib/copilot/tools'
import { checkDailyBudget, logTurn, calculateCostUSD, type CopilotModel } from '@/lib/copilot/cost'
import { verifyToken } from '@/lib/copilot/public-session'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { SegmentResult, StreamEvent } from '@/lib/copilot/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_MODEL: CopilotModel = 'claude-sonnet-4-6'
const MAX_TOKENS_PER_CALL = 768
const MAX_TOOL_ITERATIONS = 3
const MAX_HISTORY_TURNS = 6
const TURN_LIMIT_PER_SESSION = 10
const TURNS_PER_DAY_LIMIT = 30

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

function ssePayload(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

function extractBearer(req: NextRequest): string | null {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1] ?? null
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()

  // ── Auth ─────────────────────────────────────────────────────────
  const token = extractBearer(req)
  if (!token) return new Response('Unauthorized', { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return new Response('Invalid or expired token', { status: 401 })

  // ── Kill-switch (separate public budget) ─────────────────────────
  const budget = await checkDailyBudget('public')
  if (!budget.allowed) {
    return Response.json(
      {
        error: 'daily_budget_exceeded',
        spent_today: budget.spent_today,
        cap: budget.cap,
        message: `Daily copilot budget ($${budget.cap}) reached. Resets at 00:00 UTC.`,
      },
      { status: 429 }
    )
  }

  // ── Parse body ───────────────────────────────────────────────────
  let body: ChatRequestBody
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const history = (body.messages ?? [])
    .filter((m) => m.content && (m.role === 'user' || m.role === 'assistant'))
    .slice(-MAX_HISTORY_TURNS)
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return new Response('Last message must be from user', { status: 400 })
  }

  // ── Load session + per-session/per-email limits ──────────────────
  const admin = createAdminClient()

  const { data: sessionRow, error: sessionErr } = await admin
    .from('audience_builder_sessions')
    .select('id, lead_id, email, turn_count, closed_at')
    .eq('id', payload.session_id)
    .maybeSingle()
  if (sessionErr) {
    safeError('[copilot/public/chat] session load error:', sessionErr)
    return new Response('Internal error', { status: 500 })
  }
  if (!sessionRow) return new Response('Session not found', { status: 404 })
  if (sessionRow.closed_at) return new Response('Session closed', { status: 403 })

  const currentTurnCount = sessionRow.turn_count ?? 0
  if (currentTurnCount >= TURN_LIMIT_PER_SESSION) {
    return Response.json(
      {
        error: 'session_turn_limit',
        message: 'Session limit reached. Book a call to continue exploring audiences.',
      },
      { status: 429 }
    )
  }

  // Per-email daily turn cap
  const { data: rateData, error: rateErr } = await admin.rpc(
    'audience_builder_rate_check',
    { email_filter: payload.email, ip_hash_filter: null }
  )
  if (rateErr) {
    safeError('[copilot/public/chat] rate check error:', rateErr)
  }
  const rateRow = Array.isArray(rateData) ? rateData[0] : rateData
  const turnsTodayBefore = Number(rateRow?.turns_today ?? 0)
  if (turnsTodayBefore >= TURNS_PER_DAY_LIMIT) {
    return Response.json(
      {
        error: 'daily_turn_limit',
        message: 'Daily message limit reached. Book a call to continue.',
      },
      { status: 429 }
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY not configured', { status: 500 })
  }
  const anthropic = new Anthropic({ apiKey })

  // ── Stream ───────────────────────────────────────────────────────
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (evt: StreamEvent) => controller.enqueue(encoder.encode(ssePayload(evt)))

      // Running totals across tool-use iterations
      let totalInput = 0
      let totalOutput = 0
      let totalCacheCreate = 0
      let totalCacheRead = 0
      const totalThinking = 0
      let totalToolCalls = 0
      let totalSegments = 0

      const messages: Anthropic.MessageParam[] = history.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      try {
        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          const streamParams: Anthropic.MessageStreamParams = {
            model: DEFAULT_MODEL,
            max_tokens: MAX_TOKENS_PER_CALL,
            system: [
              {
                type: 'text',
                text: PUBLIC_SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' },
              },
            ],
            messages,
            tools: PUBLIC_TOOLS.map((t) => ({
              name: t.name,
              description: t.description,
              input_schema: t.input_schema as Anthropic.Tool.InputSchema,
            })),
          }

          const modelStream = anthropic.messages.stream(streamParams)

          // Stream text deltas to the client as they arrive.
          // (No thinking on public surface — we strip that from input.)
          for await (const event of modelStream) {
            if (event.type === 'content_block_delta') {
              const d = event.delta
              if (d.type === 'text_delta') {
                send({ type: 'text', delta: sanitizeText(d.text) })
              }
            }
          }

          const final = await modelStream.finalMessage()

          totalInput += final.usage.input_tokens ?? 0
          totalOutput += final.usage.output_tokens ?? 0
          totalCacheCreate += final.usage.cache_creation_input_tokens ?? 0
          totalCacheRead += final.usage.cache_read_input_tokens ?? 0

          if (final.stop_reason !== 'tool_use') {
            break
          }

          messages.push({ role: 'assistant', content: final.content })

          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of final.content) {
            if (block.type !== 'tool_use') continue
            totalToolCalls++
            send({ type: 'tool_use', id: block.id, name: block.name, input: block.input })

            const toolName = block.name as CopilotToolName
            let resultSummary = ''
            let resultSegments: SegmentResult[] | undefined

            try {
              const result = await runPublicTool(
                toolName,
                (block.input ?? {}) as Record<string, unknown>
              )
              // runPublicTool already sanitizes segment_ids
              resultSummary = sanitizeText(result.summary)
              resultSegments = result.segments
            } catch (err) {
              resultSummary = `Tool error: ${err instanceof Error ? err.message : 'unknown'}`
              safeError('[copilot/public/chat] tool error:', err)
            }

            if (resultSegments && resultSegments.length > 0) {
              totalSegments += resultSegments.length
              send({ type: 'segments', segments: resultSegments })
            }
            send({ type: 'tool_result', tool_use_id: block.id, summary: resultSummary })

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: resultSummary,
            })
          }

          messages.push({ role: 'user', content: toolResults })
        }

        const cost = calculateCostUSD(DEFAULT_MODEL, {
          input_tokens: totalInput,
          output_tokens: totalOutput,
          cache_creation_tokens: totalCacheCreate,
          cache_read_tokens: totalCacheRead,
          thinking_tokens: totalThinking,
        })

        // ── Increment counters + log usage (non-blocking for the client) ──
        const newTurnCount = currentTurnCount + 1

        const { error: sessUpdErr } = await admin
          .from('audience_builder_sessions')
          .update({
            turn_count: newTurnCount,
            last_turn_at: new Date().toISOString(),
          })
          .eq('id', payload.session_id)
        if (sessUpdErr) safeError('[copilot/public/chat] session update error:', sessUpdErr)

        const { data: leadRow, error: leadLoadErr } = await admin
          .from('audience_builder_leads')
          .select('total_turns')
          .eq('id', payload.lead_id)
          .maybeSingle()
        if (leadLoadErr) safeError('[copilot/public/chat] lead load error:', leadLoadErr)

        const { error: leadUpdErr } = await admin
          .from('audience_builder_leads')
          .update({
            total_turns: (leadRow?.total_turns ?? 0) + 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', payload.lead_id)
        if (leadUpdErr) safeError('[copilot/public/chat] lead update error:', leadUpdErr)

        await logTurn({
          session_id: payload.session_id,
          user_id: null,
          workspace_id: null,
          model: DEFAULT_MODEL,
          surface: 'public',
          usage: {
            input_tokens: totalInput,
            output_tokens: totalOutput,
            cache_creation_tokens: totalCacheCreate,
            cache_read_tokens: totalCacheRead,
            thinking_tokens: totalThinking,
          },
          tool_calls: totalToolCalls,
          segments_retrieved: totalSegments,
          latency_ms: Date.now() - startedAt,
        })

        const turnsRemainingSession = Math.max(0, TURN_LIMIT_PER_SESSION - newTurnCount)
        const turnsRemainingDay = Math.max(0, TURNS_PER_DAY_LIMIT - (turnsTodayBefore + 1))

        send({
          type: 'done',
          usage: {
            input_tokens: totalInput,
            output_tokens: totalOutput,
            cache_creation_tokens: totalCacheCreate,
            cache_read_tokens: totalCacheRead,
            thinking_tokens: totalThinking,
            cost_usd: cost,
          },
          // Extra fields the UI uses — typed as any via the StreamEvent union extension
          // (the done event carries the core `usage` shape; UI pulls these from the raw JSON).
          ...({ turns_remaining_session: turnsRemainingSession, turns_remaining_day: turnsRemainingDay } as Record<string, number>),
        } as StreamEvent)
      } catch (err) {
        safeError('[copilot/public/chat] stream error:', err)
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
