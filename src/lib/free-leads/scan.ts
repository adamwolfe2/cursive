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
import { safeWarn } from '@/lib/utils/log-sanitizer'
import {
  COMPANY_SIZE_BANDS,
  FindingSchema,
  IcpSchema,
  SENIORITY_VALUES,
  type Finding,
  type Icp,
} from './contract'

const MODEL = 'claude-opus-5-5'
const ICP_KEYS = ['summary', 'industries', 'job_titles', 'seniority', 'company_size', 'countries', 'states'] as const

export class ScanError extends Error {
  constructor(message: string, readonly code: 'refusal' | 'truncated' | 'invalid' | 'not_configured') {
    super(message)
    this.name = 'ScanError'
  }
}

/** Findings shown to the user; anything past this is dropped (the scan is not a general model proxy). */
export const MAX_FINDINGS = 4
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
}

function objectSchema(properties: Record<string, unknown>) {
  return { type: 'object', additionalProperties: false, required: Object.keys(properties), properties }
}

const SCAN_SCHEMA = objectSchema({
  findings: {
    type: 'array',
    items: objectSchema({ label: { type: 'string' }, text: { type: 'string' } }),
  },
  ...ICP_PROPERTIES,
})
const REFINE_SCHEMA = objectSchema({ ...ICP_PROPERTIES, note: { type: 'string' } })

const ICP_RULES = `ICP field rules:
- summary: one sentence, second person, max 200 characters, e.g. "You sell SOC 2 audits to Series A SaaS teams."
- industries: 1-5 values from the enum describing the BUYERS' industries (not the seller's own industry unless they sell within it).
- job_titles: 3-8 concrete titles of the people who buy or champion this (e.g. "Head of Growth", "VP Marketing").
- seniority: from the enum. company_size: the buyer company size bands most likely to buy.
- countries: full country names, e.g. "United States". Default to the seller's home market when unclear.
- states: only when the business is clearly local or regional (full state names, e.g. "Texas"); otherwise [].`

const SCAN_SYSTEM = `You analyze a company's website to infer its ideal customer profile (who it should sell to), for a B2B lead list.
Write findings first: 3-4 (never more than 4) short factual observations, each with a label of at most 3 words ("What you sell", "Who buys", "Deal size", "Where") and text under 120 characters, second person ("You sell..."). No hype, no emojis, no em dashes.
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
function params(system: string, schema: object, user: string, maxTokens: number): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
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
  const industrySet: ReadonlySet<string> = new Set(LEAD_INDUSTRIES)
  const parsed = IcpSchema.safeParse({
    summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 240) : '',
    industries: arr(raw.industries, 8).filter((i) => industrySet.has(i)),
    job_titles: arr(raw.job_titles, 12).map((t) => t.slice(0, 80)),
    seniority: arr(raw.seniority, 5),
    company_size: arr(raw.company_size, 8),
    countries: arr(raw.countries, 10),
    states: arr(raw.states, 15),
  })
  if (!parsed.success) throw new ScanError(`ICP failed validation: ${parsed.error.message.slice(0, 200)}`, 'invalid')
  return parsed.data
}

function toFinding(raw: unknown): Finding | null {
  const f = raw as { label?: unknown; text?: unknown } | null
  if (typeof f?.label !== 'string' || typeof f.text !== 'string' || !f.label || !f.text) return null
  const parsed = FindingSchema.safeParse({ label: f.label.slice(0, 40), text: f.text.slice(0, 160) })
  return parsed.success ? parsed.data : null
}

export interface ScanCallbacks {
  onFinding: (finding: Finding) => void
  onIcpPartial: (icp: Partial<Icp>) => void
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
      const f = toFinding(findings[findingsSent])
      if (f) cb.onFinding(f)
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

async function scanAttempt(siteText: string, emit: ((s: string) => void) | null): Promise<Icp> {
  const stream = anthropic().messages.stream(
    params(SCAN_SYSTEM, SCAN_SCHEMA, `Website content:\n<site>\n${siteText}\n</site>`, SCAN_MAX_TOKENS)
  )
  if (emit) stream.on('text', (_delta, snapshot) => emit(snapshot))
  const message = await stream.finalMessage()
  checkStop(message)
  return toIcp(JSON.parse(finalText(message)) as Record<string, unknown>)
}

/** Infers the ICP from site text. Streams findings/partials via callbacks; retries once on bad output. */
export async function scanIcp(siteText: string, cb: ScanCallbacks): Promise<Icp> {
  try {
    return await scanAttempt(siteText, snapshotEmitter(cb))
  } catch (err) {
    if (!(err instanceof ScanError && (err.code === 'invalid' || err.code === 'truncated')) && !(err instanceof SyntaxError)) {
      throw err
    }
    safeWarn('[free-leads/scan] retrying after bad output', String(err))
    return scanAttempt(siteText, null)
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
      return { icp: toIcp(raw), note }
    } catch (err) {
      const retryable = (err instanceof ScanError && err.code !== 'refusal' && err.code !== 'not_configured') || err instanceof SyntaxError
      if (!retryable || attempt >= 1) throw err
      safeWarn('[free-leads/refine] retrying after bad output', String(err))
    }
  }
}
