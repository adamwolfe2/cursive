/**
 * Admin Lead Search API
 * POST /api/admin/leads/search - Search for leads from providers
 * GET /api/admin/leads/search - Get search history
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getAdminContext, logAdminAction } from '@/lib/auth/admin'
import { getLeadProviderService, type LeadSearchFilters } from '@/lib/services/lead-provider.service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const adminContext = await getAdminContext()

    const body = await request.json()
    let {
      workspaceId,
      filters,
      provider,
      saveToWorkspace = false,
    } = body as {
      workspaceId?: string
      filters: LeadSearchFilters
      provider?: 'datashopper' | 'audience_labs'
      saveToWorkspace?: boolean
    }

    if (!filters) {
      return NextResponse.json(
        { error: 'Filters are required' },
        { status: 400 }
      )
    }

    // SECURITY: If admin is impersonating a workspace, restrict to that workspace only
    // This prevents accidental cross-workspace operations during impersonation
    if (adminContext?.isImpersonating && adminContext.impersonatedWorkspace) {
      workspaceId = adminContext.impersonatedWorkspace.id
    }

    const leadProvider = getLeadProviderService()

    // If workspaceId provided, search with workspace limits
    // Otherwise, search without limits (super admin mode - only when NOT impersonating)
    let result
    if (workspaceId) {
      result = await leadProvider.searchLeads(workspaceId, filters, provider)
    } else {
      // Admin search - no workspace limits
      // Use a dummy workspace ID for the search but don't track usage
      if (provider === 'datashopper') {
        const DataShopperClient = (await import('@/lib/integrations/datashopper')).DataShopperClient
        const client = new DataShopperClient()
        const dsResults = await client.searchCompanies({
          topic: filters.topic || filters.keywords?.join(' ') || '',
          location: {
            country: filters.countries?.[0],
            state: filters.states?.[0],
            city: filters.cities?.[0],
          },
          industry: filters.industries,
          limit: filters.limit || 50,
        })
        result = {
          leads: dsResults.results.map(company => ({
            provider: 'datashopper' as const,
            firstName: '',
            lastName: '',
            companyName: company.name,
            companyDomain: company.domain,
            companyIndustry: company.industry,
            companySize: company.employee_count?.toString(),
            city: company.location?.city,
            state: company.location?.state,
            country: company.location?.country,
            fetchedAt: new Date().toISOString(),
          })),
          total: dsResults.total,
          provider: 'datashopper',
          creditsUsed: 0, // Admin searches don't use credits
          remainingCredits: Infinity,
        }
      } else {
        // AudienceLabs is now a CDP/webhook receiver, not a search API.
        // AL leads flow in via SuperPixel/AudienceSync webhooks and batch imports.
        result = {
          leads: [],
          total: 0,
          provider: 'audience_labs',
          creditsUsed: 0,
          remainingCredits: Infinity,
        }
      }
    }

    // Save leads to workspace if requested
    if (saveToWorkspace && workspaceId && result.leads.length > 0) {
      const supabase = await createClient()

      const leadsToInsert = result.leads.map((lead: any) => ({
        workspace_id: workspaceId,
        company_name: lead.companyName,
        company_domain: lead.companyDomain,
        company_industry: lead.companyIndustry,
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

      const { data: insertedLeads, error } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select('id')

      if (error) {
        console.error('Failed to save leads:', error)
      } else {
        // Log admin action
        await logAdminAction(
          'leads_imported',
          'leads',
          null,
          null,
          { count: insertedLeads?.length || 0, provider: result.provider },
          workspaceId
        )
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Admin lead search error:', error)

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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const adminContext = await getAdminContext()

    const { searchParams } = new URL(request.url)
    let workspaceId = searchParams.get('workspaceId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const allWorkspaces = searchParams.get('allWorkspaces') === 'true'

    // SECURITY: If admin is impersonating a workspace, restrict to that workspace only
    // This prevents accidental cross-workspace data access during impersonation
    if (adminContext?.isImpersonating && adminContext.impersonatedWorkspace) {
      workspaceId = adminContext.impersonatedWorkspace.id
    }

    // SECURITY: Require explicit intent for cross-workspace queries
    // Admin must either specify a workspace OR explicitly request all workspaces
    if (!workspaceId && !allWorkspaces && !adminContext?.isImpersonating) {
      return NextResponse.json(
        {
          error: 'Workspace ID required',
          details: 'Specify workspaceId parameter or allWorkspaces=true for cross-workspace search',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get recent lead imports/searches
    let query = supabase
      .from('leads')
      .select('*, workspaces(name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply workspace filter if specified (not when allWorkspaces=true)
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: leads, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      leads,
      impersonating: adminContext?.isImpersonating || false,
      workspaceFilter: workspaceId || null,
      crossWorkspaceQuery: allWorkspaces && !workspaceId,
      warning: allWorkspaces && !workspaceId ? 'Results include leads from all workspaces' : undefined,
    })
  } catch (error: any) {
    console.error('[Admin Lead Search History] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get lead history' },
      { status: 500 }
    )
  }
}
