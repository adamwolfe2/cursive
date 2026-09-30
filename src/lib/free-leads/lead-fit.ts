/**
 * Cheap fit check on pulled contacts before they are shown: scores each lead 0-3 against
 * the ICP and writes a one-line, customer-facing "why this lead". Off-ICP rows (0) never
 * reach the user; the best FREE_LEAD_COUNT are kept.
 *
 * Model: chosen on the eval (scripts/free-leads-eval) by agreement with an Opus judge.
 * A failed judge call never blocks delivery: rows fall back to upstream order, no reason.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { GetLeadsContact } from '@/lib/getleads/client'
import { safeWarn } from '@/lib/utils/log-sanitizer'
import type { Icp } from './contract'

export const FIT_MODEL = 'claude-sonnet-5-5'
export const FIT_EFFORT = 'low'
/** Pull this many for a FREE_LEAD_COUNT delivery so dropped rows can be replaced. */
export const OVERPULL_FACTOR = 1.4

export interface LeadFit {
  score: 0 | 1 | 2 | 3
  why: string
}

const SYSTEM = `You check a B2B lead list against the seller's ideal customer profile.
For each person, score 0-3 how likely they are to buy, or decide on buying, what the seller sells:
3 = clearly the right buyer (right role at the kind of organization the seller serves, in the right place).
2 = plausible buyer or strong influencer.
1 = weak (tangential role, wrong segment or size, or outside the seller's area).
0 = wrong (an organization that would not buy this, a competitor, or no buying influence).
"why": one line under 90 characters shown to the seller next to the lead: why this person is worth contacting,
using the row only (role, company type, size, place), e.g. "Runs facilities for a 300-person Dallas hospital, so owns HVAC contracts."
Plain words. Do not grade or label ("core buyer", "fits", "weak"), no hype, no em dashes, never mention data sources.`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['leads'],
  properties: {
    leads: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['i', 'score', 'why'],
        properties: { i: { type: 'integer' }, score: { type: 'integer', enum: [0, 1, 2, 3] }, why: { type: 'string' } },
      },
    },
  },
}

export function icpBrief(icp: Icp, website: string): string {
  const geo = [...(icp.cities ?? []), ...icp.states, ...icp.countries].join(', ')
  return [
    `Seller: ${website}`,
    `What they sell and to whom: ${icp.summary}`,
    icp.industries.length ? `Buyer industries: ${icp.industries.join(', ')}` : null,
    icp.job_titles.length ? `Buyer titles: ${icp.job_titles.join(', ')}` : null,
    icp.company_size.length ? `Buyer company size: ${icp.company_size.join(', ')} employees` : null,
    geo ? `Where: ${geo}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export function leadRow(c: GetLeadsContact, n: number): string {
  const loc = [c.person_city, c.state_name, c.person_country_name].filter(Boolean).join(', ')
  return `${n}. ${c.job_title || '(no title)'} at ${c.org_company_name || '(no company)'} | industry: ${c.org_industry_linkedin || '?'} | size: ${c.employee_count_range || '?'} | ${loc || '?'}`
}

/** Parses the model output into one LeadFit per contact; null when any row is missing or malformed. */
export function parseFits(text: string, n: number): LeadFit[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    safeWarn('[free-leads/lead-fit] unparseable judge output', String(err))
    return null
  }
  const rows = (parsed as { leads?: unknown })?.leads
  if (!Array.isArray(rows)) return null
  const byIndex = new Map<number, LeadFit>()
  for (const r of rows as Array<{ i?: unknown; score?: unknown; why?: unknown }>) {
    if (typeof r.i !== 'number' || ![0, 1, 2, 3].includes(r.score as number) || typeof r.why !== 'string') continue
    byIndex.set(r.i, { score: r.score as LeadFit['score'], why: r.why.replace(/\s*[—–]\s*/g, ', ').trim().slice(0, 120) })
  }
  const out = Array.from({ length: n }, (_, k) => byIndex.get(k + 1))
  return out.every(Boolean) ? (out as LeadFit[]) : null
}

let client: Anthropic | null = null

export interface FitUsage {
  usage: Anthropic.Usage
  model: string
}

/** Scores contacts against the ICP. Returns null (never throws) when the check is unavailable. */
export async function scoreLeads(
  icp: Icp,
  website: string,
  contacts: readonly GetLeadsContact[],
  opts: { model?: string; effort?: 'low' | 'medium' | 'high'; onUsage?: (u: FitUsage) => void } = {}
): Promise<LeadFit[] | null> {
  if (!contacts.length) return []
  if (!process.env.ANTHROPIC_API_KEY) {
    safeWarn('[free-leads/lead-fit] ANTHROPIC_API_KEY missing; delivering unscored')
    return null
  }
  client ??= new Anthropic({ maxRetries: 1, timeout: 25_000 })
  try {
    const message = await client.messages.create({
      model: opts.model ?? FIT_MODEL,
      max_tokens: 6_000,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `<seller>\n${icpBrief(icp, website)}\n</seller>\n\n<people>\n${contacts.map((c, k) => leadRow(c, k + 1)).join('\n')}\n</people>`,
        },
      ],
      output_config: { effort: opts.effort ?? FIT_EFFORT, format: { type: 'json_schema', schema: SCHEMA } },
    } as Anthropic.MessageCreateParamsNonStreaming)
    opts.onUsage?.({ usage: message.usage, model: message.model })
    if (message.stop_reason !== 'end_turn') {
      safeWarn('[free-leads/lead-fit] judge stopped early', message.stop_reason)
      return null
    }
    return parseFits(message.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join(''), contacts.length)
  } catch (err) {
    safeWarn('[free-leads/lead-fit] judge call failed; delivering unscored', String(err))
    return null
  }
}

/**
 * Picks up to `count` contacts: never score 0; best score first; upstream order breaks ties.
 * Without fits (judge unavailable) it keeps upstream order.
 */
export function selectFitLeads<T>(items: readonly T[], fits: readonly LeadFit[] | null, count: number): Array<{ item: T; fit: LeadFit | null }> {
  if (!fits) return items.slice(0, count).map((item) => ({ item, fit: null }))
  return items
    .map((item, k) => ({ item, fit: fits[k], k }))
    .filter((r) => r.fit.score > 0)
    .sort((a, b) => b.fit.score - a.fit.score || a.k - b.k)
    .slice(0, count)
    .map(({ item, fit }) => ({ item, fit }))
}
