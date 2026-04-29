/**
 * POST /api/admin/copilot/chat
 * Streaming chat endpoint for the admin Audience Copilot.
 *
 * Flow:
 *   1. Admin auth + daily kill-switch check
 *   2. Stream messages from Claude (Sonnet 4.6 default)
 *   3. Agentic tool loop — up to 4 iterations
 *   4. Emit SSE events for text / thinking / tool_use / segments / done
 *   5. Log total usage + cost on completion
 *
 * Hard caps (defense in depth):
 *   - max_tokens per call: 1024
 *   - max tool iterations: 4
 *   - conversation history: last 6 turns sent to model
 */

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requirePlatformAdmin } from '@/lib/auth/admin'
import { ADMIN_SYSTEM_PROMPT } from '@/lib/copilot/system-prompt'
import { ADMIN_TOOLS, runTool, type CopilotToolName } from '@/lib/copilot/tools'
import { checkDailyBudget, logTurn, type CopilotModel } from '@/lib/copilot/cost'
import { ensureSession, persistTurn } from '@/lib/copilot/sessions'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { SegmentResult, StreamEvent } from '@/lib/copilot/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_MODEL: CopilotModel = 'claude-sonnet-4-6'
const MAX_TOKENS_PER_CALL = 1024
const MAX_TOOL_ITERATIONS = 4
const MAX_HISTORY_TURNS = 6
const THINKING_BUDGET_TOKENS = 2048

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  sessionId?: string
  extendedThinking?: boolean
}

function ssePayload(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()

  // ── Auth ─────────────────────────────────────────────────────────
  let platformAdmin: { id: string; email: string }
  try {
    platformAdmin = await requirePlatformAdmin()
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  // ── Kill-switch ──────────────────────────────────────────────────
  const budget = await checkDailyBudget('admin')
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

  const sessionId = body.sessionId || crypto.randomUUID()
  const extendedThinking = body.extendedThinking === true

  // Persist session (idempotent) + extract first user message for title
  const firstUserMessage = history[history.length - 1].content
  await ensureSession({
    session_id: sessionId,
    user_id: platformAdmin.id,
    first_user_message: firstUserMessage,
    surface: 'admin',
  })

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
      let totalThinking = 0
      let totalToolCalls = 0
      let totalSegments = 0

      // Accumulate assistant output for persistence
      let assistantText = ''
      const assistantSegments: SegmentResult[] = []
      const assistantToolCalls: Array<{
        id: string
        name: string
        input: unknown
        summary?: string
      }> = []

      // Start with the user's history. Assistant turns from history have plain strings.
      // As the agentic loop runs, we extend with tool_use / tool_result blocks.
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
                text: ADMIN_SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' },
              },
            ],
            messages,
            tools: ADMIN_TOOLS.map((t) => ({
              name: t.name,
              description: t.description,
              input_schema: t.input_schema as Anthropic.Tool.InputSchema,
            })),
            ...(extendedThinking && {
              thinking: {
                type: 'enabled',
                budget_tokens: THINKING_BUDGET_TOKENS,
              },
            }),
          }

          const modelStream = anthropic.messages.stream(streamParams)

          // Stream text + thinking deltas to the client as they arrive
          for await (const event of modelStream) {
            if (event.type === 'content_block_delta') {
              const d = event.delta
              if (d.type === 'text_delta') {
                send({ type: 'text', delta: d.text })
                assistantText += d.text
              } else if (d.type === 'thinking_delta') {
                send({ type: 'thinking', delta: d.thinking })
              }
            }
          }

          const final = await modelStream.finalMessage()

          // Accumulate usage
          totalInput += final.usage.input_tokens ?? 0
          totalOutput += final.usage.output_tokens ?? 0
          totalCacheCreate += final.usage.cache_creation_input_tokens ?? 0
          totalCacheRead += final.usage.cache_read_input_tokens ?? 0
          // Anthropic includes thinking tokens in output_tokens; separate field if present
          // (No dedicated counter in current SDK — we leave totalThinking as 0.)

          // If no tool use, we're done
          if (final.stop_reason !== 'tool_use') {
            break
          }

          // Append assistant response to conversation
          messages.push({ role: 'assistant', content: final.content })

          // Run each tool_use block, build tool_result blocks
          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of final.content) {
            if (block.type !== 'tool_use') continue
            totalToolCalls++
            send({ type: 'tool_use', id: block.id, name: block.name, input: block.input })
            assistantToolCalls.push({ id: block.id, name: block.name, input: block.input })

            const toolName = block.name as CopilotToolName
            let resultSummary = ''
            let resultSegments: SegmentResult[] | undefined

            try {
              const result = await runTool(toolName, (block.input ?? {}) as Record<string, unknown>)
              resultSummary = result.summary
              resultSegments = result.segments
            } catch (err) {
              resultSummary = `Tool error: ${err instanceof Error ? err.message : 'unknown'}`
              safeError('[copilot/chat] tool error:', err)
            }

            if (resultSegments && resultSegments.length > 0) {
              totalSegments += resultSegments.length
              assistantSegments.push(...resultSegments)
              send({ type: 'segments', segments: resultSegments })
            }
            send({ type: 'tool_result', tool_use_id: block.id, summary: resultSummary })

            const tcIdx = assistantToolCalls.findIndex((t) => t.id === block.id)
            if (tcIdx >= 0) assistantToolCalls[tcIdx] = { ...assistantToolCalls[tcIdx], summary: resultSummary }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: resultSummary,
            })
          }

          messages.push({ role: 'user', content: toolResults })
        }

        // Log + emit done
        const cost = (await import('@/lib/copilot/cost')).calculateCostUSD(DEFAULT_MODEL, {
          input_tokens: totalInput,
          output_tokens: totalOutput,
          cache_creation_tokens: totalCacheCreate,
          cache_read_tokens: totalCacheRead,
          thinking_tokens: totalThinking,
        })

        // Persist the completed turn to history (fire-and-forget semantics)
        await persistTurn({
          session_id: sessionId,
          user_message: firstUserMessage,
          assistant_text: assistantText,
          segments: assistantSegments,
          tool_calls: assistantToolCalls,
        })

        await logTurn({
          session_id: sessionId,
          user_id: platformAdmin.id,
          workspace_id: null,
          model: DEFAULT_MODEL,
          surface: 'admin',
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
        })
      } catch (err) {
        safeError('[copilot/chat] stream error:', err)
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
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
