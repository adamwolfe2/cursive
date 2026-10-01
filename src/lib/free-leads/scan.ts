/**
 * ICP inference (scan) and ICP edits (refine) with Claude.
 *
 * Structured output with `findings` first, so the stream yields user-visible
 * findings within seconds, then ICP fields in order (emitted as `icp_partial`),
 * then the final validated ICP. Industries are constrained to the upstream enum.
 *
 * Note: server-side `fallbacks` (beta server-side-fallback-2026-07-01) is not
 * sent: @anthropic-ai/sdk 0.72 has no typed support for it. Refusals are
 * handled by stop_reason instead.
 */
import Anthropic from '@anthropic-ai/sdk'
import { partialParse } from '@anthropic-ai/sdk/_vendor/partial-json-parser/parser'
import { LEAD_INDUSTRIES } from '@/lib/free-leads/industries'
import { tidyPrices } from './site'
import { canonicalIndustry, coreTitles } from './icp-to-filters'
import { safeWarn } from '@/lib/utils/log-sanitizer'
import { COMPANY_SIZE_BANDS, FACT_LABELS, IcpSchema, SENIORITY_VALUES, type Fact, type FactKey, type Icp } from './contract'

// Sonnet 5.5 low matched Opus 5.5 low on the ICP-fit eval (mean fit 2.29 vs 2.25, 115 leads) at ~1/4
// the cost per scan and ~2s faster to the ICP (scripts/free-leads-eval/RESULTS.md, 2026-09-30).
const MODEL = 'claude-sonnet-5-5'
/** Bump when the prompt, schema or model changes: cached scans from older versions are ignored. */
export const SCAN_VERSION = 'v7-core-titles'
const ICP_KEYS = ['summary', 'industries', 'job_titles', 'seniority', 'company_size', 'countries', 'states', 'cities'] as const

export class ScanError extends Error {
  constructor(message: string, readonly code: 'refusal' | 'truncated' | 'invalid' | 'not_configured') {
    super(message)
    this.name = 'ScanError'
  }
}

/** Facts shown to the user; anything past this is dropped (the scan is not a general model proxy). */
export const MAX_FINDINGS = 4
const MODEL_FACT_KEYS = ['offer', 'customers', 'pricing', 'locations'] as const satisfies readonly FactKey[]
// Output caps bound abuse, not normal use: measured 414-467 output tokens per scan, 256 per refine (2026-09-30).
const SCAN_MAX_TOKENS = 2_500
const REFINE_MAX_TOKENS = 2_000

// Structured outputs reject maxItems (API 400, 2026-09-30), so array caps are enforced by the
// prompt, by stopping emission after MAX_FINDINGS, by toIcp() clamping, and by max_tokens.
const strArray = { type: 'array', items: { type: 'string' } }
const enumArray = (values: readonly string[]) => ({ type: 'array', items: { type: 'string', enum: [...values] } })

const ICP_PROPERTIES = {
  summary: { type: 'string' },
  industries: enumArray(LEAD_INDUSTRIES),
  job_titles: strArray,
  seniority: enumArray(SENIORITY_VALUES),
  company_size: enumArray(COMPANY_SIZE_BANDS),
  countries: strArray,
  states: strArray,
  cities: strArray,
}

function objectSchema(properties: Record<string, unknown>) {
  return { type: 'object', additionalProperties: false, required: Object.keys(properties), properties }
}

const SCAN_SCHEMA = objectSchema({
  findings: {
    type: 'array',
    items: objectSchema({ key: { type: 'string', enum: [...MODEL_FACT_KEYS] }, text: { type: 'string' } }),
  },
  ...ICP_PROPERTIES,
})
const REFINE_SCHEMA = objectSchema({ ...ICP_PROPERTIES, note: { type: 'string' } })

const ICP_RULES = `ICP field rules:
- summary: one sentence, second person, max 200 characters, e.g. "You sell SOC 2 audits to Series A SaaS teams."
- industries: 1-4 of the MOST SPECIFIC enum values for the BUYERS' organizations (not the seller's own industry unless they sell within it).
  Use "Dentists", not "Hospitals and Health Care" or "Medical Practices"; SaaS companies are "Software Development", not "IT Services and IT Consulting".
  Add a broad value (e.g. "Financial Services", "Manufacturing") only when the seller really sells across that whole sector.
  Use [] when the buyers are any kind of organization in an area (typical for a local business).
- job_titles: 3-8 plain titles exactly as people hold them on LinkedIn, for the people who own this purchase or champion it (e.g. "VP of Marketing", "Director of Marketing", "Regional Manager", "Director of Revenue Management", "Asset Manager").
  Titles match as a contiguous substring, so NEVER add the industry or segment to a title ("VP Marketing Multifamily", "Director of Marketing Real Estate" match nobody): the industries field carries the industry.
  Write "Director of Marketing", not "Director Marketing". Avoid bare generic titles ("Operations Manager", "Store Manager", "Manager") that would also match unrelated roles; name the function, not the industry.
- seniority: from the enum. company_size: the buyer company size bands most likely to buy.
- countries: full country names, e.g. "United States". Default to the seller's home market when unclear.
- states: only when the business is clearly local or regional (full state names, e.g. "Texas"); otherwise [].
- cities: only for a local business serving one metro (a clinic, contractor, local law firm or agency): 4-10 of that metro's main cities as written in addresses (e.g. "Dallas", "Fort Worth", "Plano", "Irving"); also set states. Otherwise [].
- If the seller mainly sells to consumers, target the business buyers with the most direct path to purchase (e.g. office or HR managers buying for staff, stores that stock the product, property managers) and say so in the summary.`

const SCAN_SYSTEM = `You analyze a company's website (its homepage and a few key pages) to infer its ideal customer profile (who it should sell to), for a B2B lead list.
Write findings first, 2-4 short facts read from the site, in this order, each once:
- offer: what they sell ("SOC 2 audit readiness plus auditor intros").
- customers: who buys it, as the site shows ("Engineering leaders at Series A-C software companies").
- pricing: only if the site states prices or a pricing model ("Annual plans from $4,900").
- locations: only if the site names where they operate or serve ("Dallas Fort Worth commercial buildings").
Each text is a short third-person phrase under 90 characters, not a sentence: no "You", no "They", no trailing period.
Factual, no hype, no emojis, no em dashes.
Then the ICP fields.
${ICP_RULES}`

const REFINE_SYSTEM = `You edit a B2B ideal customer profile according to the user's instruction. Change only what the instruction asks; keep everything else identical.
Also return note: one short sentence (under 100 characters) saying what changed, no em dashes.
${ICP_RULES}`

let client: Anthropic | null = null
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new ScanError('ANTHROPIC_API_KEY missing', 'not_configured')
  client ??= new Anthropic({ maxRetries: 1, timeout: 45_000 })
  return client
}

/** Request params. Effort lives in output_config; SDK 0.72 types only know `format`, hence the cast. */
function params(
  system: string,
  schema: object,
  user: string,
  maxTokens: number,
  choice: ModelChoice = {}
): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: choice.model ?? MODEL,
    max_tokens: maxTokens,
    // The structured-output schema (441-value industry enum, ~6.5k tokens) is part of this cached
    // prefix: a warm scan reads it at 0.05x instead of paying full input (measured 2026-09-30).
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
    output_config: { effort: choice.effort ?? 'low', format: { type: 'json_schema', schema } },
  } as Anthropic.MessageCreateParamsNonStreaming
}

function checkStop(message: Anthropic.Message): void {
  if (message.stop_reason === 'refusal') throw new ScanError('Model declined the request', 'refusal')
  if (message.stop_reason === 'max_tokens') throw new ScanError('Model output truncated', 'truncated')
}

function finalText(message: Anthropic.Message): string {
  return message.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('')
}

/** Clamp model output into the contract shape; throws ScanError('invalid') if it still fails. */
export function toIcp(raw: Record<string, unknown>): Icp {
  const arr = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, max) : [])
  const parsed = IcpSchema.safeParse({
    summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 240) : '',
    industries: arr(raw.industries, 8).map(canonicalIndustry).filter((i): i is string => i !== null),
    job_titles: coreTitles(arr(raw.job_titles, 12).map((t) => t.slice(0, 80))),
    seniority: arr(raw.seniority, 5),
    company_size: arr(raw.company_size, 8),
    countries: arr(raw.countries, 10),
    states: arr(raw.states, 15),
    cities: arr(raw.cities, 12).map((c) => c.slice(0, 80)),
  })
  if (!parsed.success) throw new ScanError(`ICP failed validation: ${parsed.error.message.slice(0, 200)}`, 'invalid')
  return parsed.data
}

function toFact(raw: unknown): Fact | null {
  const f = raw as { key?: unknown; text?: unknown } | null
  const key = MODEL_FACT_KEYS.find((k) => k === f?.key)
  if (!key || typeof f?.text !== 'string' || !f.text.trim()) return null
  return { key, label: FACT_LABELS[key], text: tidyPrices(f.text.trim().replace(/\s*[—–]\s*/g, ', ')).slice(0, 160), source: 'model' }
}

/** One fact per key, in first-seen order; the model's reading beats the site's regex when both exist. */
export function dedupeFacts(facts: readonly Fact[]): Fact[] {
  const best = new Map<FactKey, Fact>()
  for (const f of facts) {
    const cur = best.get(f.key)
    if (!cur || (cur.source !== 'model' && f.source === 'model')) best.set(f.key, f)
  }
  return [...best.values()]
}

export interface ScanCallbacks {
  onFact: (fact: Fact) => void
  onIcpPartial: (icp: Partial<Icp>) => void
  /** Token usage of each model call (cost accounting). */
  onUsage?: (usage: Anthropic.Usage, model: string) => void
}

/** Model/effort override (eval comparisons). Production uses the defaults. */
export interface ModelChoice {
  model?: string
  effort?: 'low' | 'medium' | 'high'
}

/** Emits findings / completed ICP fields from a growing JSON snapshot. Stateful per attempt. */
export function snapshotEmitter(cb: ScanCallbacks) {
  let findingsSent = 0
  let fieldsSent = 0
  return (snapshot: string) => {
    let obj: Record<string, unknown>
    try {
      obj = (partialParse(snapshot) ?? {}) as Record<string, unknown>
    } catch (err) {
      safeWarn('[free-leads/scan] partial parse skipped', String(err))
      return
    }
    const findings = Array.isArray(obj.findings) ? obj.findings : []
    const findingsDone = 'summary' in obj
    const ready = Math.min(MAX_FINDINGS, findingsDone ? findings.length : Math.max(0, findings.length - 1))
    for (; findingsSent < ready; findingsSent++) {
      const f = toFact(findings[findingsSent])
      if (f) cb.onFact(f)
    }
    // A field is complete once the next key has started.
    const present = ICP_KEYS.filter((k) => k in obj)
    const complete = present.length > 0 ? present.length - 1 : 0
    if (complete > fieldsSent) {
      fieldsSent = complete
      const partial = Object.fromEntries(present.slice(0, complete).map((k) => [k, obj[k]]))
      cb.onIcpPartial(partial as Partial<Icp>)
    }
  }
}

async function scanAttempt(siteText: string, emit: ((s: string) => void) | null, cb: ScanCallbacks, choice: ModelChoice): Promise<Icp> {
  const stream = anthropic().messages.stream(
    params(SCAN_SYSTEM, SCAN_SCHEMA, `Website content:\n<site>\n${siteText}\n</site>`, SCAN_MAX_TOKENS, choice)
  )
  if (emit) stream.on('text', (_delta, snapshot) => emit(snapshot))
  const message = await stream.finalMessage()
  cb.onUsage?.(message.usage, message.model)
  checkStop(message)
  return toIcp(JSON.parse(finalText(message)) as Record<string, unknown>)
}

/** Infers the ICP from site text. Streams findings/partials via callbacks; retries once on bad output. */
export async function scanIcp(siteText: string, cb: ScanCallbacks, choice: ModelChoice = {}): Promise<Icp> {
  try {
    return await scanAttempt(siteText, snapshotEmitter(cb), cb, choice)
  } catch (err) {
    if (!(err instanceof ScanError && (err.code === 'invalid' || err.code === 'truncated')) && !(err instanceof SyntaxError)) {
      throw err
    }
    safeWarn('[free-leads/scan] retrying after bad output', String(err))
    return scanAttempt(siteText, null, cb, choice)
  }
}

/** Applies a natural-language edit to an ICP. Retries once on bad output. */
export async function refineIcp(icp: Icp, instruction: string): Promise<{ icp: Icp; note: string }> {
  const user = `Current ICP:\n${JSON.stringify(icp)}\n\nInstruction:\n<instruction>${instruction}</instruction>`
  for (let attempt = 0; ; attempt++) {
    try {
      const message = await anthropic().messages.create(params(REFINE_SYSTEM, REFINE_SCHEMA, user, REFINE_MAX_TOKENS))
      checkStop(message)
      const raw = JSON.parse(finalText(message)) as Record<string, unknown>
      const note = typeof raw.note === 'string' ? raw.note.slice(0, 160) : 'Updated your profile.'
      // "Remove everything" can come back with an empty summary; the previous one still describes the offer.
      const summary = typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary : icp.summary
      return { icp: toIcp({ ...raw, summary }), note }
    } catch (err) {
      const retryable = (err instanceof ScanError && err.code !== 'refusal' && err.code !== 'not_configured') || err instanceof SyntaxError
      if (!retryable || attempt >= 1) throw err
      safeWarn('[free-leads/refine] retrying after bad output', String(err))
    }
  }
}
