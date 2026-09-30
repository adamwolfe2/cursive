/**
 * POST /api/start/scan  body: { url } | { description }  -> text/event-stream of ScanEvent.
 * Public, rate-limited per IP (costs model + crawler). No credits spent (count is free).
 */
export const runtime = 'nodejs'
export const maxDuration = 60

import type { NextRequest } from 'next/server'
import { ScanRequestSchema, type ScanEvent } from '@/lib/free-leads/contract'
import { fetchSite, normalizeSiteUrl, siteDomain, type SiteContent } from '@/lib/free-leads/site'
import { scanIcp, ScanError } from '@/lib/free-leads/scan'
import { icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { countContacts } from '@/lib/getleads/client'
import { clientIp, isLimited, readJson } from '@/lib/free-leads/http'
import { safeError } from '@/lib/utils/log-sanitizer'

type Send = (event: ScanEvent) => void

const FAILED: ScanEvent = { type: 'error', code: 'failed', message: 'We could not work out who buys from you just now. Please try again.' }

async function loadSource(url: string | null, description: string | undefined, send: Send): Promise<string | null> {
  if (description) {
    return url ? `Website: ${siteDomain(url)}\n\nDescription from the owner:\n${description}` : description
  }
  if (!url) return null
  let site: SiteContent
  try {
    site = await fetchSite(url)
  } catch (err) {
    safeError('[start/scan] site fetch failed', { domain: siteDomain(url), err: String(err) })
    send({ type: 'error', code: 'unreachable', message: 'We could not open that site. Paste a short description of what you sell instead.' })
    return null
  }
  send({ type: 'site', domain: site.domain, title: site.title, description: site.description, favicon: site.favicon })
  return [site.title, site.description, site.text].filter(Boolean).join('\n\n')
}

async function run(url: string | null, description: string | undefined, send: Send): Promise<void> {
  const source = await loadSource(url, description, send)
  if (!source) return
  let icp
  try {
    icp = await scanIcp(source, {
      onFinding: (finding) => send({ type: 'finding', finding }),
      onIcpPartial: (partial) => send({ type: 'icp_partial', icp: partial }),
    })
  } catch (err) {
    safeError('[start/scan] model scan failed', err instanceof ScanError ? `${err.code}: ${err.message}` : err)
    send(FAILED)
    return
  }
  send({ type: 'icp', icp })
  try {
    send({ type: 'count', total: await countContacts(icpToFilters(icp)) })
  } catch (err) {
    // Non-fatal: the UI can call /api/start/count again.
    safeError('[start/scan] count failed', err)
  }
  send({ type: 'done' })
}

function sseResponse(body: (send: Send) => Promise<void>): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send: Send = (event) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      try {
        await body(send)
      } catch (err) {
        safeError('[start/scan] stream failed', err)
        send(FAILED)
      } finally {
        controller.close()
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
  const url = parsed.success && parsed.data.url ? normalizeSiteUrl(parsed.data.url) : null
  const description = parsed.success ? parsed.data.description : undefined

  return sseResponse(async (send) => {
    if (!parsed.success || (!url && !description)) {
      const message = sentDescription
        ? 'Tell us a bit more: what you sell and who buys it (a sentence or two).'
        : 'Enter your website, like acme.com.'
      send({ type: 'error', code: 'invalid_url', message })
      return
    }
    if (await isLimited('free-leads-scan', `ip:${clientIp(req)}`)) {
      send({ type: 'error', code: 'rate_limited', message: 'You have run a lot of scans. Try again in an hour.' })
      return
    }
    if (await isLimited('free-leads-scan-global', 'global')) {
      send({ type: 'error', code: 'rate_limited', message: 'Scans are busy right now. Try again tomorrow.' })
      return
    }
    await run(url, description, send)
  })
}
