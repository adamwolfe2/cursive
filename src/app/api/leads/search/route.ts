/**
 * Lead Search API
 * POST /api/leads/search - Search for leads from providers (user-facing)
 *
 * Respects workspace tier limits and tracks usage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLeadProviderService, type LeadSearchFilters } from '@/lib/services/lead-provider.service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (userError || !user?.workspace_id) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 400 }
      )
    }

    const workspaceId = user.workspace_id

    const body = await request.json()
    const {
      filters,
      provider,
      saveLeads = true,
    } = body as {
      filters: LeadSearchFilters
      provider?: 'datashopper' | 'audience_labs'
      saveLeads?: boolean
    }

    if (!filters) {
      return NextResponse.json(
        { error: 'Filters are required' },
        { status: 400 }
      )
    }

    // Validate at least some search criteria
    const hasFilters =
      filters.topic ||
      (filters.keywords && filters.keywords.length > 0) ||
      (filters.industries && filters.industries.length > 0) ||
      (filters.jobTitles && filters.jobTitles.length > 0)

    if (!hasFilters) {
      return NextResponse.json(
        { error: 'At least one search filter is required (topic, keywords, industries, or job titles)' },
        { status: 400 }
      )
    }

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
        console.error('Failed to save leads:', insertError)
        // Don't fail the entire request, just log the error
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
    console.error('Lead search error:', error)

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
      { error: error.message || 'Failed to search leads' },
      { status: 500 }
    )
  }
}
