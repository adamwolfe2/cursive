export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  url: z.string().url(),
})

// Block internal/private network targets to prevent SSRF
function isBlockedHost(urlStr: string): boolean {
  try {
    const { hostname, protocol } = new URL(urlStr)
    // Only allow http/https
    if (protocol !== 'http:' && protocol !== 'https:') return true
    // Block localhost and common internal hostnames
    if (hostname === 'localhost' || hostname === '0.0.0.0') return true
    // Block IPv6 loopback
    if (hostname === '::1' || hostname === '[::1]') return true
    // Block IPv4 private ranges (checked as string prefix — fast enough for our use case)
    const ipv4 = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (ipv4) {
      const [, a, b] = ipv4.map(Number)
      if (a === 10) return true                          // 10.0.0.0/8
      if (a === 127) return true                         // 127.0.0.0/8 loopback
      if (a === 172 && b >= 16 && b <= 31) return true   // 172.16.0.0/12
      if (a === 192 && b === 168) return true            // 192.168.0.0/16
      if (a === 169 && b === 254) return true            // 169.254.0.0/16 link-local / cloud metadata
      if (a === 100 && b >= 64 && b <= 127) return true  // 100.64.0.0/10 shared address space
    }
    return false
  } catch {
    return true
  }
}

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

    // Fetch the website with a 5s timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    let html: string
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CursiveBot/1.0)',
        },
      })
      html = await res.text()
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
