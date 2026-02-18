/**
 * Populate Initial Leads API
 *
 * Triggered IMMEDIATELY after user onboarding to fetch fresh leads
 * from Audience Labs and populate their workspace.
 *
 * This ensures users see leads right away instead of waiting for daily cron.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchLeadsFromSegment, type AudienceLabLead } from '@/lib/services/audiencelab.service'
import { meetsQualityBar } from '@/lib/services/lead-quality.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with workspace and segment info
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, workspace_id, industry_segment, location_segment, daily_lead_limit, plan, is_active')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userProfile) {
      safeError('[PopulateInitialLeads] User not found:', userError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.workspace_id) {
      return NextResponse.json({ error: 'No workspace assigned' }, { status: 400 })
    }

    if (!userProfile.industry_segment || !userProfile.location_segment) {
      return NextResponse.json(
        { error: 'Industry and location segments required' },
        { status: 400 }
      )
    }

    // Check if user already received leads today (prevent multiple calls)
    const today = new Date().toISOString().split('T')[0]
    const { count: todayLeadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id)
      .gte('delivered_at', `${today}T00:00:00`)
      .lte('delivered_at', `${today}T23:59:59`)

    if (todayLeadsCount && todayLeadsCount >= userProfile.daily_lead_limit) {
      return NextResponse.json({
        success: true,
        message: 'You have already received your daily leads',
        count: todayLeadsCount,
        alreadyDelivered: true,
      })
    }

    // Get audience mapping for user's industry/location
    const { data: segmentMapping, error: mappingError } = await supabase
      .from('audience_lab_segments')
      .select('segment_id, segment_name')
      .eq('industry', userProfile.industry_segment)
      .eq('location', userProfile.location_segment)
      .single()

    if (mappingError || !segmentMapping) {
      safeError('[PopulateInitialLeads] No audience mapping found:', {
        industry: userProfile.industry_segment,
        location: userProfile.location_segment,
        error: mappingError,
      })
      return NextResponse.json(
        {
          error: 'No audience mapping found for your industry/location combination',
          industry: userProfile.industry_segment,
          location: userProfile.location_segment,
        },
        { status: 404 }
      )
    }

    // Determine how many leads to fetch (based on plan)
    const leadLimit = userProfile.daily_lead_limit || (userProfile.plan === 'free' ? 10 : 100)

    // Fetch leads from Audience Labs
    const leads = await fetchLeadsFromSegment(segmentMapping.segment_id, {
      page: 1,
      pageSize: leadLimit,
    })

    if (leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No leads available in this audience at the moment',
        count: 0,
        filtered: 0,
      })
    }

    // Transform leads and filter through quality gate
    const rejectionReasons: Record<string, number> = {}
    const leadsToInsert = leads
      .map((lead: AudienceLabLead) => {
        const firstName = lead.FIRST_NAME || ''
        const lastName = lead.LAST_NAME || ''
        const email = lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL || lead.PERSONAL_VERIFIED_EMAILS?.[0] || null

        return {
          first_name: firstName,
          last_name: lastName,
          email,
          company_name: lead.COMPANY_NAME || '',
          workspace_id: userProfile.workspace_id,
          full_name: `${firstName} ${lastName}`.trim() || 'Unknown',
          phone: lead.MOBILE_PHONE || lead.DIRECT_NUMBER || lead.PERSONAL_PHONE || lead.COMPANY_PHONE || null,
          job_title: lead.JOB_TITLE || lead.HEADLINE || '',
          source: 'audience_labs_onboarding',
          status: 'new',
          delivered_at: new Date().toISOString(),
          metadata: {
            city: lead.COMPANY_CITY || lead.PERSONAL_CITY,
            state: lead.COMPANY_STATE || lead.PERSONAL_STATE,
            zip: lead.COMPANY_ZIP || lead.PERSONAL_ZIP,
            domain: lead.COMPANY_DOMAIN,
            industry: lead.COMPANY_INDUSTRY,
            employee_count: lead.COMPANY_EMPLOYEE_COUNT,
            revenue: lead.COMPANY_REVENUE,
            linkedin: lead.LINKEDIN_URL,
            company_linkedin: lead.COMPANY_LINKEDIN_URL,
            uuid: lead.UUID,
          },
        }
      })
      .filter((lead) => {
        const result = meetsQualityBar(lead)
        if (!result.passes) {
          rejectionReasons[result.reason!] = (rejectionReasons[result.reason!] || 0) + 1
          return false
        }
        return true
      })

    // Log filtered lead counts for monitoring
    const totalFetched = leads.length
    const totalFiltered = totalFetched - leadsToInsert.length
    if (totalFiltered > 0) {
      safeError(`[PopulateInitialLeads] Filtered ${totalFiltered} of ${totalFetched} leads`, {
        reasons: rejectionReasons,
      })
    }

    // Dedup: check existing emails in this workspace to prevent duplicate delivery
    const candidateEmails = leadsToInsert
      .map((l) => l.email)
      .filter((e): e is string => !!e)

    let existingEmails = new Set<string>()
    if (candidateEmails.length > 0) {
      const { data: existing } = await supabase
        .from('leads')
        .select('email')
        .eq('workspace_id', userProfile.workspace_id)
        .in('email', candidateEmails)

      existingEmails = new Set(
        (existing || []).map((e: { email: string | null }) => e.email).filter(Boolean) as string[]
      )
    }

    const dedupedLeads = leadsToInsert.filter((lead) => {
      if (lead.email && existingEmails.has(lead.email)) return false
      return true
    })

    const dedupCount = leadsToInsert.length - dedupedLeads.length
    if (dedupCount > 0) {
      safeError(`[PopulateInitialLeads] Deduped ${dedupCount} leads already in workspace`, {
        workspace_id: userProfile.workspace_id,
      })
    }

    if (dedupedLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All leads were already in your workspace',
        count: 0,
        filtered: totalFiltered,
        deduped: dedupCount,
      })
    }

    const { error: insertError } = await supabase
      .from('leads')
      .insert(dedupedLeads)

    if (insertError) {
      safeError('[PopulateInitialLeads] Failed to insert leads:', insertError)
      return NextResponse.json(
        { error: 'Failed to save leads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${dedupedLeads.length} fresh leads!`,
      count: dedupedLeads.length,
      filtered: totalFiltered,
      deduped: dedupCount,
      audience: segmentMapping.segment_name,
    })
  } catch (error: any) {
    safeError('[PopulateInitialLeads] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
