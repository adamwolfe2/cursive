export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateExtension, extAuthErrorResponse } from '@/lib/middleware/ext-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const requestSchema = z.object({
  first_name: z.string().max(100).optional().default(''),
  last_name: z.string().max(100).optional().default(''),
  company: z.string().max(200).optional(),
  domain: z.string().max(200).optional(),
  email: z.string().email().max(320).optional(),
  // Alternate field names the extension might send
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  name: z.string().max(200).optional(),
  url: z.string().max(500).optional(),
  linkedinUrl: z.string().max(500).optional(),
}).passthrough()

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateExtension(req, 'ext:lookup')

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      )
    }

    // Normalize field names — extension may send camelCase or snake_case
    const normalized = {
      ...parsed.data,
      first_name: parsed.data.first_name || parsed.data.firstName || parsed.data.name?.split(' ')[0] || '',
      last_name: parsed.data.last_name || parsed.data.lastName || parsed.data.name?.split(' ').slice(1).join(' ') || '',
      domain: parsed.data.domain || parsed.data.url?.replace(/^https?:\/\//, '').split('/')[0] || undefined,
    }

    if (!normalized.first_name && !normalized.last_name && !normalized.email && !normalized.company) {
      return NextResponse.json(
        { error: 'At least one of: name, email, or company is required' },
        { status: 400 }
      )
    }

    const { first_name, last_name, company, domain, email } = normalized
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

    let enrichedData: Record<string, unknown> | null = null
    let enrichError: string | null = null

    // Strategy 1: AudienceLab enrich API
    const alApiKey = process.env.AUDIENCELAB_ACCOUNT_API_KEY
    if (alApiKey) {
      try {
        const { enrich } = await import('@/lib/audiencelab/api-client')
        const filter: Record<string, string> = { first_name, last_name }
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
      } catch (e) {
        enrichError = e instanceof Error ? e.message : 'AudienceLab lookup failed'
      }
    }

    // Strategy 2: Search existing leads in our database
    if (!enrichedData) {
      try {
        let query = supabase
          .from('leads')
          .select('first_name, last_name, email, phone, company_name, job_title, metadata')

        if (email) {
          query = query.eq('email', email)
        } else {
          query = query.ilike('first_name', first_name).ilike('last_name', last_name)
          if (company) {
            query = query.ilike('company_name', `%${company}%`)
          }
        }

        const { data: leads } = await query.limit(1).maybeSingle()

        if (leads) {
          const meta = (leads.metadata || {}) as Record<string, unknown>
          enrichedData = {
            first_name: leads.first_name || first_name,
            last_name: leads.last_name || last_name,
            email: leads.email || null,
            phone: leads.phone || null,
            company_name: leads.company_name || company || null,
            company_domain: (meta.domain as string) || domain || null,
            job_title: leads.job_title || null,
            headline: null,
            linkedin_url: (meta.linkedin as string) || null,
            company_industry: (meta.industry as string) || null,
            company_size: (meta.employee_count as string) || null,
            company_revenue: (meta.revenue as string) || null,
            city: (meta.city as string) || null,
            state: (meta.state as string) || null,
            source: 'cursive_database',
          }
        }
      } catch {
        // DB search failed — continue to not_found
      }
    }

    // No match from any source
    if (!enrichedData) {
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
        _debug: !alApiKey ? 'AUDIENCELAB_ACCOUNT_API_KEY not configured' : enrichError || 'No match in identity graph',
      }
    }

    // Deduct 1 credit
    try {
      await supabase.rpc('deduct_workspace_credits', {
        p_workspace_id: auth.workspaceId,
        p_amount: 1,
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      data: enrichedData,
      credits_used: 1,
    })
  } catch (error) {
    return extAuthErrorResponse(error)
  }
}
