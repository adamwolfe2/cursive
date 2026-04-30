/**
 * Claude model pricing + cost utilities for the admin copilot.
 *
 * Prices are USD per 1M tokens. Source: Anthropic public pricing.
 * If prices change, update this table — all cost math flows through it.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export type CopilotModel =
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-7'

interface ModelPricing {
  input: number
  output: number
  cache_write: number
  cache_read: number
}

const PRICING: Record<CopilotModel, ModelPricing> = {
  'claude-haiku-4-5-20251001': {
    input: 1.0,
    output: 5.0,
    cache_write: 1.25,
    cache_read: 0.1,
  },
  'claude-sonnet-4-6': {
    input: 3.0,
    output: 15.0,
    cache_write: 3.75,
    cache_read: 0.3,
  },
  'claude-opus-4-7': {
    input: 15.0,
    output: 75.0,
    cache_write: 18.75,
    cache_read: 1.5,
  },
}

export interface TurnUsage {
  input_tokens: number
  output_tokens: number
  cache_creation_tokens?: number
  cache_read_tokens?: number
  thinking_tokens?: number
}

export function calculateCostUSD(model: CopilotModel, usage: TurnUsage): number {
  const p = PRICING[model]
  if (!p) return 0
  const cost =
    (usage.input_tokens / 1_000_000) * p.input +
    (usage.output_tokens / 1_000_000) * p.output +
    ((usage.cache_creation_tokens ?? 0) / 1_000_000) * p.cache_write +
    ((usage.cache_read_tokens ?? 0) / 1_000_000) * p.cache_read +
    // Thinking tokens bill at output rate
    ((usage.thinking_tokens ?? 0) / 1_000_000) * p.output
  return Math.round(cost * 1_000_000) / 1_000_000
}

/**
 * Daily kill-switch. Returns {allowed, spent_today, cap} — call before running a turn.
 * The cap is configurable via COPILOT_DAILY_USD_CAP env var (default $20).
 */
export async function checkDailyBudget(
  surface: 'admin' | 'public' = 'admin'
): Promise<{ allowed: boolean; spent_today: number; cap: number }> {
  const cap = Number(process.env.COPILOT_DAILY_USD_CAP ?? '20')
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('copilot_usage_today', {
      surface_filter: surface,
    })
    if (error) {
      console.error('[copilot/cost] kill-switch rpc failed:', error)
      return { allowed: true, spent_today: 0, cap }
    }
    const row = Array.isArray(data) ? data[0] : data
    const spent = Number(row?.total_cost_usd ?? 0)
    return { allowed: spent < cap, spent_today: spent, cap }
  } catch (err) {
    console.error('[copilot/cost] kill-switch error:', err)
    return { allowed: true, spent_today: 0, cap }
  }
}

export interface LogTurnParams {
  session_id: string
  user_id: string | null
  workspace_id: string | null
  model: CopilotModel
  surface: 'admin' | 'public'
  usage: TurnUsage
  tool_calls: number
  segments_retrieved: number
  latency_ms: number
}

export async function logTurn(params: LogTurnParams): Promise<void> {
  const cost = calculateCostUSD(params.model, params.usage)
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('copilot_usage').insert({
      session_id: params.session_id,
      user_id: params.user_id,
      workspace_id: params.workspace_id,
      model: params.model,
      surface: params.surface,
      input_tokens: params.usage.input_tokens,
      output_tokens: params.usage.output_tokens,
      cache_creation_tokens: params.usage.cache_creation_tokens ?? 0,
      cache_read_tokens: params.usage.cache_read_tokens ?? 0,
      thinking_tokens: params.usage.thinking_tokens ?? 0,
      tool_calls: params.tool_calls,
      segments_retrieved: params.segments_retrieved,
      cost_usd: cost,
      latency_ms: params.latency_ms,
    })
    if (error) console.error('[copilot/cost] logTurn insert failed:', error)
  } catch (err) {
    console.error('[copilot/cost] logTurn error:', err)
  }
}
