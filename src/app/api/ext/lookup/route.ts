export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateExtension, extAuthErrorResponse } from '@/lib/middleware/ext-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrich } from '@/lib/audiencelab/api-client'

const requestSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  company: z.string().max(200).optional(),
  domain: z.string().max(200).optional(),
  email: z.string().email().max(320).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateExtension(req, 'ext:lookup')

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { first_name, last_name, company, domain, email } = parsed.data
    const supabase = createAdminClient()

    // Check credits first
    const { data: creditCheck } = await supabase
      .from('workspace_credits')
      .select('balance')
      .eq('workspace_id', auth.workspaceId)
      .maybeSingle()

    if (!creditCheck || creditCheck.balance < 1) {
      return NextResponse.json({ error: 'Insufficient credits. Purchase more at leads.meetcursive.com/marketplace' }, { status: 402 })
    }

    // Call AudienceLab enrich API
    let enrichedData: Record<string, unknown> | null = null

    try {
      const filter: Record<string, string> = {
        first_name,
        last_name,
      }
      if (company) filter.company = company
      if (email) filter.email = email

      const result = await enrich({ filter })

      if (result.found > 0 && result.result.length > 0) {
        const match = result.result[0]
        enrichedData = {
          first_name: match.FIRST_NAME || first_name,
          last_name: match.LAST_NAME || last_name,
          email: match.BUSINESS_VERIFIED_EMAILS?.[0] || match.BUSINESS_EMAIL || match.PERSONAL_VERIFIED_EMAILS?.[0] || match.PERSONAL_EMAILS || null,
          phone: match.MOBILE_PHONE || match.DIRECT_NUMBER || match.PERSONAL_PHONE || match.COMPANY_PHONE || null,
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
    } catch (alError) {
      // AudienceLab API failed — return what we can
      enrichedData = null
    }

    if (!enrichedData) {
      // No match found — still deduct credit (lookup was attempted)
      enrichedData = {
        first_name,
        last_name,
        email: null,
        phone: null,
        company_name: company || null,
        company_domain: domain || null,
        job_title: null,
        headline: null,
        linkedin_url: null,
        company_industry: null,
        company_size: null,
        company_revenue: null,
        city: null,
        state: null,
        source: 'not_found',
      }
    }

    // Deduct 1 credit using the workspace RPC
    try {
      await supabase.rpc('deduct_workspace_credits', {
        p_workspace_id: auth.workspaceId,
        p_amount: 1,
      })
    } catch {
      // Credit deduction failed — still return data (non-fatal)
    }

    return NextResponse.json({
      data: enrichedData,
      credits_used: 1,
    })
  } catch (error) {
    return extAuthErrorResponse(error)
  }
}
