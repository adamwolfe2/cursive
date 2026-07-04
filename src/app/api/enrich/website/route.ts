export const runtime = 'nodejs'
export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isBlockedHost, resolvesToBlockedAddress } from '@/lib/utils/ssrf-guard'
import { checkRateLimit } from '@/lib/middleware/rate-limiter'

const requestSchema = z.object({
  url: z.string().url(),
})

/**
 * SSRF guard for a single hop: require https, reject literal internal hosts,
 * then resolve DNS and reject if the host points at an internal/metadata IP.
 * Shares resolvesToBlockedAddress with the reseller outbound-delivery path so
 * both enforce identical DNS-level rules.
 *
 * Residual risk: a fast-flux DNS-rebind TOCTOU between this resolve and the
 * actual connect remains theoretically possible (accepted — matches the
 * reseller delivery path). resolvesToBlockedAddress throws on resolver failure;
 * the caller treats any throw as "return no data".
 */
async function isHopBlocked(urlStr: string): Promise<boolean> {
  let hostname: string
  try {
    const parsed = new URL(urlStr)
    if (parsed.protocol !== 'https:') return true // https only — reject http/other
    hostname = parsed.hostname
  } catch {
    return true
  }
  if (isBlockedHost(urlStr)) return true
  return resolvesToBlockedAddress(hostname)
}

/**
 * Lightweight website enrichment.
 * Fetches a URL, extracts meta tags and visible text, returns company info.
 * Used on the client onboarding form for auto-fill.
 * No auth required — the client form is public, so it is per-IP rate limited
 * and SSRF-hardened (https only, literal + DNS-resolution host checks).
 */
export async function POST(req: NextRequest) {
  try {
    // Public/unauthenticated endpoint — throttle per-IP to blunt SSRF probing
    // and enrichment-cost abuse.
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const rate = await checkRateLimit(clientIp, 'ext', 60)
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rate.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rate.limit),
            'X-RateLimit-Remaining': String(rate.remaining),
          },
        }
      )
    }

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const { url } = parsed.data

    if (await isHopBlocked(url)) {
      return NextResponse.json({ data: null })
    }

    // Fetch the website with a 5s timeout.
    // SSRF hardening: this endpoint is public, so we must NOT let a public host
    // 30x-redirect into the internal network/metadata IPs. Follow redirects
    // manually and re-run the full guard (https + literal + DNS) on every hop;
    // cap hops and body size.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    let html: string
    try {
      let currentUrl = url
      let res: Response | null = null
      for (let hop = 0; hop < 4; hop++) {
        res = await fetch(currentUrl, {
          signal: controller.signal,
          redirect: 'manual',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CursiveBot/1.0)' },
        })
        // Not a redirect → use this response
        if (res.status < 300 || res.status >= 400) break
        const location = res.headers.get('location')
        if (!location) break
        // Resolve relative redirects against the current URL, then re-validate.
        const nextUrl = new URL(location, currentUrl).toString()
        if (await isHopBlocked(nextUrl)) {
          return NextResponse.json({ data: null })
        }
        currentUrl = nextUrl
      }
      if (!res) return NextResponse.json({ data: null })

      // Cap body read at ~512KB — we only need <head> meta tags.
      const reader = res.body?.getReader()
      if (!reader) {
        html = (await res.text()).slice(0, 512_000)
      } else {
        const chunks: Uint8Array[] = []
        let total = 0
        const MAX = 512_000
        while (total < MAX) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          total += value.length
        }
        await reader.cancel().catch(() => {})
        html = new TextDecoder().decode(
          chunks.reduce((acc, c) => {
            const merged = new Uint8Array(acc.length + c.length)
            merged.set(acc)
            merged.set(c, acc.length)
            return merged
          }, new Uint8Array())
        )
      }
    } catch {
      return NextResponse.json({ data: null }) // Silently return nothing
    } finally {
      clearTimeout(timeout)
    }

    // Extract meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)

    const title = ogTitleMatch?.[1] || titleMatch?.[1] || ''
    const description = ogDescMatch?.[1] || descMatch?.[1] || ''

    // Clean company name from title (remove " - Homepage", " | Official Site", etc.)
    const companyName = title
      .replace(/\s*[-|].*$/, '')
      .replace(/\s*(Home|Homepage|Official|Website|Welcome).*$/i, '')
      .trim()

    // Infer industry from description keywords
    const descLower = (description + ' ' + title).toLowerCase()
    let industry = ''
    const industryKeywords: Record<string, string[]> = {
      'B2B SaaS': ['saas', 'software', 'platform', 'cloud', 'api'],
      'E-commerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'retail', 'buy'],
      'Marketing Agency': ['agency', 'marketing', 'advertising', 'digital agency'],
      'Financial Services': ['finance', 'fintech', 'banking', 'investment', 'insurance'],
      'Healthcare': ['health', 'medical', 'healthcare', 'patient', 'clinical'],
      'Real Estate': ['real estate', 'property', 'homes', 'realty'],
      'Education': ['education', 'learning', 'course', 'training', 'university'],
      'Professional Services': ['consulting', 'advisory', 'professional services'],
      'Technology': ['technology', 'tech', 'AI', 'artificial intelligence', 'data'],
    }

    for (const [ind, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some((kw) => descLower.includes(kw))) {
        industry = ind
        break
      }
    }

    return NextResponse.json({
      data: {
        company_name: companyName || null,
        industry: industry || null,
        description: description.slice(0, 200) || null,
      },
    })
  } catch {
    return NextResponse.json({ data: null })
  }
}
