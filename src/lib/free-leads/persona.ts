/**
 * One believable, fictional buyer persona drawn from the ICP ("Dana, VP Operations at a 12-property
 * student-housing operator in Austin"). One Sonnet call, low effort, cached with the scan.
 * Same client setup and structured-output pattern as scan.ts; output is parsed with zod, never cast.
 */
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { safeWarn } from '@/lib/utils/log-sanitizer'
import type { Icp, Persona } from './contract'

const MODEL = 'claude-sonnet-5-5'
const MAX_TOKENS = 1_200
const SITE_CHARS = 3_000

export class PersonaError extends Error {
  constructor(message: string, readonly code: 'refusal' | 'truncated' | 'invalid' | 'not_configured') {
    super(message)
    this.name = 'PersonaError'
  }
}

const SYSTEM = `You write one fictional person: a believable buyer, as a colleague would describe her to you over coffee.
You get a description of the kind of people who buy in some market. Invent one decision maker who fits it: her job title, the size and kind of company and its place must match the titles, industries, company size and locations given.

Fields. The limits are hard: count characters and stay at least 15% under each one, especially replies_when and company.
- name: a fictional first name only, max 20 characters. Never a real public figure.
- role: her job title, max 60 characters.
- company: one short phrase describing her employer, max 90 characters (shorter is better), e.g. "a 12-property student-housing operator in Austin". Describe the kind of company with a size and a place. Never use a real company name.
- day: 2-3 sentences, max 320 characters. Her week as it actually goes: the recurring meetings, the tools she opens, the numbers she checks, the one task that always runs over.
- measured_on: 2-3 items, each max 70 characters. What her boss or board judges her on, with a number or target where it fits.
- replies_when: 1-2 sentences, max 220 characters. What makes her answer a cold message from a stranger, and what makes her ignore it.

Style:
- Plain, specific, concrete. Name numbers, tools, the real meetings and the real annoyances of that job.
- Sound like a person describing a colleague. Third person, present tense. Never sound like AI or marketing copy.
- Never use these words: leverage, streamline, synergy, fast-paced, navigate, landscape, juggling, seamless, robust, pain points.
- No em dashes, no en dashes, no exclamation marks, no emojis.
- Do not mention the seller, a product, data, leads or emails, except that replies_when may say what kind of message she answers.
- Do not claim to be real. Do not add a disclaimer.

Examples of the style (a different persona, for tone only). Do not copy their wording or sentence shapes; vary how each field opens.
day, good: "Mondays she walks the three buildings with the maintenance lead, then spends the afternoon on the occupancy report her regional VP wants by 4. Work orders older than five days are what she gets asked about."
day, bad: "She juggles a fast-paced portfolio and leverages technology to streamline operations across the landscape."
replies_when, good: "If the first line is about her own renewals or vacancy numbers she reads on. She answers on her phone between property tours, so anything she can reply to in one line gets a reply."
replies_when, bad: "She is open to innovative solutions that drive synergy and value for her team!"`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'role', 'company', 'day', 'measured_on', 'replies_when'],
  properties: {
    name: { type: 'string' },
    role: { type: 'string' },
    company: { type: 'string' },
    day: { type: 'string' },
    measured_on: { type: 'array', items: { type: 'string' } },
    replies_when: { type: 'string' },
  },
}

const PersonaSchema = z.object({
  name: z.string().min(1).max(20),
  role: z.string().min(1).max(60),
  company: z.string().min(1).max(90),
  day: z.string().min(1).max(320),
  measured_on: z.array(z.string().min(1).max(70)).min(2).max(3),
  replies_when: z.string().min(1).max(220),
})

/** Em/en dashes become commas, emojis and exclamation marks go. */
export function cleanText(s: string): string {
  return s
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/[\p{Extended_Pictographic}‍️]/gu, '')
    .replace(/!/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Parses model JSON into a Persona; throws PersonaError('invalid') on anything off-contract. */
export function parsePersona(text: string): Persona {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new PersonaError('Persona output was not JSON', 'invalid')
  }
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const clean = (v: unknown) => (typeof v === 'string' ? cleanText(v) : v)
  const parsed = PersonaSchema.safeParse({
    name: clean(o.name),
    role: clean(o.role),
    company: clean(o.company),
    day: clean(o.day),
    measured_on: Array.isArray(o.measured_on) ? o.measured_on.map(clean) : o.measured_on,
    replies_when: clean(o.replies_when),
  })
  if (!parsed.success) throw new PersonaError(`Persona failed validation: ${parsed.error.message.slice(0, 200)}`, 'invalid')
  return parsed.data
}

/** Models default to the same few names; a random initial spreads them out. */
const LETTERS = 'ABCDEGHJKLMNPRSTW'
const pickLetter = () => LETTERS[Math.floor(Math.random() * LETTERS.length)]

export function personaBrief(icp: Icp, siteText: string | null, letter: string = pickLetter()): string {
  const geo = [...(icp.cities ?? []), ...icp.states, ...icp.countries].join(', ')
  const lines = [
    `Who buys: ${icp.summary}`,
    icp.industries.length ? `Industries: ${icp.industries.join(', ')}` : null,
    icp.job_titles.length ? `Titles: ${icp.job_titles.join(', ')}` : null,
    icp.seniority.length ? `Seniority: ${icp.seniority.join(', ')}` : null,
    icp.company_size.length ? `Company size: ${icp.company_size.join(', ')} employees` : null,
    geo ? `Where: ${geo}` : null,
  ]
  const site = siteText?.trim() ? `\n\nBackground on the market (may be noisy):\n<site>\n${siteText.trim().slice(0, SITE_CHARS)}\n</site>` : ''
  return `${lines.filter(Boolean).join('\n')}\nFirst name starts with the letter ${letter}.${site}`
}

let client: Anthropic | null = null
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new PersonaError('ANTHROPIC_API_KEY missing', 'not_configured')
  client ??= new Anthropic({ maxRetries: 1, timeout: 30_000 })
  return client
}

async function attempt(icp: Icp, siteText: string | null, onUsage?: PersonaOpts['onUsage']): Promise<Persona> {
  const message = await anthropic().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: personaBrief(icp, siteText) }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
  } as Anthropic.MessageCreateParamsNonStreaming)
  onUsage?.(message.usage, message.model)
  if (message.stop_reason === 'refusal') throw new PersonaError('Model declined the request', 'refusal')
  if (message.stop_reason === 'max_tokens') throw new PersonaError('Model output truncated', 'truncated')
  return parsePersona(message.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join(''))
}

export interface PersonaOpts {
  /** Token usage of each model call (cost accounting). */
  onUsage?: (usage: Anthropic.Usage, model: string) => void
}

/** Generates one fictional buyer for the ICP. Retries once on bad output; throws PersonaError on failure. */
export async function generatePersona(icp: Icp, siteText: string | null, opts: PersonaOpts = {}): Promise<Persona> {
  try {
    return await attempt(icp, siteText, opts.onUsage)
  } catch (err) {
    if (!(err instanceof PersonaError && (err.code === 'invalid' || err.code === 'truncated'))) throw err
    safeWarn('[free-leads/persona] retrying after bad output', String(err))
    return attempt(icp, siteText, opts.onUsage)
  }
}
