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
