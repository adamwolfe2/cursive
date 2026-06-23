export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isBlockedHost } from '@/lib/utils/ssrf-guard'

const requestSchema = z.object({
  url: z.string().url(),
})

/**
 * Lightweight website enrichment.
 * Fetches a URL, extracts meta tags and visible text, returns company info.
 * Used on the client onboarding form for auto-fill.
 * No auth required — the client form is public.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const { url } = parsed.data

    if (isBlockedHost(url)) {
      return NextResponse.json({ data: null })
    }

    // Fetch the website with a 5s timeout.
    // SSRF hardening: this endpoint is public, so we must NOT let a public host
    // 30x-redirect into the internal network/metadata IPs. Follow redirects
    // manually and re-run isBlockedHost on every hop; cap hops and body size.
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
        if (isBlockedHost(nextUrl)) {
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
