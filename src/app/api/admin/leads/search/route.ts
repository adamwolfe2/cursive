/**
 * Admin Lead Search API
 * POST /api/admin/leads/search - Search for leads from providers
 * GET /api/admin/leads/search - Get search history
 */


import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getAdminContext, logAdminAction } from '@/lib/auth/admin'
import { getLeadProviderService, type LeadSearchFilters } from '@/lib/services/lead-provider.service'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const adminContext = await getAdminContext()

    // SECURITY: Rate limit expensive search operations
    const rateLimitKey = `admin_lead_search:${admin.email}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.admin_lead_search)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many search requests. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    const body = await request.json()
    let {
      workspaceId,
      filters,
      provider,
      saveToWorkspace = false,
    } = body as {
      workspaceId?: string
      filters: LeadSearchFilters
      provider?: 'audience_labs'
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
      // AudienceLab is a CDP/webhook receiver, not a search API.
      // AL leads flow in via SuperPixel/AudienceSync webhooks and batch imports.
      result = {
        leads: [],
        total: 0,
        provider: 'audience_labs',
        creditsUsed: 0,
        remainingCredits: Infinity,
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
        safeError('Failed to save leads:', error)
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
    safeError('Admin lead search error:', error)

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
    const admin = await requireAdmin()
    const adminContext = await getAdminContext()

    // SECURITY: Rate limit search history queries
    const rateLimitKey = `admin_lead_search_get:${admin.email}`
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.admin_lead_search)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

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
    safeError('[Admin Lead Search History] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get lead history' },
      { status: 500 }
    )
  }
}
