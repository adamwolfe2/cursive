/**
 * POST /api/public/copilot/preview
 *
 * Unauthenticated preview endpoint for the Audience Builder public copilot.
 * Runs a full Claude + tool-use search, streaming reasoning + segments via SSE.
 * Hard-gated by an IP hash + a daily preview cap. The UI blurs the results at
 * the end and swaps in an email-capture modal before the visitor can scroll
 * or interact with what was returned.
 *
 * Hard caps (defense in depth — tighter than the authenticated /chat route):
 *   - max_tokens per model call: 768
 *   - max tool iterations: 3
 *   - per-IP previews/day: PREVIEWS_PER_IP_PER_DAY (default 3)
 *   - global surface budget kill-switch via checkDailyBudget('public')
 */

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { PUBLIC_SYSTEM_PROMPT } from '@/lib/copilot/public-prompt'
import { PUBLIC_TOOLS, runPublicTool } from '@/lib/copilot/public-tools'
import {
  calculateCostUSD,
  checkDailyBudget,
  logTurn,
  type CopilotModel,
} from '@/lib/copilot/cost'
import { hashIp } from '@/lib/copilot/public-session'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { CopilotToolName } from '@/lib/copilot/tools'
import type { SegmentResult, StreamEvent } from '@/lib/copilot/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL: CopilotModel = 'claude-sonnet-4-6'
const MAX_TOKENS = 768
const MAX_TOOL_ITERATIONS = 3
const PREVIEWS_PER_IP_PER_DAY = 3

const BodySchema = z.object({
  query: z.string().min(1).max(2000),
})

function ssePayload(event: StreamEvent | Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()

  // ── Parse body ───────────────────────────────────────────────────
  let body: { query: string }
  try {
    const raw = await req.json()
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json(
        { error: 'invalid_request', details: parsed.error.issues[0]?.message },
        { status: 400 }
      )
    }
    body = parsed.data
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  // ── Request metadata ─────────────────────────────────────────────
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || 'unknown'
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null
  const ipHash = hashIp(ip)

  // ── Global daily budget kill-switch ──────────────────────────────
  const budget = await checkDailyBudget('public')
  if (!budget.allowed) {
    return Response.json(
      {
        error: 'daily_budget_exceeded',
        message: `Daily limit reached. Resets at 00:00 UTC.`,
      },
      { status: 429 }
    )
  }

  // ── Per-IP rate limit ────────────────────────────────────────────
  const supabase = createAdminClient()
  const { data: previewCountRaw } = await supabase.rpc(
    'audience_builder_preview_check',
    { ip_hash_filter: ipHash }
  )
  const previewCount = Number(previewCountRaw ?? 0)
  if (previewCount >= PREVIEWS_PER_IP_PER_DAY) {
    return Response.json(
      {
        error: 'preview_limit_reached',
        message: `You've used all ${PREVIEWS_PER_IP_PER_DAY} free previews for today. Book a call to activate an audience.`,
      },
      { status: 429 }
    )
  }

  // ── Insert preview row (tracks query + converts later on signup) ─
  const { data: previewRow, error: previewInsertErr } = await supabase
    .from('audience_builder_previews')
    .insert({
      ip_hash: ipHash,
      user_agent: userAgent,
      query: body.query.slice(0, 2000),
      segment_count: 0,
      cost_usd: 0,
    })
    .select('id')
    .single()

  if (previewInsertErr) {
    safeError('[preview] preview insert failed:', previewInsertErr)
  }
  const previewId: string | null = previewRow?.id ?? null

  // ── Anthropic client ─────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'misconfigured' }, { status: 500 })
  }
  const anthropic = new Anthropic({ apiKey })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (evt: StreamEvent | Record<string, unknown>) =>
        controller.enqueue(encoder.encode(ssePayload(evt)))

      let totalInput = 0
      let totalOutput = 0
      let totalCacheCreate = 0
      let totalCacheRead = 0
      let totalToolCalls = 0
      let totalSegments = 0

      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: body.query },
      ]

      try {
        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          // Emit a lightweight "thinking" nudge on the first iteration so the
          // live-step ticker has something to render before text/tool events
          // start flowing (extended thinking is not enabled for public).
          if (iter === 0) {
            send({
              type: 'thinking',
              delta: 'Analyzing your audience description...',
            })
          }

          const params: Anthropic.MessageStreamParams = {
            model: MODEL,
            max_tokens: MAX_TOKENS,
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

          const modelStream = anthropic.messages.stream(params)

          for await (const event of modelStream) {
            if (event.type === 'content_block_delta') {
              const d = event.delta
              if (d.type === 'text_delta') {
                send({ type: 'text', delta: d.text })
              }
            }
          }

          const final = await modelStream.finalMessage()
          totalInput += final.usage.input_tokens ?? 0
          totalOutput += final.usage.output_tokens ?? 0
          totalCacheCreate += final.usage.cache_creation_input_tokens ?? 0
          totalCacheRead += final.usage.cache_read_input_tokens ?? 0

          if (final.stop_reason !== 'tool_use') break

          messages.push({ role: 'assistant', content: final.content })

          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of final.content) {
            if (block.type !== 'tool_use') continue
            totalToolCalls++
            send({
              type: 'tool_use',
              id: block.id,
              name: block.name,
              input: block.input,
            })

            const toolName = block.name as CopilotToolName
            let resultSummary = ''
            let resultSegments: SegmentResult[] | undefined
            try {
              const result = await runPublicTool(
                toolName,
                (block.input ?? {}) as Record<string, unknown>
              )
              resultSummary = result.summary
              resultSegments = result.segments
            } catch (err) {
              resultSummary = `Tool error: ${err instanceof Error ? err.message : 'unknown'}`
              safeError('[preview] tool error:', err)
            }

            if (resultSegments && resultSegments.length > 0) {
              totalSegments += resultSegments.length
              send({ type: 'segments', segments: resultSegments })
            }
            send({
              type: 'tool_result',
              tool_use_id: block.id,
              summary: resultSummary,
            })

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: resultSummary,
            })
          }

          messages.push({ role: 'user', content: toolResults })
        }

        const cost = calculateCostUSD(MODEL, {
          input_tokens: totalInput,
          output_tokens: totalOutput,
          cache_creation_tokens: totalCacheCreate,
          cache_read_tokens: totalCacheRead,
        })

        // Update preview row with final counts
        if (previewId) {
          const { error: previewUpdateErr } = await supabase
            .from('audience_builder_previews')
            .update({ segment_count: totalSegments, cost_usd: cost })
            .eq('id', previewId)
          if (previewUpdateErr) {
            safeError('[preview] preview update failed:', previewUpdateErr)
          }
        }

        // Log to copilot_usage with the 'public' surface marker
        await logTurn({
          session_id: `preview-${previewId ?? 'unknown'}`,
          user_id: null,
          workspace_id: null,
          model: MODEL,
          surface: 'public',
          usage: {
            input_tokens: totalInput,
            output_tokens: totalOutput,
            cache_creation_tokens: totalCacheCreate,
            cache_read_tokens: totalCacheRead,
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
            thinking_tokens: 0,
            cost_usd: cost,
          },
          preview_id: previewId,
          previews_remaining: Math.max(
            0,
            PREVIEWS_PER_IP_PER_DAY - (previewCount + 1)
          ),
        })
      } catch (err) {
        safeError('[preview] stream error:', err)
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
