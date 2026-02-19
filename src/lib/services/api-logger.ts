/**
 * API Logger — fire-and-forget external API call tracker
 * Logs service calls to api_logs for cost monitoring and debugging
 */

import { createAdminClient } from '@/lib/supabase/admin'

// Per-unit costs in USD
const FLAT_COSTS: Record<string, number> = {
  'firecrawl/scrape':       0.01,
  'firecrawl/map':          0.015,
  'firecrawl/extract':      0.015,
  'fal/flux-pro':           0.05,
  'fal/flux-dev':           0.025,
  'fal/flux-schnell':       0.003,
  'resend/email':           0,
  'slack/message':          0,
  'audiencelab/audience':   0,
  'audiencelab/records':    0,
  'millionverifier/verify': 0.002,
}

const OPENAI_PRICING: Record<string, { in: number; out: number }> = {
  'gpt-4o':             { in: 2.50 / 1_000_000, out: 10.00 / 1_000_000 },
  'gpt-4o-mini':        { in: 0.15 / 1_000_000, out: 0.60 / 1_000_000 },
}

const ANTHROPIC_PRICING: Record<string, { in: number; out: number }> = {
  'claude-sonnet-4-6':          { in: 3.00 / 1_000_000, out: 15.00 / 1_000_000 },
  'claude-opus-4-6':            { in: 15.00 / 1_000_000, out: 75.00 / 1_000_000 },
  'claude-haiku-4-5-20251001':  { in: 0.80 / 1_000_000, out: 4.00 / 1_000_000 },
}

export function estimateCost(opts: {
  service: string
  endpoint: string
  model?: string
  tokensIn?: number
  tokensOut?: number
}): number {
  const { service, endpoint, model, tokensIn, tokensOut } = opts

  if (service === 'openai' && model && tokensIn !== undefined) {
    const pricing = OPENAI_PRICING[model] ?? OPENAI_PRICING['gpt-4o']
    return (tokensIn * pricing.in) + ((tokensOut ?? 0) * pricing.out)
  }

  if (service === 'anthropic' && model && tokensIn !== undefined) {
    const pricing = ANTHROPIC_PRICING[model] ?? ANTHROPIC_PRICING['claude-sonnet-4-6']
    return (tokensIn * pricing.in) + ((tokensOut ?? 0) * pricing.out)
  }

  return FLAT_COSTS[`${service}/${endpoint}`] ?? 0
}

export interface ApiLogEntry {
  service: string
  endpoint: string
  method?: string
  statusCode?: number
  durationMs?: number
  tokensIn?: number
  tokensOut?: number
  model?: string
  estimatedCost?: number   // if omitted, auto-calculated
  workspaceId?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Fire-and-forget log of an external API call.
 * Never throws — safe to call without await.
 */
export function logApiCall(entry: ApiLogEntry): void {
  const cost =
    entry.estimatedCost ??
    estimateCost({
      service: entry.service,
      endpoint: entry.endpoint,
      model: entry.model,
      tokensIn: entry.tokensIn,
      tokensOut: entry.tokensOut,
    })

  const supabase = createAdminClient()
  Promise.resolve(
    supabase
      .from('api_logs')
      .insert({
        service:        entry.service,
        endpoint:       entry.endpoint,
        method:         entry.method ?? 'POST',
        status_code:    entry.statusCode,
        duration_ms:    entry.durationMs,
        tokens_in:      entry.tokensIn ?? null,
        tokens_out:     entry.tokensOut ?? null,
        estimated_cost: cost,
        workspace_id:   entry.workspaceId ?? null,
        metadata:       { ...entry.metadata, model: entry.model },
      })
  ).then(({ error }) => {
    if (error) console.error('[api-logger] Failed to log:', error.message)
  }).catch(() => {/* swallow network errors */})
}

/**
 * Convenience: time a promise and log the result.
 */
export async function withApiLog<T>(
  entry: Omit<ApiLogEntry, 'durationMs' | 'statusCode'>,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    logApiCall({ ...entry, durationMs: Date.now() - start, statusCode: 200 })
    return result
  } catch (err: any) {
    logApiCall({ ...entry, durationMs: Date.now() - start, statusCode: 500,
      metadata: { ...entry.metadata, error: err?.message } })
    throw err
  }
}
