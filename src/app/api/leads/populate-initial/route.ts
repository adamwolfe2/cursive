/**
 * Populate Initial Leads API
 *
 * Triggered IMMEDIATELY after user onboarding to fetch fresh leads
 * from Audience Labs and populate their workspace.
 *
 * This ensures users see leads right away instead of waiting for daily cron.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchLeadsFromSegment, type AudienceLabLead } from '@/lib/services/audiencelab.service'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[PopulateInitialLeads] Request from user:', session.user.id)

    // Get user profile with workspace and segment info
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, workspace_id, industry_segment, location_segment, daily_lead_limit, plan, is_active')
      .eq('auth_user_id', session.user.id)
      .single()

    if (userError || !userProfile) {
      console.error('[PopulateInitialLeads] User not found:', userError)
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

    console.log('[PopulateInitialLeads] User profile:', {
      id: userProfile.id,
      workspace_id: userProfile.workspace_id,
      industry: userProfile.industry_segment,
      location: userProfile.location_segment,
      limit: userProfile.daily_lead_limit,
    })

    // Check if user already received leads today (prevent multiple calls)
    const today = new Date().toISOString().split('T')[0]
    const { count: todayLeadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id)
      .gte('delivered_at', `${today}T00:00:00`)
      .lte('delivered_at', `${today}T23:59:59`)

    if (todayLeadsCount && todayLeadsCount >= userProfile.daily_lead_limit) {
      console.log('[PopulateInitialLeads] User already received daily limit:', todayLeadsCount)
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
      console.error('[PopulateInitialLeads] No audience mapping found:', {
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

    console.log('[PopulateInitialLeads] Found audience mapping:', {
      segment_id: segmentMapping.segment_id,
      segment_name: segmentMapping.segment_name,
    })

    // Determine how many leads to fetch (based on plan)
    const leadLimit = userProfile.daily_lead_limit || (userProfile.plan === 'free' ? 10 : 100)

    // Fetch leads from Audience Labs
    console.log('[PopulateInitialLeads] Fetching leads from Audience Labs...')
    const leads = await fetchLeadsFromSegment(segmentMapping.segment_id, {
      page: 1,
      pageSize: leadLimit,
    })

    if (leads.length === 0) {
      console.warn('[PopulateInitialLeads] No leads returned from audience')
      return NextResponse.json({
        success: true,
        message: 'No leads available in this audience at the moment',
        count: 0,
      })
    }

    console.log('[PopulateInitialLeads] Fetched leads:', leads.length)

    // Transform and insert leads
    const leadsToInsert = leads.map((lead: AudienceLabLead) => ({
      workspace_id: userProfile.workspace_id,
      full_name: `${lead.FIRST_NAME || ''} ${lead.LAST_NAME || ''}`.trim() || 'Unknown',
      email: lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL || lead.PERSONAL_VERIFIED_EMAILS?.[0] || null,
      phone: lead.MOBILE_PHONE || lead.DIRECT_NUMBER || lead.PERSONAL_PHONE || lead.COMPANY_PHONE || null,
      company_name: lead.COMPANY_NAME || '',
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
    }))

    const { error: insertError, count } = await supabase
      .from('leads')
      .insert(leadsToInsert)

    if (insertError) {
      console.error('[PopulateInitialLeads] Failed to insert leads:', insertError)
      return NextResponse.json(
        { error: 'Failed to save leads', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('[PopulateInitialLeads] Successfully inserted leads:', count || leadsToInsert.length)

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${leadsToInsert.length} fresh leads!`,
      count: leadsToInsert.length,
      audience: segmentMapping.segment_name,
    })
  } catch (error: any) {
    console.error('[PopulateInitialLeads] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
