export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateExtension, extAuthErrorResponse } from '@/lib/middleware/ext-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const requestSchema = z.object({
  domain: z.string().min(3).max(200),
  include_contacts: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateExtension(req, 'ext:company')

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { domain } = parsed.data
    const supabase = createAdminClient()

    // Deduct 1 credit
    const { data: creditResult } = await supabase.rpc('atomic_deduct_credits', {
      p_user_id: auth.userId,
      p_amount: 1,
    })

    if (!creditResult) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // Check cache first
    const { data: cached } = await supabase
      .from('company_enrichment_cache')
      .select('enrichment_data, updated_at')
      .eq('domain', domain.toLowerCase())
      .maybeSingle()

    if (cached) {
      const age = Date.now() - new Date(cached.updated_at).getTime()
      if (age < 7 * 24 * 60 * 60 * 1000) { // 7 day cache
        return NextResponse.json({
          data: cached.enrichment_data,
          cached: true,
          credits_used: 1,
        })
      }
    }

    // Scrape meta tags as lightweight enrichment
    let companyData: Record<string, unknown> = { domain }

    try {
      const res = await fetch(`https://${domain}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CursiveBot/1.0)' },
        signal: AbortSignal.timeout(5000),
      })
      const html = await res.text()

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
      const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)

      companyData = {
        ...companyData,
        name: titleMatch?.[1]?.replace(/\s*[-|].*$/, '').trim() || null,
        description: ogDescMatch?.[1] || descMatch?.[1] || null,
      }
    } catch {
      // Website fetch failed
    }

    return NextResponse.json({
      data: companyData,
      credits_used: 1,
    })
  } catch (error) {
    return extAuthErrorResponse(error)
  }
}
