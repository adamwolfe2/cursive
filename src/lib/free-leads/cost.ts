/** Unit prices for cost-per-signup accounting (funnel event meta). Update when vendor prices change. */
import type Anthropic from '@anthropic-ai/sdk'

// Per million tokens, 2026-09-30. Cache write = 5-minute TTL (1.25x input).
const CLAUDE: Record<string, { in: number; out: number; read: number; write: number }> = {
  'claude-opus-5-5': { in: 4, out: 20, read: 0.2, write: 5 },
  'claude-sonnet-5-5': { in: 2, out: 10, read: 0.2, write: 2.5 },
}
/** Lead database credits: $97 per 10,000. */
export const CREDIT_USD = 97 / 10_000

export function claudeUsd(model: string, u: Anthropic.Usage): number {
  const p = CLAUDE[model.replace(/-\d{8}$/, '')] ?? CLAUDE['claude-opus-5-5']
  const usd =
    (u.input_tokens * p.in + u.output_tokens * p.out + (u.cache_read_input_tokens ?? 0) * p.read + (u.cache_creation_input_tokens ?? 0) * p.write) / 1e6
  return Math.round(usd * 1e5) / 1e5
}
