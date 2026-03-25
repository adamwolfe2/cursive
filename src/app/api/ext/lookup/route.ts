export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateExtension, extAuthErrorResponse } from '@/lib/middleware/ext-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const requestSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  company: z.string().max(200).optional(),
  domain: z.string().max(200).optional(),
  linkedin_url: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateExtension(req, 'ext:lookup')

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { first_name, last_name, company, domain } = parsed.data
    const supabase = createAdminClient()

    // Deduct 1 credit
    const { data: creditResult } = await supabase.rpc('atomic_deduct_credits', {
      p_user_id: auth.userId,
      p_amount: 1,
    })

    if (!creditResult) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // Try AudienceLab lookup
    let enrichedData: Record<string, unknown> | null = null

    try {
      const alApiKey = process.env.AUDIENCELAB_ACCOUNT_API_KEY
      if (alApiKey) {
        const searchParams = new URLSearchParams()
        searchParams.set('firstName', first_name)
        searchParams.set('lastName', last_name)
        if (company) searchParams.set('company', company)
        if (domain) searchParams.set('domain', domain)

        const res = await fetch(
          `https://api.audiencelab.io/v1/people/search?${searchParams}`,
          {
            headers: { 'X-API-Key': alApiKey },
            signal: AbortSignal.timeout(10000),
          }
        )

        if (res.ok) {
          const data = await res.json()
          if (data.results && data.results.length > 0) {
            const match = data.results[0]
            enrichedData = {
              first_name: match.FIRST_NAME || first_name,
              last_name: match.LAST_NAME || last_name,
              email: match.BUSINESS_VERIFIED_EMAILS?.[0] || match.BUSINESS_EMAIL || match.PERSONAL_VERIFIED_EMAILS?.[0] || null,
              phone: match.MOBILE_PHONE || match.DIRECT_NUMBER || null,
              company_name: match.COMPANY_NAME || company || null,
              company_domain: match.COMPANY_DOMAIN || domain || null,
              job_title: match.JOB_TITLE || null,
              headline: match.HEADLINE || null,
              linkedin_url: match.LINKEDIN_URL || null,
              company_industry: match.COMPANY_INDUSTRY || null,
              company_size: match.COMPANY_EMPLOYEE_COUNT || null,
              company_revenue: match.COMPANY_REVENUE || null,
              city: match.COMPANY_CITY || match.PERSONAL_CITY || null,
              state: match.COMPANY_STATE || match.PERSONAL_STATE || null,
              source: 'audiencelab',
            }
          }
        }
      }
    } catch {
      // AudienceLab failed — continue with partial data
    }

    if (!enrichedData) {
      enrichedData = {
        first_name,
        last_name,
        email: null,
        phone: null,
        company_name: company || null,
        company_domain: domain || null,
        job_title: null,
        source: 'not_found',
      }
    }

    return NextResponse.json({
      data: enrichedData,
      credits_used: 1,
    })
  } catch (error) {
    return extAuthErrorResponse(error)
  }
}
