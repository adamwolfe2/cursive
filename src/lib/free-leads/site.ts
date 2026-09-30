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

export interface SiteContent {
  domain: string
  title: string | null
  description: string | null
  favicon: string | null
  text: string
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

async function directFetch(url: string): Promise<SiteContent> {
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
      signal: AbortSignal.timeout(4_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CursiveBot/1.0; +https://meetcursive.com)', Accept: 'text/html' },
    })
    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current).toString()
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return htmlToSite(await readCapped(res), current)
  }
  throw new Error('too many redirects')
}

/** Throws when neither path yields usable text (caller maps to `unreachable`). */
export async function fetchSite(url: string): Promise<SiteContent> {
  let direct: SiteContent | null = null
  try {
    direct = await directFetch(url)
    if (direct.text.length >= MIN_USEFUL_TEXT) return direct
  } catch (err) {
    if (isBlockedError(err)) throw err
    safeWarn('[free-leads/site] direct fetch failed, trying crawler', { domain: siteDomain(url), err: String(err) })
  }
  const crawled = await firecrawlService.scrapeMarkdown(url, 8_000).catch((err: unknown) => {
    safeWarn('[free-leads/site] crawler failed', { domain: siteDomain(url), err: String(err) })
    return null
  })
  if (crawled && crawled.markdown.length >= MIN_USEFUL_TEXT) {
    return {
      domain: siteDomain(url),
      title: crawled.title ?? direct?.title ?? null,
      description: crawled.description ?? direct?.description ?? null,
      favicon: direct?.favicon ?? httpsFavicon('/favicon.ico', url),
      text: crawled.markdown.slice(0, MAX_TEXT),
    }
  }
  if (direct && direct.text.length >= 80) return direct
  throw new Error('site unreachable or empty')
}
