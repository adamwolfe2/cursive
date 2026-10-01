/**
 * Fetch a prospect's homepage for the ICP scan.
 * Fast path: direct fetch + HTML strip (4s, manual https-only redirects). SSRF:
 * the address is checked at connect time (pinned lookup), which also closes DNS
 * rebinding between a pre-check and the connect.
 * Fallback: Firecrawl markdown (8s) when the page is JS-rendered or blocks us,
 * but never for a host we refused to connect to.
 */
import { BlockList, isIP, type LookupFunction } from 'node:net'
import { lookup as dnsLookup, type LookupAddress } from 'node:dns'
import { Agent, fetch as undiciFetch, type Response as UndiciResponse } from 'undici'
import { isBlockedHost } from '@/lib/utils/ssrf-guard'
import { normalizeWebsiteUrl } from '@/lib/funnel/website-url'
import { firecrawlService } from '@/lib/services/firecrawl.service'
import { safeWarn } from '@/lib/utils/log-sanitizer'
import type { Fact } from './contract'

export interface SiteContent {
  domain: string
  title: string | null
  description: string | null
  favicon: string | null
  text: string
  /** Which path produced the text (the crawler costs money; direct does not). */
  source: 'direct' | 'crawler'
}

const MAX_HTML = 600_000
const MAX_TEXT = 12_000
const MIN_USEFUL_TEXT = 300

export class BlockedHostError extends Error {
  constructor(message = 'blocked host') {
    super(message)
    this.name = 'BlockedHostError'
  }
}

// Non-public ranges (private, loopback, link-local/metadata, CGNAT, multicast, reserved, NAT64).
const BLOCKED = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) BLOCKED.addSubnet(net, prefix, 'ipv4')
for (const [net, prefix] of [
  ['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8], ['64:ff9b::', 96], ['2001:db8::', 32],
] as const) BLOCKED.addSubnet(net, prefix, 'ipv6')

export function isBlockedAddress(address: string): boolean {
  const mapped = address.toLowerCase().match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return isBlockedAddress(mapped[1])
  const family = isIP(address)
  if (family === 4) return BLOCKED.check(address, 'ipv4')
  if (family === 6) return BLOCKED.check(address, 'ipv6')
  return true
}

type Resolve = (hostname: string, cb: (err: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void) => void
const systemResolve: Resolve = (hostname, cb) => dnsLookup(hostname, { all: true, verbatim: true }, cb)

/** dns.lookup replacement used at connect time: refuses if ANY resolved address is non-public. */
export function guardedLookup(resolve: Resolve = systemResolve): LookupFunction {
  return (hostname, options, callback) => {
    resolve(hostname, (err, addresses) => {
      if (err) return callback(err, '', 4)
      if (!addresses.length || addresses.some((a) => isBlockedAddress(a.address))) {
        return callback(new BlockedHostError(), '', 4)
      }
      if (options.all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, addresses)
      const wanted = options.family === 6 || options.family === 4 ? addresses.find((a) => a.family === options.family) : undefined
      const pick = wanted ?? addresses[0]
      callback(null, pick.address, pick.family)
    })
  }
}

const pinnedAgent = new Agent({ connect: { lookup: guardedLookup() } })

/** True when the error (or its fetch-wrapped cause) is our SSRF refusal. */
export function isBlockedError(err: unknown): boolean {
  return err instanceof BlockedHostError || (err instanceof Error && err.cause instanceof BlockedHostError)
}

export function siteDomain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}

/** Normalizes user input to an https URL, or null if unusable / private. */
export function normalizeSiteUrl(input: string): string | null {
  const url = normalizeWebsiteUrl(input)
  return url && !isBlockedHost(url) ? url : null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${key}["']`,
    'i'
  )
  const m = html.match(re)
  const v = m?.[1] ?? m?.[2]
  return v ? decodeEntities(v).trim() : null
}

/** Favicon URL only when it is https (the UI renders it). */
export function httpsFavicon(href: string, base: string): string | null {
  if (!URL.canParse(href, base)) return null
  const u = new URL(href, base)
  return u.protocol === 'https:' ? u.toString() : null
}

export function htmlToSite(html: string, url: string): SiteContent {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || metaContent(html, 'og:title')
  const iconHref = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)?.[1]
  const text = decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT)
  return {
    domain: siteDomain(url),
    title: title ? decodeEntities(title).slice(0, 200) : null,
    description: (metaContent(html, 'description') ?? metaContent(html, 'og:description'))?.slice(0, 400) ?? null,
    favicon: httpsFavicon(iconHref ?? '/favicon.ico', url),
    text,
    source: 'direct',
  }
}

async function readCapped(res: UndiciResponse): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return (await res.text()).slice(0, MAX_HTML)
  const chunks: Uint8Array[] = []
  let total = 0
  while (total < MAX_HTML) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  await reader.cancel().catch((err: unknown) => safeWarn('[free-leads/site] reader cancel failed', err))
  return Buffer.concat(chunks).toString('utf8')
}

/**
 * Next hop for a redirect. Sites often send https://acme.com to http://www.acme.com; we
 * upgrade plain http to https instead of refusing (https-only still holds, and every hop
 * is re-checked). Other schemes stay as they are and are refused by the caller.
 */
export function upgradeRedirect(location: string, current: string): string {
  const next = new URL(location, current)
  if (next.protocol === 'http:') next.protocol = 'https:'
  return next.toString()
}

async function directFetch(url: string, timeoutMs = 4_000): Promise<{ html: string; url: string }> {
  let current = url
  for (let hop = 0; hop < 4; hop++) {
    const parsed = new URL(current)
    if (parsed.protocol !== 'https:') throw new BlockedHostError('non-https redirect')
    // IP literals never reach the lookup hook, so check them here.
    const literal = parsed.hostname.replace(/^\[|\]$/g, '')
    if (isBlockedHost(current) || (isIP(literal) && isBlockedAddress(literal))) throw new BlockedHostError()
    const res = await undiciFetch(current, {
      dispatcher: pinnedAgent,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CursiveBot/1.0; +https://meetcursive.com)', Accept: 'text/html' },
    })
    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      current = upgradeRedirect(location, current)
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { html: await readCapped(res), url: current }
  }
  throw new Error('too many redirects')
}

// ---------------------------------------------------------------------------
// Multi-page read with live progress
// ---------------------------------------------------------------------------

export type SiteEvent =
  | { type: 'page'; path: string; state: 'fetching' | 'read' | 'failed'; title?: string | null; chars?: number }
  | { type: 'site'; domain: string; title: string | null; description: string | null; favicon: string | null }
  | { type: 'fact'; fact: Fact }

const HOME_TEXT = 7_000
const SUBPAGE_TEXT = 1_700
const SUBPAGES = 3
// Sub-pages are a bonus: never let a slow one hold the model back for long.
const SUBPAGE_TIMEOUT_MS = 1_800

/** Key pages worth reading, in priority order; one per kind. */
const PAGE_KINDS: Array<[string, RegExp]> = [
  ['pricing', /\/(pricing|plans|prices?)(\/|$)/i],
  ['customers', /\/(customers|case-stud(y|ies)|clients|testimonials|success-stories|reviews)(\/|$)/i],
  ['services', /\/(services|solutions|products?|what-we-do|industries|platform)(\/|$)/i],
  ['about', /\/(about(-us)?|company|who-we-are|our-story)(\/|$)/i],
  ['locations', /\/(locations?|service-areas?|areas-we-serve)(\/|$)/i],
]

/** Same-site links to the key pages (pricing, customers, services, about, locations), at most SUBPAGES. */
export function pickSubpages(html: string, baseUrl: string): string[] {
  const host = new URL(baseUrl).hostname.replace(/^www\./, '')
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)]
    .map((m) => (URL.canParse(m[1], baseUrl) ? new URL(m[1], baseUrl) : null))
    .filter((u): u is URL => Boolean(u && /^https?:$/.test(u.protocol) && u.hostname.replace(/^www\./, '') === host))
    .filter((u) => !/\.(pdf|jpe?g|png|gif|svg|zip|mp4)$/i.test(u.pathname) && u.pathname.length > 1)
  const picked: string[] = []
  for (const [, re] of PAGE_KINDS) {
    const hit = links.find((u) => re.test(u.pathname) && u.pathname.split('/').filter(Boolean).length <= 2)
    if (hit) {
      hit.protocol = 'https:'
      hit.search = ''
      hit.hash = ''
      if (!picked.includes(hit.toString())) picked.push(hit.toString())
    }
    if (picked.length >= SUBPAGES) break
  }
  return picked
}

function jsonLd(html: string): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed: unknown = JSON.parse(m[1])
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(((parsed as { '@graph'?: unknown[] })?.['@graph']) ?? [])]
      out.push(...nodes.filter((n): n is Record<string, unknown> => typeof n === 'object' && n !== null))
    } catch (err) {
      // Broken markup on the prospect's site: skip that block, keep reading.
      safeWarn('[free-leads/site] unparseable JSON-LD block', String(err).slice(0, 120))
    }
  }
  return out
}

const PRICE = /\$\s?\d[\d,]*(?:\.\d{2})?(?:\s?(?:\/|per\s)\s?(?:mo(?:nth)?|yr|year|user|seat|hour|hr))?/gi

/** Facts stated on the pages themselves (no model): company name, address, listed prices. */
export function siteFacts(homeHtml: string, pricingText: string | null): Fact[] {
  const facts: Fact[] = []
  const nodes = jsonLd(homeHtml)
  const org = nodes.find((n) => typeof n.name === 'string' && /Organization|LocalBusiness|Corporation|Dentist|Store|Service|Attorney|LegalService|HVACBusiness/i.test(String(n['@type'])))
  const name = (org?.name as string | undefined) ?? metaContent(homeHtml, 'og:site_name')
  if (name) {
    const founded = typeof org?.foundingDate === 'string' ? `, founded ${org.foundingDate.slice(0, 4)}` : ''
    facts.push({ key: 'company', label: 'Company', text: `${decodeEntities(name).slice(0, 80)}${founded}`, source: 'site' })
  }
  const addr = (org?.address ?? nodes.find((n) => n.address)?.address) as Record<string, unknown> | undefined
  const place = [addr?.addressLocality, addr?.addressRegion].filter((v) => typeof v === 'string' && v).join(', ')
  if (place) facts.push({ key: 'locations', label: 'Where', text: `Based in ${place}`.slice(0, 160), source: 'site' })
  const prices = [...new Set((pricingText ?? '').match(PRICE) ?? [])].slice(0, 3)
  if (prices.length) facts.push({ key: 'pricing', label: 'Pricing', text: `Listed prices: ${prices.join(', ')}`, source: 'site' })
  return facts
}

type Emit = (event: SiteEvent) => void
const pathOf = (url: string) => new URL(url).pathname || '/'

/**
 * Reads the homepage, then up to SUBPAGES key pages in parallel, emitting real progress.
 * Throws when neither the direct fetch nor the crawler yields usable text (caller maps to `unreachable`).
 */
export async function readSite(url: string, emit: Emit): Promise<SiteContent> {
  emit({ type: 'page', path: '/', state: 'fetching' })
  let home: { html: string; url: string } | null = null
  let direct: SiteContent | null = null
  try {
    home = await directFetch(url)
    direct = htmlToSite(home.html, home.url)
  } catch (err) {
    if (isBlockedError(err)) throw err
    safeWarn('[free-leads/site] direct fetch failed, trying crawler', { domain: siteDomain(url), err: String(err) })
  }

  if (!direct || direct.text.length < MIN_USEFUL_TEXT) {
    const crawled = await firecrawlService.scrapeMarkdown(url, 8_000).catch((err: unknown) => {
      safeWarn('[free-leads/site] crawler failed', { domain: siteDomain(url), err: String(err) })
      return null
    })
    if (crawled && crawled.markdown.length >= MIN_USEFUL_TEXT) {
      const site: SiteContent = {
        domain: siteDomain(url),
        title: (crawled.title ?? direct?.title ?? null)?.slice(0, 200) ?? null,
        description: (crawled.description ?? direct?.description ?? null)?.slice(0, 400) ?? null,
        favicon: direct?.favicon ?? httpsFavicon('/favicon.ico', url),
        text: crawled.markdown.slice(0, MAX_TEXT),
        source: 'crawler',
      }
      emit({ type: 'site', domain: site.domain, title: site.title, description: site.description, favicon: site.favicon })
      emit({ type: 'page', path: '/', state: 'read', title: site.title, chars: site.text.length })
      return site
    }
    if (!direct || direct.text.length < 80) {
      emit({ type: 'page', path: '/', state: 'failed' })
      throw new Error('site unreachable or empty')
    }
  }

  const site = direct as SiteContent
  const homeFetched = home as { html: string; url: string }
  emit({ type: 'site', domain: site.domain, title: site.title, description: site.description, favicon: site.favicon })
  emit({ type: 'page', path: '/', state: 'read', title: site.title, chars: site.text.length })

  const subs = pickSubpages(homeFetched.html, homeFetched.url)
  subs.forEach((u) => emit({ type: 'page', path: pathOf(u), state: 'fetching' }))
  const pages = await Promise.all(
    subs.map(async (u) => {
      try {
        const page = await directFetch(u, SUBPAGE_TIMEOUT_MS)
        const read = htmlToSite(page.html, page.url)
        emit({ type: 'page', path: pathOf(u), state: 'read', title: read.title, chars: read.text.length })
        return { path: pathOf(u), text: read.text.slice(0, SUBPAGE_TEXT) }
      } catch (err) {
        emit({ type: 'page', path: pathOf(u), state: 'failed' })
        safeWarn('[free-leads/site] sub-page skipped', { path: pathOf(u), err: String(err).slice(0, 120) })
        return null
      }
    })
  )
  const read = pages.filter((p): p is { path: string; text: string } => Boolean(p?.text))
  const pricing = read.find((p) => PAGE_KINDS[0][1].test(p.path))?.text ?? site.text
  siteFacts(homeFetched.html, pricing).forEach((fact) => emit({ type: 'fact', fact }))
  const text = [site.text.slice(0, HOME_TEXT), ...read.map((p) => `Page ${p.path}:\n${p.text}`)].join('\n\n')
  return { ...site, text: text.slice(0, MAX_TEXT) }
}

/** readSite without progress events (eval scripts, tests). */
export async function fetchSite(url: string): Promise<SiteContent> {
  return readSite(url, () => undefined)
}
