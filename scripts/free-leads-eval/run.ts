/* eslint-disable no-console -- CLI eval: stdout is the report */
/**
 * Free-leads ICP-fit eval: website -> scan (real code path) -> ICP -> count -> pull N leads
 * -> LLM judge (0-3 "likely buyer of this business") -> MillionVerifier on every email.
 *
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/free-leads-eval/run.ts --tag baseline
 *   ... --tag v2 --compare baseline          # prints before/after
 *   ... --tag sonnet --model claude-sonnet-5-5 --effort low
 *   ... --report-only --tag v2 --compare baseline
 *
 * Caching (scripts/free-leads-eval/.cache, gitignored, holds PII):
 *   scans per tag; pulls per filter hash (a rerun with unchanged filters costs 0 credits);
 *   judge per (domain, leads); MillionVerifier per email.
 * Output: results/<tag>.json (aggregates + titles/companies/scores; no names or emails).
 * Needs MILLIONVERIFIER_API_KEY (env or ~/vendhub-location-registry/.env.local).
 */
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { fetchSite, normalizeSiteUrl } from '@/lib/free-leads/site'
import { scanIcp, type ModelChoice } from '@/lib/free-leads/scan'
import { filtersHash, icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { usableContacts } from '@/lib/free-leads/rules'
import { FIT_MODEL, OVERPULL_FACTOR, scoreLeads, selectFitLeads, type LeadFit } from '@/lib/free-leads/lead-fit'
import { countContacts, searchContacts, type GetLeadsContact } from '@/lib/getleads/client'
import type { Finding, Icp } from '@/lib/free-leads/contract'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.cache')
const RESULTS = join(HERE, 'results')

const { values: args } = parseArgs({
  options: {
    tag: { type: 'string', default: 'baseline' },
    compare: { type: 'string' },
    limit: { type: 'string', default: '10' },
    'max-credits': { type: 'string', default: '260' },
    model: { type: 'string' },
    effort: { type: 'string' },
    sites: { type: 'string' },
    'report-only': { type: 'boolean', default: false },
    'no-pull': { type: 'boolean', default: false },
    concurrency: { type: 'string', default: '4' },
  },
})

// Prices (2026-09-30): Claude per MTok; lead credits $97 / 10,000;
const PRICE: Record<string, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  'claude-opus-5-5': { in: 4, out: 20, cacheRead: 0.2, cacheWrite: 5 },
  'claude-sonnet-5-5': { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-haiku-4-5': { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
}
const CREDIT_USD = 97 / 10_000
const JUDGE_MODEL = 'claude-opus-5-5'

function usd(model: string, u: Anthropic.Usage): number {
  const p = PRICE[model.replace(/-\d{8}$/, '')] ?? PRICE['claude-opus-5-5']
  return (
    (u.input_tokens * p.in +
      u.output_tokens * p.out +
      (u.cache_read_input_tokens ?? 0) * p.cacheRead +
      (u.cache_creation_input_tokens ?? 0) * p.cacheWrite) /
    1e6
  )
}

function readJson<T>(path: string): T | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : null
}
function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 1))
}
const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)

function envFileValue(path: string, key: string): string | undefined {
  if (!existsSync(path)) return undefined
  const line = readFileSync(path, 'utf8').split('\n').find((l) => l.startsWith(`${key}=`))
  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '')
}
const MV_KEY =
  process.env.MILLIONVERIFIER_API_KEY ?? envFileValue(join(homedir(), 'vendhub-location-registry/.env.local'), 'MILLIONVERIFIER_API_KEY')

// ---------------------------------------------------------------------------

interface Site {
  vertical: string
  url: string
  note?: string
}

interface ScanRecord {
  domain: string
  ok: boolean
  error?: string
  source?: 'direct' | 'crawler'
  site_title?: string | null
  site_description?: string | null
  site_text?: string
  text_len?: number
  fetch_ms?: number
  first_finding_ms?: number | null
  icp_ms?: number
  model?: string
  usage?: Anthropic.Usage[]
  claude_usd?: number
  findings?: Finding[]
  icp?: Icp
  total?: number | null
  count_ms?: number
}

async function scanSite(site: Site, choice: ModelChoice): Promise<ScanRecord> {
  const url = normalizeSiteUrl(site.url)
  const domain = site.url
  if (!url) return { domain, ok: false, error: 'invalid url' }
  const t0 = Date.now()
  let content
  try {
    content = await fetchSite(url)
  } catch (err) {
    return { domain, ok: false, error: `unreachable: ${String(err)}` }
  }
  const fetchMs = Date.now() - t0
  const findings: Finding[] = []
  const usage: Anthropic.Usage[] = []
  let model = choice.model ?? 'claude-opus-5-5'
  let firstFinding: number | null = null
  const source = [content.title, content.description, content.text].filter(Boolean).join('\n\n')
  const t1 = Date.now()
  const icp = await scanIcp(
    source,
    {
      onFinding: (f) => {
        firstFinding ??= Date.now() - t1
        findings.push(f)
      },
      onIcpPartial: () => undefined,
      onUsage: (u, m) => {
        usage.push(u)
        model = m
      },
    },
    choice
  )
  const icpMs = Date.now() - t1
  const t2 = Date.now()
  const total = await countContacts(icpToFilters(icp)).catch((err: unknown) => {
    console.warn(`  count failed for ${domain}: ${String(err)}`)
    return null
  })
  return {
    domain,
    ok: true,
    source: content.source,
    site_title: content.title,
    site_description: content.description,
    site_text: content.text.slice(0, 5000),
    text_len: content.text.length,
    fetch_ms: fetchMs,
    first_finding_ms: firstFinding,
    icp_ms: icpMs,
    model,
    usage,
    claude_usd: usage.reduce((s, u) => s + usd(model, u), 0),
    findings,
    icp,
    total,
    count_ms: Date.now() - t2,
  }
}

// ---------------------------------------------------------------------------

let creditsSpent = 0
const maxCredits = Number(args['max-credits'])

async function pull(icp: Icp, limit: number, knownFile?: string): Promise<{ contacts: GetLeadsContact[]; credits: number; cached: boolean; file: string }> {
  const filters = icpToFilters(icp)
  const file = knownFile && existsSync(join(CACHE, 'pulls', knownFile)) ? knownFile : `${filtersHash(filters)}-${limit}.json`
  const path = join(CACHE, 'pulls', file)
  const hit = readJson<{ contacts: GetLeadsContact[] }>(path)
  if (hit) return { contacts: hit.contacts, credits: hit.contacts.length, cached: true, file }
  if (args['no-pull']) return { contacts: [], credits: 0, cached: false, file }
  if (creditsSpent + limit > maxCredits) throw new Error(`credit budget ${maxCredits} would be exceeded`)
  creditsSpent += limit // reserve before the request (concurrent sites)
  const { contacts } = await searchContacts(filters, { limit })
  creditsSpent -= limit - contacts.length
  writeJson(path, { filters, contacts, pulled_at: new Date().toISOString() })
  return { contacts, credits: contacts.length, cached: false, file }
}

// ---------------------------------------------------------------------------

interface Judgement {
  score: number
  reason: string
}

const JUDGE_SYSTEM = `You grade B2B lead lists. You are shown a seller (from its own website) and a list of people.
For each person, score 0-3: how likely is this person to buy, or decide on buying, what this seller sells?
3 = clearly the right buyer: right role at the kind of organization this seller serves.
2 = plausible buyer: right kind of organization and a role that could buy or strongly influence the purchase.
1 = weak: tangential role, wrong segment or size, or only a generic consumer who might happen to buy.
0 = wrong: an organization that would not buy this, a competitor, or a role with no buying influence.
If the seller mainly sells to consumers, a person scores 2+ only if they are a plausible business buyer or partner (for example a local employer buying a benefit, or a referral partner); otherwise 1 at most.
Reasons: one short sentence naming the deciding factor.`

const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['leads'],
  properties: {
    leads: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['i', 'score', 'reason'],
        properties: { i: { type: 'integer' }, score: { type: 'integer', enum: [0, 1, 2, 3] }, reason: { type: 'string' } },
      },
    },
  },
}

export function leadLine(c: GetLeadsContact, i: number): string {
  const loc = [c.person_city, c.state_name, c.person_country_name].filter(Boolean).join(', ')
  return `${i}. ${c.job_title || '(no title)'} at ${c.org_company_name || '(no company)'} | industry: ${c.org_industry_linkedin || '?'} | size: ${c.employee_count_range || '?'} | ${loc || '?'}`
}

const anthropic = new Anthropic({ maxRetries: 3 })

async function judge(scan: ScanRecord, contacts: GetLeadsContact[]): Promise<{ scores: Judgement[]; usd: number }> {
  const key = sha(`${scan.domain}|${JUDGE_MODEL}|${contacts.map((c) => c.email_address).join(',')}`)
  const path = join(CACHE, 'judge', `${scan.domain}-${key}.json`)
  const hit = readJson<{ scores: Judgement[]; usd: number }>(path)
  if (hit) return hit
  const seller = `Seller website: ${scan.domain}\nTitle: ${scan.site_title ?? ''}\nDescription: ${scan.site_description ?? ''}\n\nSite text (excerpt):\n${(scan.site_text ?? '').slice(0, 4000)}`
  const msg = await anthropic.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 4000,
    system: JUDGE_SYSTEM,
    messages: [{ role: 'user', content: `<seller>\n${seller}\n</seller>\n\n<people>\n${contacts.map((c, i) => leadLine(c, i + 1)).join('\n')}\n</people>` }],
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: JUDGE_SCHEMA } },
  } as Anthropic.MessageCreateParamsNonStreaming)
  if (msg.stop_reason !== 'end_turn') throw new Error(`judge stop_reason ${msg.stop_reason}`)
  const text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('')
  const parsed = JSON.parse(text) as { leads: Array<{ i: number; score: number; reason: string }> }
  const scores = contacts.map((_, i) => {
    const row = parsed.leads.find((l) => l.i === i + 1)
    if (!row) throw new Error(`judge skipped lead ${i + 1} for ${scan.domain}`)
    return { score: row.score, reason: row.reason }
  })
  const out = { scores, usd: usd(JUDGE_MODEL, msg.usage) }
  writeJson(path, out)
  return out
}

// ---------------------------------------------------------------------------

const mvPath = join(CACHE, 'mv.json')
const mvCache: Record<string, string> = readJson(mvPath) ?? {}

async function verify(email: string): Promise<string> {
  const e = email.trim().toLowerCase()
  if (mvCache[e]) return mvCache[e]
  if (!MV_KEY) throw new Error('MILLIONVERIFIER_API_KEY missing')
  const res = await fetch(`https://api.millionverifier.com/api/v3/?api=${MV_KEY}&email=${encodeURIComponent(e)}&timeout=20`)
  const body = (await res.json()) as { result?: string; error?: string }
  if (!body.result) throw new Error(`MillionVerifier: ${body.error ?? res.status}`)
  mvCache[e] = body.result
  writeJson(mvPath, mvCache)
  return body.result
}

// ---------------------------------------------------------------------------

interface SiteResult {
  vertical: string
  note?: string
  domain: string
  ok: boolean
  error?: string
  source?: string
  first_finding_ms?: number | null
  icp_ms?: number
  fetch_ms?: number
  count_ms?: number
  claude_usd?: number
  judge_usd?: number
  icp?: Icp
  total?: number | null
  credits?: number
  pull_cached?: boolean
  /** .cache/pulls file: filter hashes change when the ICP->filter mapping changes. */
  pull_file?: string
  leads: Array<{
    title: string
    company: string
    industry: string
    size: string
    location: string
    score: number
    reason: string
    mv: string
    fit_cheap?: number | null
    why?: string | null
    shown?: boolean
  }>
}

/** Production fit check (lead-fit.ts), ICP-only context, cached per (domain, leads, model). */
async function cheapFit(scan: ScanRecord, contacts: GetLeadsContact[]): Promise<LeadFit[] | null> {
  if (!contacts.length || !scan.icp) return []
  const key = sha(`${scan.domain}|${FIT_MODEL}|${JSON.stringify(scan.icp)}|${contacts.map((c) => c.email_address).join(',')}`)
  const path = join(CACHE, 'fit', `${scan.domain}-${key}.json`)
  const hit = readJson<{ fits: LeadFit[] | null }>(path)
  if (hit) return hit.fits
  const fits = await scoreLeads(scan.icp, scan.domain, contacts)
  if (fits) writeJson(path, { fits })
  return fits
}

let prior: Record<string, string> | null = null
/** Pull file a previous run of this tag used (filter hashes move when the ICP->filter mapping changes). */
function priorPullFile(domain: string): string | undefined {
  prior ??= Object.fromEntries(
    (readJson<SiteResult[]>(join(RESULTS, `${args.tag}.json`)) ?? []).filter((r) => r.pull_file).map((r) => [r.domain, r.pull_file as string])
  )
  return prior[domain]
}

async function runSite(site: Site, choice: ModelChoice, limit: number): Promise<SiteResult> {
  const scanPath = join(CACHE, 'scans', args.tag!, `${site.url}.json`)
  let scan = readJson<ScanRecord>(scanPath)
  if (!scan) {
    scan = await scanSite(site, choice).catch((err: unknown) => ({ domain: site.url, ok: false, error: String(err) }) as ScanRecord)
    writeJson(scanPath, scan)
  }
  const base = { vertical: site.vertical, note: site.note, domain: site.url, ok: scan.ok, error: scan.error, leads: [] }
  if (!scan.ok || !scan.icp) return base
  const { contacts: raw, credits, cached, file } = await pull(scan.icp, limit, priorPullFile(site.url))
  const contacts = usableContacts(raw, limit)
  const { scores, usd: judgeUsd } = contacts.length ? await judge(scan, contacts) : { scores: [], usd: 0 }
  const fits = await cheapFit(scan, contacts)
  // Production shows the best 1/OVERPULL_FACTOR of what it pulls (25 of 35); simulate on this pull.
  const shown = new Set(selectFitLeads(contacts.map((_, k) => k), fits, Math.round(contacts.length / OVERPULL_FACTOR)).map((x) => x.item))
  const mv = await Promise.all(contacts.map((c) => verify(c.email_address)))
  return {
    ...base,
    source: scan.source,
    first_finding_ms: scan.first_finding_ms,
    icp_ms: scan.icp_ms,
    fetch_ms: scan.fetch_ms,
    count_ms: scan.count_ms,
    claude_usd: scan.claude_usd,
    judge_usd: judgeUsd,
    icp: scan.icp,
    total: scan.total,
    credits,
    pull_cached: cached,
    pull_file: file,
    leads: contacts.map((c, i) => ({
      title: c.job_title,
      company: c.org_company_name,
      industry: c.org_industry_linkedin,
      size: c.employee_count_range,
      location: [c.person_city, c.state_name].filter(Boolean).join(', '),
      score: scores[i].score,
      reason: scores[i].reason,
      mv: mv[i],
      fit_cheap: fits?.[i]?.score ?? null,
      why: fits?.[i]?.why ?? null,
      shown: shown.has(i),
    })),
  }
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i])
        const r = out[i] as unknown as SiteResult
        console.log(`  ${r.ok ? 'ok ' : 'ERR'} ${r.domain} ${r.ok ? `fit=${mean(r.leads.map((l) => l.score)).toFixed(2)} n=${r.leads.length} total=${r.total}` : r.error}`)
      }
    })
  )
  return out
}

// ---------------------------------------------------------------------------

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '-')
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)] : 0
}

interface Row {
  group: string
  sites: number
  leads: number
  fit: number
  good: number
  zero: number
  ok: number
  catchAll: number
  invalid: number
  other: number
  credits: number
  usd: number
  empty: number
  shownFit: number
  shownGood: number
  shownN: number
}

function aggregate(group: string, rs: SiteResult[]): Row {
  const ls = rs.flatMap((r) => r.leads)
  const credits = rs.reduce((s, r) => s + (r.credits ?? 0), 0)
  return {
    group,
    sites: rs.length,
    leads: ls.length,
    fit: mean(ls.map((l) => l.score)),
    good: ls.filter((l) => l.score >= 2).length,
    zero: ls.filter((l) => l.score === 0).length,
    ok: ls.filter((l) => l.mv === 'ok').length,
    catchAll: ls.filter((l) => l.mv === 'catch_all').length,
    invalid: ls.filter((l) => l.mv === 'invalid').length,
    other: ls.filter((l) => !['ok', 'catch_all', 'invalid'].includes(l.mv)).length,
    credits,
    usd: rs.reduce((s, r) => s + (r.claude_usd ?? 0), 0) + credits * CREDIT_USD,
    empty: rs.filter((r) => r.ok && r.leads.length === 0).length,
    shownFit: mean(ls.filter((l) => l.shown).map((l) => l.score)),
    shownGood: ls.filter((l) => l.shown && l.score >= 2).length,
    shownN: ls.filter((l) => l.shown).length,
  }
}

function scorecard(results: SiteResult[]): Row[] {
  const verticals = [...new Set(results.map((r) => r.vertical))]
  return [...verticals.map((v) => aggregate(v, results.filter((r) => r.vertical === v))), aggregate('ALL', results)]
}

function table(rows: Row[], before?: Row[]): string {
  const delta = (g: string, k: keyof Row, now: number, digits = 2) => {
    const b = before?.find((r) => r.group === g)
    if (!b) return now.toFixed(digits)
    const d = now - (b[k] as number)
    return `${now.toFixed(digits)} (${d >= 0 ? '+' : ''}${d.toFixed(digits)})`
  }
  const head = '| vertical | sites | leads | mean fit 0-3 | fit >= 2 | fit 0 | shown fit (best 70%) | shown fit >= 2 | MV ok / catch-all / invalid / other | credits | $ scan+credits |\n|---|---|---|---|---|---|---|---|---|---|---|'
  const body = rows.map(
    (r) =>
      `| ${r.group} | ${r.sites} | ${r.leads} | ${delta(r.group, 'fit', r.fit)} | ${pct(r.good, r.leads)} | ${pct(r.zero, r.leads)} | ${delta(r.group, 'shownFit', r.shownFit)} | ${pct(r.shownGood, r.shownN)} | ${r.ok} / ${r.catchAll} / ${r.invalid} / ${r.other} | ${r.credits} | $${r.usd.toFixed(2)} |`
  )
  return [head, ...body].join('\n')
}

function perSite(results: SiteResult[]): string {
  return results
    .map((r) => {
      if (!r.ok) return `- ${r.domain} (${r.vertical}): ERROR ${r.error}`
      const fit = mean(r.leads.map((l) => l.score)).toFixed(2)
      return `- ${r.domain} (${r.note ?? r.vertical}): fit ${fit}, n=${r.leads.length}, matches ${r.total ?? '?'}, icp ${r.icp_ms}ms, first finding ${r.first_finding_ms}ms, ${r.source}\n  ICP: ${r.icp?.summary} | ind: ${r.icp?.industries.join('; ')} | titles: ${r.icp?.job_titles.join('; ')} | size: ${r.icp?.company_size.join('; ')} | geo: ${[...(r.icp?.countries ?? []), ...(r.icp?.states ?? []), ...(r.icp?.cities ?? [])].join('; ')}\n  low: ${r.leads.filter((l) => l.score <= 1).slice(0, 3).map((l) => `${l.title} @ ${l.company} [${l.industry}] -> ${l.score}: ${l.reason}`).join(' || ') || 'none'}`
    })
    .join('\n')
}

function timings(results: SiteResult[]): string {
  const ok = results.filter((r) => r.ok)
  return `timings (median): fetch ${median(ok.map((r) => r.fetch_ms ?? 0))}ms, first finding after fetch ${median(ok.map((r) => r.first_finding_ms ?? 0))}ms, ICP after fetch ${median(ok.map((r) => r.icp_ms ?? 0))}ms, count ${median(ok.map((r) => r.count_ms ?? 0))}ms; crawler used ${ok.filter((r) => r.source === 'crawler').length}/${ok.length}; scan $ median ${median(ok.map((r) => r.claude_usd ?? 0)).toFixed(4)}`
}

async function main(): Promise<void> {
  const resultPath = join(RESULTS, `${args.tag}.json`)
  let results: SiteResult[]
  if (args['report-only']) {
    results = readJson<SiteResult[]>(resultPath) ?? []
  } else {
    const all = readJson<Site[]>(join(HERE, 'sites.json')) ?? []
    const only = args.sites ? new Set(args.sites.split(',')) : null
    const sites = only ? all.filter((s) => only.has(s.url)) : all
    const choice: ModelChoice = { model: args.model, effort: args.effort as ModelChoice['effort'] }
    console.log(`eval ${args.tag}: ${sites.length} sites, ${args.limit} leads each, budget ${maxCredits} credits`)
    results = await pool(sites, Number(args.concurrency), (s) =>
      runSite(s, choice, Number(args.limit)).catch((err: unknown) => ({ vertical: s.vertical, note: s.note, domain: s.url, ok: false, error: String(err), leads: [] }))
    )
    writeJson(resultPath, results)
    console.log(`credits spent this run: ${creditsSpent}`)
  }
  const before = args.compare ? readJson<SiteResult[]>(join(RESULTS, `${args.compare}.json`)) : null
  console.log(`\n## ${args.tag}${before ? ` vs ${args.compare}` : ''}\n`)
  console.log(table(scorecard(results), before ? scorecard(before) : undefined))
  console.log(`\n${timings(results)}\n`)
  console.log(perSite(results))
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
