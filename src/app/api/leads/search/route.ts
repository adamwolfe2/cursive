/**
 * Lead Search API
 * POST /api/leads/search - Search for leads from providers (user-facing)
 *
 * Respects workspace tier limits and tracks usage.
 */


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { getLeadProviderService, type LeadSearchFilters } from '@/lib/services/lead-provider.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const leadSearchSchema = z.object({
  filters: z.object({
    topic: z.string().max(500).optional(),
    keywords: z.array(z.string().max(200)).max(50).optional(),
    industries: z.array(z.string().max(200)).max(50).optional(),
    jobTitles: z.array(z.string().max(200)).max(50).optional(),
    locations: z.array(z.string().max(200)).max(50).optional(),
    companySize: z.string().max(100).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  }).refine(data =>
    data.topic ||
    (data.keywords && data.keywords.length > 0) ||
    (data.industries && data.industries.length > 0) ||
    (data.jobTitles && data.jobTitles.length > 0),
    { message: 'At least one search filter is required (topic, keywords, industries, or job titles)' }
  ),
  provider: z.enum(['audience_labs']).optional(),
  saveLeads: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.workspace_id) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const workspaceId = user.workspace_id

    const body = await request.json()
    const validationResult = leadSearchSchema.safeParse(body)

    if (!validationResult.success) {
      if (validationResult.error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: validationResult.error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { filters, provider, saveLeads } = validationResult.data

    const leadProvider = getLeadProviderService()

    // Check limits first
    const limits = await leadProvider.getWorkspaceLeadLimits(workspaceId)
    if (!limits.canFetch) {
      return NextResponse.json(
        {
          error: 'Lead limit reached',
          limits: {
            daily: { limit: limits.dailyLimit, used: limits.dailyUsed, remaining: limits.dailyRemaining },
            monthly: { limit: limits.monthlyLimit, used: limits.monthlyUsed, remaining: limits.monthlyRemaining },
          },
        },
        { status: 429 }
      )
    }

    // Perform search with workspace limits
    const result = await leadProvider.searchLeads(workspaceId, filters, provider)

    // Save leads to workspace if requested
    if (saveLeads && result.leads.length > 0) {
      const leadsToInsert = result.leads.map(lead => ({
        workspace_id: workspaceId,
        company_name: lead.companyName,
        company_domain: lead.companyDomain || null,
        company_industry: lead.companyIndustry || null,
        first_name: lead.firstName || null,
        last_name: lead.lastName || null,
        email: lead.email || null,
        phone: lead.phone || null,
        job_title: lead.jobTitle || null,
        linkedin_url: lead.linkedinUrl || null,
        city: lead.city || null,
        state: lead.state || null,
        country: lead.country || null,
        source: lead.provider,
        enrichment_status: 'pending',
        delivery_status: 'pending',
        intent_score: lead.intentScore || null,
      }))

      const { error: insertError } = await supabase
        .from('leads')
        .insert(leadsToInsert)

      if (insertError) {
        safeError('[Lead Search] Failed to save leads:', insertError)
        return NextResponse.json(
          { error: 'Failed to save leads to workspace' },
          { status: 500 }
        )
      }
    }

    // Get updated limits
    const updatedLimits = await leadProvider.getWorkspaceLeadLimits(workspaceId)

    return NextResponse.json({
      success: true,
      leads: result.leads,
      total: result.total,
      provider: result.provider,
      savedCount: saveLeads ? result.leads.length : 0,
      limits: {
        daily: { limit: updatedLimits.dailyLimit, used: updatedLimits.dailyUsed, remaining: updatedLimits.dailyRemaining },
        monthly: { limit: updatedLimits.monthlyLimit, used: updatedLimits.monthlyUsed, remaining: updatedLimits.monthlyRemaining },
      },
    })
  } catch (error: any) {
    safeError('Lead search error:', error)

    if (error.name === 'LeadLimitExceededError') {
      return NextResponse.json(
        {
          error: error.message,
          limits: error.limits,
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to search leads' },
      { status: 500 }
    )
  }
}
