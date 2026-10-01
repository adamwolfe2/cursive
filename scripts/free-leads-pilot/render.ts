/**
 * Pure parts of the free-leads email pilot: copy templates, buyer masking, CSV, credit budget.
 * Copy and its rules: .claude/specs/2026-09-30-free-leads-email-pilot.md. Self-check: render.check.ts.
 */
import type { GetLeadsContact } from '@/lib/getleads/client'

export const START_BASE = 'https://leads.meetcursive.com/start'
export const MIN_MATCHES = 25
export const BUYER_COUNT = 3

/**
 * Bare link on purpose: a tracking query reads like a campaign, not a note. Clicks are measured by
 * joining free_lead_sessions.domain to the pilot list (the replayed scan records the domain).
 */
export function startUrl(domain: string): string {
  return `${START_BASE}?site=${encodeURIComponent(domain)}`
}

const FOOTER = `--
Cursive, {sender_address}
If you would rather not hear from me, reply "no" and I will not email you again.`

export interface Step {
  day: number
  /** Empty = reply in the same thread (EmailBison keeps the first subject). */
  subjects: string[]
  body: string
}

export const STEPS: Step[] = [
  {
    day: 0,
    subjects: ['who buys from {company}', 'a list for {company}'],
    body: `Hi {first_name},

I pointed a tool we built at {domain} to see who it thinks buys from you. Its read:

{icp_sentence}

We found {match_count} people who match. Three of them:

{buyer_1}
Why: {buyer_1_why}

{buyer_2}
Why: {buyer_2_why}

{buyer_3}
Why: {buyer_3_why}

If that read is close, the first 25 are free, with names and work emails. No card, no call:
{start_url_1}

If it is off, the same page lets you edit who we look for before you claim anything.

Adam
${FOOTER}`,
  },
  {
    day: 3,
    subjects: [''],
    body: `Hi {first_name},

One thing I left out. The {match_count} is a starting point, not a fixed list. On the page you can type a change in plain words, like "only companies over 50 people" or "add heads of finance", and the count updates as you go. You also see five sample people, names partly hidden, before you give us an email.

If my read of {company} was wrong, that is the quickest way to tell me:
{start_url_2}

Adam
${FOOTER}`,
  },
  {
    day: 7,
    subjects: [''],
    body: `Hi {first_name},

In my experience the list is the easy part. Writing a first message that does not read like a template, 25 times a week, is the slow part.

We do that part too: we write and send LinkedIn messages to people like {buyer_1_short} from my first note, and you only take the replies.

The free 25 are still the place to start, so you can judge the people before you judge the messages:
{start_url_3}

Adam
${FOOTER}`,
  },
  {
    day: 12,
    subjects: [''],
    body: `Hi {first_name},

Last note from me on this.

If outbound is not your job at {company}, who should I send this to? A name is plenty.

If it is just timing, the link keeps working and pulls fresh people when you claim:
{start_url_4}

Adam
${FOOTER}`,
  },
]

/** Fills `{field}`; throws on any field the map lacks, so a broken merge never reaches the CSV. */
export function fill(template: string, fields: Record<string, string>): string {
  return template.replace(/\{([a-z0-9_]+)\}/g, (_m, key: string) => {
    if (!(key in fields)) throw new Error(`missing merge field {${key}}`)
    return fields[key]
  })
}

// ---------------------------------------------------------------------------
// Buyer masking: first name + last initial, title, company DESCRIBED (never named).
// ---------------------------------------------------------------------------

const cap = (s: string) => s.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase())

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Removes the company name and domain from free text (titles like "CEO, Acme"; why lines that name it). */
export function scrubCompany(text: string, c: Pick<GetLeadsContact, 'org_company_name' | 'org_domain'>): string {
  let out = text
  for (const needle of [c.org_company_name, c.org_domain, c.org_domain.replace(/\.[a-z.]+$/i, '')]) {
    const n = needle.trim()
    if (n.length >= 3) out = out.replace(new RegExp(escapeRe(n), 'gi'), 'their company')
  }
  return out.replace(/\s*[—–]\s*/g, ', ').replace(/!/g, '.').trim()
}

export function describeCompany(c: GetLeadsContact): string {
  const size = c.employee_count_range.replace(/\s*to\s*/i, '-').replace(/\s+/g, '')
  const industry = c.org_industry_linkedin.toLowerCase().trim()
  const place = [c.person_city ? cap(c.person_city) : '', c.state_name || c.person_country_name].filter(Boolean).join(', ')
  const kind = [size ? `${size} person` : '', industry || 'company'].filter(Boolean).join(' ')
  const noun = industry && !/company|firm|agency|practice|group/.test(industry) ? `${kind} company` : kind
  const article = /^[aeiou8]/i.test(noun) || /^(11|18)\b/.test(noun) ? 'an' : 'a'
  return `${article} ${noun}${place ? ` in ${place}` : ''}`
}

export interface MaskedBuyer {
  line: string
  why: string
  short: string
}

export function maskBuyer(c: GetLeadsContact, why: string | null): MaskedBuyer {
  const first = cap(c.first_name.trim().split(/\s+/)[0] ?? '')
  const initial = c.last_name.trim() ? `${c.last_name.trim()[0].toUpperCase()}.` : ''
  const short = [first, initial].filter(Boolean).join(' ') || 'one of them'
  // "VP Ops, Acme" / "VP Ops at Acme" / "VP Ops | Acme": drop the trailing company, then scrub any left.
  const name = c.org_company_name.trim()
  const bare = name.length >= 3 ? c.job_title.replace(new RegExp(`\\s*(,|@|\\||-|\\bat\\b)\\s*${escapeRe(name)}.*$`, 'i'), '') : c.job_title
  const title = scrubCompany(bare, c) || 'Decision maker'
  return {
    line: `${short}, ${title} at ${describeCompany(c)}`,
    why: why ? scrubCompany(why, c) : 'Matches the roles and company type above.',
    short,
  }
}

export function placeholderBuyer(n: number): MaskedBuyer {
  return { line: `[buyer ${n}: filled by --spend]`, why: `[why ${n}: filled by --spend]`, short: `[buyer 1 first name]` }
}

// ---------------------------------------------------------------------------
// Rendering one prospect
// ---------------------------------------------------------------------------

export interface Prospect {
  domain: string
  first_name: string
  last_name: string
  email: string
  company: string
}

export interface RenderInput {
  prospect: Prospect
  /** siteDomain() of the scanned URL: the exact key /start?site= replays. */
  siteDomain: string
  icpSentence: string
  matchCount: number | null
  buyers: MaskedBuyer[]
  senderAddress: string
}

export function mergeFields(r: RenderInput): Record<string, string> {
  const b = (n: number) => r.buyers[n - 1] ?? placeholderBuyer(n)
  return {
    email: r.prospect.email.trim().toLowerCase(),
    first_name: cap(r.prospect.first_name.trim()),
    last_name: cap(r.prospect.last_name.trim()),
    company: r.prospect.company.trim(),
    domain: r.siteDomain,
    icp_sentence: r.icpSentence.trim(),
    match_count: r.matchCount === null ? '[count: run with --count]' : r.matchCount.toLocaleString('en-US'),
    ...Object.fromEntries([1, 2, 3].flatMap((n) => [[`buyer_${n}`, b(n).line], [`buyer_${n}_why`, b(n).why]])),
    buyer_1_short: b(1).short,
    ...Object.fromEntries(STEPS.map((_, k) => [`start_url_${k + 1}`, startUrl(r.siteDomain)])),
    sender_address: r.senderAddress,
  }
}

export interface RenderedStep {
  day: number
  subjects: string[]
  body: string
}

export function renderSteps(fields: Record<string, string>): RenderedStep[] {
  return STEPS.map((s) => ({ day: s.day, subjects: s.subjects.map((t) => fill(t, fields)), body: fill(s.body, fields) }))
}

/** Words of email 1 a reader has to get through, excluding the buyer lines and the legal footer. */
export function email1Words(body: string, fields: Record<string, string>): number {
  let text = body.split('\n--\n')[0]
  for (const n of [1, 2, 3]) text = text.replace(fields[`buyer_${n}`], '').replace(`Why: ${fields[`buyer_${n}_why`]}`, '')
  return text.split(/\s+/).filter(Boolean).length
}

// ---------------------------------------------------------------------------
// CSV + credit budget
// ---------------------------------------------------------------------------

export function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: Array<Record<string, string | number>>): string {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c] ?? '')).join(','))].join('\n') + '\n'
}

/**
 * Hard cap on lead credits for one run. Reservation is synchronous, so concurrent workers can never
 * jointly pass the cap; a reservation is never released, because a sent paid request may be billed.
 */
export class CreditBudget {
  private reserved = 0
  constructor(readonly max: number) {}
  tryReserve(n: number): boolean {
    if (this.reserved + n > this.max) return false
    this.reserved += n
    return true
  }
  get used(): number {
    return this.reserved
  }
}
