/**
 * ICP from URL — generates a suggested Ideal Customer Profile from a website
 *
 * POST /api/onboarding/icp-from-url
 * Body: { url: string }
 *
 * Takes a user's website URL, scrapes the public landing page via microlink,
 * then asks Claude to produce a structured ICP proposal the /setup wizard
 * can pre-fill. Used during the aha-moment onboarding flow so users never
 * start from a blank form.
 */

export const maxDuration = 45

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { getCurrentUser } from '@/lib/auth/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'
import { checkSpendLimit, recordSpend } from '@/lib/services/api-spend-guard'

const MODEL = 'claude-sonnet-4-20250514'
const INPUT_COST_PER_TOKEN = 3.0 / 1_000_000
const OUTPUT_COST_PER_TOKEN = 15.0 / 1_000_000

const requestSchema = z.object({
  url: z.string().url().refine((url) => {
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname
      if (hostname === 'localhost' || hostname === '127.0.0.1') return false
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false
      if (!hostname.includes('.')) return false
      return true
    } catch {
      return false
    }
  }, 'Please enter a valid public website URL'),
})

export interface IcpFromUrlResponse {
  company_name: string
  company_summary: string
  icp_description: string
  target_industries: string[]
  target_titles: string[]
  target_company_sizes: string[]
  target_geography: string[]
  intent_keywords: string[]
  pain_points: string
  value_prop: string
  site_preview: {
    title: string | null
    description: string | null
    image: string | null
    favicon: string
  }
}

const SYSTEM_PROMPT = `You are a senior B2B sales strategist helping a new Cursive user skip the blank-form problem during onboarding. Given a company's website metadata and landing-page content, produce a suggested Ideal Customer Profile that a user can review and tweak in 60 seconds.

Return ONLY valid JSON matching this schema (no markdown, no preamble):

{
  "company_name": "string — the company's brand name",
  "company_summary": "string — 1-2 sentences describing what the company does",
  "icp_description": "string — 2-3 sentences describing their ideal customer in plain English",
  "target_industries": ["string — 3-6 industry verticals they likely sell into"],
  "target_titles": ["string — 5-8 buyer job titles (e.g. 'VP Marketing', 'Head of RevOps')"],
  "target_company_sizes": ["string — subset of: '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'"],
  "target_geography": ["string — subset of: 'United States', 'Canada', 'United Kingdom', 'Europe (EU)', 'Australia / NZ', 'Latin America', 'Asia Pacific', 'Global'"],
  "intent_keywords": ["string — 4-8 search phrases a prospect would type when shopping for this kind of product"],
  "pain_points": "string — 2-3 sentences describing the core pains this product solves",
  "value_prop": "string — 1 sentence describing the core value proposition"
}

Be decisive. Prefer common-sense defaults over vague ones. Think like the founder of the company.`

/** Fetch metadata via microlink (same service /api/analyze-site uses). */
async function fetchSiteMetadata(domain: string): Promise<{
  title: string | null
  description: string | null
  image: string | null
  favicon: string
  bodyText: string | null
}> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
  const favicon = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(
      `https://api.microlink.io?url=https://${cleanDomain}`,
      { signal: controller.signal, next: { revalidate: 86400 } }
    )
    clearTimeout(timeout)

    if (!res.ok) {
      return { title: null, description: null, image: null, favicon, bodyText: null }
    }

    const data = await res.json()
    return {
      title: data.data?.title ?? null,
      description: data.data?.description ?? null,
      image: data.data?.image?.url ?? null,
      favicon,
      bodyText: null,
    }
  } catch {
    return { title: null, description: null, image: null, favicon, bodyText: null }
  }
}

/** Fetch the landing page HTML and strip to plain text (first ~6KB). */
async function fetchLandingPageText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CursiveBot/1.0; +https://meetcursive.com)',
      },
      next: { revalidate: 3600 },
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const html = await res.text()
    // Strip scripts/styles, then tags, then collapse whitespace
    const text = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Cap at ~6KB to keep prompt cost down
    return text.slice(0, 6000)
  } catch {
    return null
  }
}

let anthropicClient: Anthropic | null = null
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

function stripMarkdownFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

function safeParseJSON<T>(raw: string): T {
  const cleaned = stripMarkdownFences(raw)
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as T
    throw new Error('LLM response is not valid JSON')
  }
}

export async function POST(req: NextRequest) {
  const rateLimited = await withRateLimit(req, 'default')
  if (rateLimited) return rateLimited

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid URL' },
        { status: 400 }
      )
    }

    const { url } = parsed.data
    const cleanDomain = new URL(url).hostname.replace(/^www\./, '')

    // Fetch metadata and page text in parallel
    const [metadata, landingText] = await Promise.all([
      fetchSiteMetadata(cleanDomain),
      fetchLandingPageText(url),
    ])

    await checkSpendLimit()

    const userMessage = [
      `Company website: ${url}`,
      `Domain: ${cleanDomain}`,
      metadata.title && `Title: ${metadata.title}`,
      metadata.description && `Description: ${metadata.description}`,
      landingText && `\nLanding page text:\n${landingText}`,
    ]
      .filter(Boolean)
      .join('\n')

    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    // Track spend
    if (response.usage) {
      const cost =
        response.usage.input_tokens * INPUT_COST_PER_TOKEN +
        response.usage.output_tokens * OUTPUT_COST_PER_TOKEN
      recordSpend(cost)
    }

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('LLM returned no text block')
    }

    const icp = safeParseJSON<Omit<IcpFromUrlResponse, 'site_preview'>>(textBlock.text)

    const result: IcpFromUrlResponse = {
      ...icp,
      site_preview: {
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        favicon: metadata.favicon,
      },
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    safeError('[API] icp-from-url error:', error)
    return NextResponse.json(
      { error: 'Failed to generate ICP suggestions. Please try again or fill the form manually.' },
      { status: 500 }
    )
  }
}
