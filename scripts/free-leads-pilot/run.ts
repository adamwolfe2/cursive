/* eslint-disable no-console -- CLI: stdout is the run report (domains and counts only, never names or emails) */
/**
 * Free-leads outbound email pilot: prospects CSV -> scan (real code path, shared scan cache so
 * /start?site= replays at $0) -> free count -> (with --spend) 5 preview rows + fit lines -> 3 masked
 * buyers -> 4 rendered emails per prospect. Nothing is sent. Spec: .claude/specs/2026-09-30-free-leads-email-pilot.md
 *
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/free-leads-pilot/run.ts --in prospects.csv
 *   ... --count                               # dry run + free match count (zero credits)
 *   ... --spend --max-credits 500             # buys 5 preview rows per new domain, hard-capped
 *   ... --address "Cursive Inc, 123 Main St, City, ST 00000"
 *
 * Dry run (default): no lead-database calls at all; buyer lines and count stay placeholders.
 * State per domain: scripts/free-leads-pilot/.out/state/<domain>.json (gitignored, holds PII).
 * A paid pull is marked `pending` on disk BEFORE the request; a pending/failed marker is never
 * retried automatically (the request may have been billed), so a domain is never bought twice.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { parse } from 'csv-parse/sync'
import { z } from 'zod'
import { normalizeSiteUrl, readSite, siteDomain } from '@/lib/free-leads/site'
import { scanIcp, SCAN_VERSION } from '@/lib/free-leads/scan'
import { icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { cacheGet, cachedCount, cachePut, HOUR_MS, previewRowsKey, previewWhyKey } from '@/lib/free-leads/cache'
import { companyDomain, isPersonalEmail, usableContacts } from '@/lib/free-leads/rules'
import { scoreLeads, selectFitLeads, type LeadFit } from '@/lib/free-leads/lead-fit'
import { claudeUsd, CREDIT_USD } from '@/lib/free-leads/cost'
import { PREVIEW_LEAD_COUNT, type Icp, type ScanEvent } from '@/lib/free-leads/contract'
import { searchContacts, type GetLeadsContact } from '@/lib/getleads/client'
import {
  BUYER_COUNT, CreditBudget, email1Words, maskBuyer, mergeFields, MIN_MATCHES, renderSteps, STEPS, toCsv,
  type MaskedBuyer, type Prospect,
} from './render'

const HERE = dirname(fileURLToPath(import.meta.url))

const { values: args } = parseArgs({
  options: {
    in: { type: 'string', default: join(HERE, 'prospects.example.csv') },
    out: { type: 'string', default: join(HERE, '.out') },
    count: { type: 'boolean', default: false },
    spend: { type: 'boolean', default: false },
    'max-credits': { type: 'string' },
    address: { type: 'string', default: '{sender_address}' },
  },
})

const CONCURRENCY = 3
// Mirrors src/app/api/start/scan/route.ts (scanKey, SCAN_TTL_MS, Replayable): the route does not
// export them. Keep in sync, or /start?site= will rescan instead of replaying this pre-scan.
const scanKey = (url: string) => `scan:${SCAN_VERSION}:${siteDomain(url)}`
const SCAN_TTL_MS = 7 * 24 * HOUR_MS
type Replayable = Exclude<ScanEvent, { type: 'count' } | { type: 'error' } | { type: 'done' } | { type: 'replay' }>
type CachedScan = { events: Replayable[]; scanned_at: string }
// Mirrors src/app/api/start/preview/route.ts TTL_MS + CachedRows: same key, so the prospect's own
// preview (and their delivery, which offsets past these rows) reuses what we bought.
const PREVIEW_TTL_MS = 24 * HOUR_MS
type CachedRows = { contacts: GetLeadsContact[]; total: number }

const ProspectSchema = z.object({
  domain: z.string().trim().min(3),
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().default(''),
  email: z.string().trim().email(),
  company: z.string().trim().min(1),
})

interface DomainState {
  domain: string
  scan?: CachedScan & { icp: Icp; usd: number }
  total?: number
  buy?: { status: 'pending' | 'done' | 'failed'; at: string; credits: number; contacts?: GetLeadsContact[]; fits?: LeadFit[] | null }
}

type Outcome =
  | { ok: true; prospect: Prospect; state: DomainState; buyers: MaskedBuyer[]; flags: string[] }
  | { ok: false; prospect: Prospect | null; reason: string }

const stateDir = join(resolve(args.out), 'state')
const statePath = (domain: string) => join(stateDir, `${domain.replace(/[^a-z0-9.-]/gi, '_')}.json`)
function loadState(domain: string): DomainState {
  const p = statePath(domain)
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as DomainState) : { domain }
}
function saveState(s: DomainState): void {
  writeFileSync(statePath(s.domain), JSON.stringify(s, null, 1))
}

let modelUsd = 0
const budget = new CreditBudget(args.spend ? Number(args['max-credits']) : 0)

/** Local state first, then the shared cache, then a real scan. Always leaves the shared cache warm. */
async function ensureScan(url: string, s: DomainState): Promise<Icp> {
  const shared = await cacheGet<CachedScan>(scanKey(url))
  const sharedIcp = shared?.events.find((e): e is Extract<Replayable, { type: 'icp' }> => e.type === 'icp')?.icp
  if (sharedIcp) {
    // The prospect will see the shared one; the email must quote the same profile.
    if (!s.scan || s.scan.scanned_at !== shared?.scanned_at) s.scan = { ...(shared as CachedScan), icp: sharedIcp, usd: 0 }
    return sharedIcp
  }
  if (s.scan) {
    await cachePut(scanKey(url), { events: s.scan.events, scanned_at: s.scan.scanned_at }, SCAN_TTL_MS)
    return s.scan.icp
  }
  const events: Replayable[] = []
  const record = (e: ScanEvent) => {
    if (e.type !== 'count' && e.type !== 'error' && e.type !== 'done' && e.type !== 'replay') events.push(e)
  }
  const site = await readSite(url, record)
  let usd = 0
  const icp = await scanIcp([site.title, site.description, site.text].filter(Boolean).join('\n\n'), {
    onFact: (fact) => record({ type: 'fact', fact }),
    onIcpPartial: (partial) => record({ type: 'icp_partial', icp: partial }),
    onUsage: (u, model) => (usd += claudeUsd(model, u)),
  })
  record({ type: 'icp', icp })
  modelUsd += usd
  const scanned_at = new Date().toISOString()
  await cachePut(scanKey(url), { events, scanned_at }, SCAN_TTL_MS)
  s.scan = { events, scanned_at, icp, usd }
  return icp
}

/** The preview route's purchase, with a disk marker and a hard cap. Returns null when skipped. */
async function ensureBuyers(icp: Icp, s: DomainState): Promise<{ contacts: GetLeadsContact[]; fits: LeadFit[] | null } | string> {
  if (s.buy?.status === 'done' && s.buy.contacts) return { contacts: s.buy.contacts, fits: s.buy.fits ?? null }
  if (s.buy) return `previous paid pull is "${s.buy.status}"; check billing, then delete .buy in its state file to retry`
  const filters = icpToFilters(icp)
  let rows = await cacheGet<CachedRows>(previewRowsKey(filters))
  let credits = 0
  if (!rows?.contacts) {
    if (!budget.tryReserve(PREVIEW_LEAD_COUNT)) return `credit cap reached (${budget.used}/${budget.max})`
    credits = PREVIEW_LEAD_COUNT
    s.buy = { status: 'pending', at: new Date().toISOString(), credits }
    saveState(s)
    try {
      const { contacts, totalAvailable } = await searchContacts(filters, { limit: PREVIEW_LEAD_COUNT })
      rows = { contacts, total: totalAvailable }
    } catch (err) {
      s.buy = { ...s.buy, status: 'failed' }
      saveState(s)
      throw err
    }
    await cachePut(previewRowsKey(filters), rows, PREVIEW_TTL_MS)
  }
  // Same call and cache as the preview route, so the prospect's preview shows the same why lines.
  const whyKey = previewWhyKey(filters, icp.summary)
  let fits = (await cacheGet<{ fits: LeadFit[] | null }>(whyKey))?.fits ?? null
  if (!fits) {
    fits = await scoreLeads(icp, 'the seller', rows.contacts, { onUsage: ({ usage, model }) => (modelUsd += claudeUsd(model, usage)) })
    if (fits) await cachePut(whyKey, { fits }, PREVIEW_TTL_MS)
  }
  s.buy = { status: 'done', at: new Date().toISOString(), credits, contacts: rows.contacts, fits }
  saveState(s)
  return { contacts: rows.contacts, fits }
}

function pickBuyers(contacts: GetLeadsContact[], fits: LeadFit[] | null): MaskedBuyer[] | string {
  const usable = usableContacts(contacts, PREVIEW_LEAD_COUNT)
  const usableFits = fits ? usable.map((c) => fits[contacts.indexOf(c)]) : null
  // Only rows the fit check rated plausible or better: a wrong buyer in a cold email embarrasses the prospect.
  const picked = selectFitLeads(usable, usableFits, PREVIEW_LEAD_COUNT).filter((r) => r.fit && r.fit.score >= 2)
  if (picked.length < BUYER_COUNT) return `only ${picked.length} buyers rated fit >= 2 (need ${BUYER_COUNT})`
  return picked.slice(0, BUYER_COUNT).map((r) => maskBuyer(r.item, r.fit?.why ?? null))
}

async function processProspect(prospect: Prospect): Promise<Outcome> {
  if (isPersonalEmail(prospect.email)) return { ok: false, prospect, reason: 'personal email' }
  const normalized = normalizeSiteUrl(prospect.domain)
  if (!normalized) return { ok: false, prospect, reason: 'unusable domain' }
  const url = `${new URL(normalized).origin}/` // same normalization as the scan route
  const domain = siteDomain(url)
  const flags: string[] = []
  if (companyDomain(prospect.email) !== domain.split('.').slice(-2).join('.')) flags.push('email domain differs from site domain')
  const s = loadState(domain)
  try {
    const icp = await ensureScan(url, s)
    saveState(s)
    if (args.count || args.spend) {
      s.total = await cachedCount(icpToFilters(icp))
      saveState(s)
      if (s.total < MIN_MATCHES) return { ok: false, prospect, reason: `count ${s.total} < ${MIN_MATCHES}` }
    }
    let buyers: MaskedBuyer[] = []
    if (args.spend) {
      const got = await ensureBuyers(icp, s)
      if (typeof got === 'string') return { ok: false, prospect, reason: got }
      const picked = pickBuyers(got.contacts, got.fits)
      if (typeof picked === 'string') return { ok: false, prospect, reason: picked }
      buyers = picked
      if (got.fits === null) flags.push('fit check unavailable; why lines are generic')
    }
    return { ok: true, prospect: { ...prospect, domain }, state: s, buyers, flags }
  } catch (err) {
    return { ok: false, prospect, reason: `failed: ${err instanceof Error ? err.message.slice(0, 160) : 'unknown error'}` }
  }
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const k = next++
      out[k] = await fn(items[k])
    }
  }))
  return out
}

function readProspects(path: string): { prospects: Prospect[]; invalid: number } {
  const rows = parse(readFileSync(path, 'utf8'), { columns: true, skip_empty_lines: true, trim: true }) as unknown[]
  const prospects: Prospect[] = []
  let invalid = 0
  for (const r of rows) {
    const p = ProspectSchema.safeParse(r)
    if (p.success) prospects.push(p.data)
    else invalid++
  }
  return { prospects, invalid }
}

/** One prospect per company: the second contact at a domain is skipped (one email thread per company). */
function dedupeByDomain(prospects: Prospect[]): { unique: Prospect[]; dupes: number } {
  const seen = new Set<string>()
  const unique = prospects.filter((p) => {
    const key = p.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return { unique, dupes: prospects.length - unique.length }
}

async function main(): Promise<void> {
  if (args.spend) {
    const max = Number(args['max-credits'])
    if (!Number.isInteger(max) || max <= 0) throw new Error('--spend requires --max-credits N (positive integer)')
  }
  mkdirSync(stateDir, { recursive: true })
  const { prospects, invalid } = readProspects(resolve(args.in))
  const { unique, dupes } = dedupeByDomain(prospects)
  const mode = args.spend ? `SPEND (cap ${budget.max} credits)` : args.count ? 'dry run + free count' : 'dry run'
  console.log(`[pilot] ${mode}: ${unique.length} prospects (${invalid} invalid rows, ${dupes} same-domain duplicates skipped)`)

  const outcomes = await pool(unique, CONCURRENCY, async (p) => {
    const o = await processProspect(p)
    console.log(`[pilot] ${o.ok ? o.prospect.domain : (o.prospect?.domain ?? '?')}: ${o.ok ? 'ready' : `skipped (${o.reason})`}`)
    return o
  })

  const csvRows: Array<Record<string, string | number>> = []
  const review: string[] = [`# Free-leads pilot review (${new Date().toISOString()}, ${mode})`, '']
  for (const o of outcomes) {
    if (!o.ok) {
      review.push(`## SKIPPED ${o.prospect?.domain ?? '?'}: ${o.reason}`, '')
      continue
    }
    const fields = mergeFields({
      prospect: o.prospect,
      siteDomain: o.prospect.domain,
      icpSentence: o.state.scan?.icp.summary ?? '',
      matchCount: o.state.total ?? null,
      buyers: o.buyers,
      senderAddress: args.address,
    })
    const steps = renderSteps(fields)
    const words = email1Words(steps[0].body, fields)
    const flags = [...o.flags]
    if (words > 120) flags.push(`email 1 is ${words} words`)
    if (/\[[^\]]*(--spend|--count)[^\]]*\]|\{sender_address\}/.test(steps.map((s) => s.body).join('\n'))) flags.push('placeholders left (dry run or no --address)')
    const row: Record<string, string | number> = { ...fields }
    steps.forEach((s, k) => {
      row[`day_${k + 1}`] = s.day
      s.subjects.forEach((subj, v) => (row[`subject_${k + 1}${s.subjects.length > 1 ? String.fromCharCode(97 + v) : ''}`] = subj))
      row[`body_${k + 1}`] = s.body
    })
    row.flags = flags.join('; ')
    csvRows.push(row)
    const icp = o.state.scan?.icp
    review.push(
      `## ${o.prospect.domain} (${o.prospect.company})`,
      `- ICP: ${icp?.summary}`,
      `- Filters: industries ${icp?.industries.join(', ') || '-'} | titles ${icp?.job_titles.join(', ') || '-'} | size ${icp?.company_size.join(', ') || '-'} | geo ${[...(icp?.cities ?? []), ...(icp?.states ?? []), ...(icp?.countries ?? [])].join(', ') || '-'}`,
      `- Matches: ${o.state.total ?? 'not counted'} · email 1 words (excl. buyers, footer): ${words}`,
      `- Flags: ${flags.join('; ') || 'none'}`,
      '',
      ...steps.flatMap((s, k) => [
        `### Email ${k + 1} (day ${s.day})${s.subjects[0] ? ` · subject: ${s.subjects.join(' | ')}` : ' · same thread'}`,
        '```',
        s.body,
        '```',
        '',
      ])
    )
  }
  const outDir = resolve(args.out)
  writeFileSync(join(outDir, 'emailbison.csv'), toCsv(csvRows))
  writeFileSync(join(outDir, 'review.md'), review.join('\n'))
  console.log(`[pilot] ready ${csvRows.length}/${unique.length} · steps ${STEPS.length} · out ${outDir}/{emailbison.csv,review.md}`)
  console.log(`[pilot] model spend this run $${modelUsd.toFixed(4)} · lead credits this run ${budget.used} ($${(budget.used * CREDIT_USD).toFixed(2)})`)
}

main().catch((err: unknown) => {
  console.error('[pilot] fatal:', err instanceof Error ? err.message : 'unknown error')
  process.exit(1)
})
