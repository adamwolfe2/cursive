/**
 * POST /api/start/scan  body: ScanRequest  -> text/event-stream of ScanEvent (see contract for order).
 * Public, rate-limited per IP (costs model + crawler). No credits spent (count is free).
 * Every event is real progress: pages as they are fetched, facts as they are read, ICP fields as
 * the model completes them. A site scanned in the last 7 days replays instantly (marked `replay`).
 */
export const runtime = 'nodejs'
export const maxDuration = 60

import type { NextRequest } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { ScanRequestSchema, type Attribution, type Icp, type ScanEvent } from '@/lib/free-leads/contract'
import { normalizeSiteUrl, readSite, siteDomain, type SiteContent } from '@/lib/free-leads/site'
import { scanIcp, ScanError, SCAN_VERSION } from '@/lib/free-leads/scan'
import { icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { cachedCount, cacheGet, cachePut, HOUR_MS } from '@/lib/free-leads/cache'
import { recordStep, sessionIdFrom } from '@/lib/free-leads/funnel'
import { claudeUsd } from '@/lib/free-leads/cost'
import { hashIp } from '@/lib/free-leads/rules'
import { clientIp, isLimited, readJson } from '@/lib/free-leads/http'
import { safeError } from '@/lib/utils/log-sanitizer'

type Send = (event: ScanEvent) => void

const FAILED: ScanEvent = { type: 'error', code: 'failed', message: 'We could not work out who buys from you just now. Please try again.' }

/** Events worth replaying for a repeat visit to the same site (everything before the count). */
type Replayable = Exclude<ScanEvent, { type: 'count' } | { type: 'error' } | { type: 'done' } | { type: 'replay' }>
const SCAN_TTL_MS = 7 * 24 * HOUR_MS
const scanKey = (url: string) => `scan:${SCAN_VERSION}:${siteDomain(url)}`

interface ScanContext {
  sessionId: string | null
  url: string | null
  description: string | undefined
  /** The `paste` step write, started in the background so it never delays the first event. */
  pasted?: Promise<void>
}

type CachedScan = { events: Replayable[]; scanned_at: string }

async function loadSource(ctx: ScanContext, send: Send): Promise<{ text: string; site: SiteContent | null } | null> {
  const { url, description } = ctx
  if (description) {
    const text = url ? `Website: ${siteDomain(url)}\n\nDescription from the owner:\n${description}` : description
    return { text, site: null }
  }
  if (!url) return null
  try {
    const site = await readSite(url, send)
    return { text: [site.title, site.description, site.text].filter(Boolean).join('\n\n'), site }
  } catch (err) {
    safeError('[start/scan] site fetch failed', { domain: siteDomain(url), err: String(err) })
    send({ type: 'error', code: 'unreachable', message: 'We could not open that site. Paste a short description of what you sell instead.' })
    return null
  }
}

async function sendCount(icp: Icp, send: Send): Promise<number | null> {
  try {
    const total = await cachedCount(icpToFilters(icp))
    send({ type: 'count', total })
    return total
  } catch (err) {
    // Non-fatal: the UI can call /api/start/count again.
    safeError('[start/scan] count failed', err)
    return null
  }
}

async function finish(ctx: ScanContext, icp: Icp, send: Send, meta: Record<string, unknown>): Promise<void> {
  const total = await sendCount(icp, send)
  send({ type: 'done' })
  await ctx.pasted
  await recordStep(ctx.sessionId, 'scan_done', {
    meta,
    patch: { icp, ...(total === null ? {} : { total }), ...(ctx.url ? { domain: siteDomain(ctx.url) } : {}) },
  })
}

async function run(ctx: ScanContext, send: Send, cached: CachedScan | null): Promise<void> {
  const { url, description } = ctx
  // A site scanned recently (by anyone) replays instantly: no fetch, no model call.
  if (url && !description) {
    const icp = cached?.events.find((e): e is Extract<Replayable, { type: 'icp' }> => e.type === 'icp')?.icp
    if (cached && icp) {
      send({ type: 'replay', scanned_at: cached.scanned_at })
      cached.events.forEach(send)
      await finish(ctx, icp, send, { cached: true, usd: 0 })
      return
    }
  }
  // Global cap counts only real scans (model + crawler spend), not cache replays.
  if (await isLimited('free-leads-scan-global', 'global')) {
    send({ type: 'error', code: 'rate_limited', message: 'Scans are busy right now. Try again tomorrow.' })
    return
  }
  const events: Replayable[] = []
  const record: Send = (event) => {
    if (event.type !== 'count' && event.type !== 'error' && event.type !== 'done' && event.type !== 'replay') events.push(event)
    send(event)
  }
  const source = await loadSource(ctx, record)
  if (!source) return
  const usage: Array<{ u: Anthropic.Usage; model: string }> = []
  let icp: Icp
  try {
    icp = await scanIcp(source.text, {
      onFact: (fact) => record({ type: 'fact', fact }),
      onIcpPartial: (partial) => record({ type: 'icp_partial', icp: partial }),
      onUsage: (u, model) => usage.push({ u, model }),
    })
  } catch (err) {
    safeError('[start/scan] model scan failed', err instanceof ScanError ? `${err.code}: ${err.message}` : err)
    send(FAILED)
    return
  }
  record({ type: 'icp', icp })
  if (url && !description) await cachePut(scanKey(url), { events, scanned_at: new Date().toISOString() }, SCAN_TTL_MS)
  await finish(ctx, icp, send, {
    cached: false,
    usd: usage.reduce((s, x) => s + claudeUsd(x.model, x.u), 0),
    model: usage[0]?.model,
    source: source.site?.source ?? 'description',
    cache_read: usage.reduce((s, x) => s + (x.u.cache_read_input_tokens ?? 0), 0),
  })
}

function sseResponse(body: (send: Send) => Promise<void>): Response {
  const encoder = new TextEncoder()
  // The visitor may leave mid-scan: stop writing but let the scan finish, so the model spend
  // lands in the shared cache instead of being thrown away.
  let closed = false
  const stream = new ReadableStream({
    cancel() {
      closed = true
    },
    async start(controller) {
      const send: Send = (event) => {
        if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      try {
        await body(send)
      } catch (err) {
        safeError('[start/scan] stream failed', err)
        send(FAILED)
      } finally {
        if (!closed) controller.close()
      }
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function POST(req: NextRequest) {
  const body = await readJson(req)
  const sentDescription =
    typeof body === 'object' && body !== null && typeof (body as { description?: unknown }).description === 'string'
  const parsed = ScanRequestSchema.safeParse(body)
  // Always the site's origin: a path or query (victim.com/search?q=..., github.com/someone) must not
  // become the cached scan every later visitor of that domain replays.
  const normalized = parsed.success && parsed.data.url ? normalizeSiteUrl(parsed.data.url) : null
  const url = normalized ? `${new URL(normalized).origin}/` : null
  const description = parsed.success ? parsed.data.description : undefined
  const attribution: Attribution | undefined = parsed.success ? parsed.data.attribution : undefined
  const ctx: ScanContext = { sessionId: sessionIdFrom(req), url, description }

  return sseResponse(async (send) => {
    if (!parsed.success || (!url && !description)) {
      const message = sentDescription
        ? 'Tell us a bit more: what you sell and who buys it (a sentence or two).'
        : 'Enter your website, like acme.com.'
      send({ type: 'error', code: 'invalid_url', message })
      return
    }
    const ip = clientIp(req)
    // In parallel: the per-IP check and the replay lookup (first visible progress < 1.5s).
    const [limited, cached] = await Promise.all([
      isLimited('free-leads-scan', `ip:${ip}`),
      url && !description ? cacheGet<CachedScan>(scanKey(url)) : Promise.resolve(null),
    ])
    if (limited) {
      send({ type: 'error', code: 'rate_limited', message: 'You have run a lot of scans. Try again in an hour.' })
      return
    }
    ctx.pasted = recordStep(ctx.sessionId, 'paste', {
      attribution,
      patch: { ip_hash: hashIp(ip), ...(url ? { website: url, domain: siteDomain(url) } : {}) },
      meta: description ? { description: true } : {},
    })
    await run(ctx, send, cached)
    await ctx.pasted // early returns (unreachable, failed scan) must still record the paste
  })
}
