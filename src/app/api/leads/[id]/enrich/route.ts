/**
 * Lead Enrichment API
 * POST /api/leads/[id]/enrich
 *
 * Enriches a single lead using Audience Labs /enrich endpoint.
 * Costs 1 credit per call. Fills in any missing contact/company fields.
 * Returns before/after field comparison so the UI can animate the reveal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrich } from '@/lib/audiencelab/api-client'

const ENRICH_CREDIT_COST = 1

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile + credit state
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, workspace_id, daily_credits_used, daily_credit_limit, plan')
      .eq('auth_user_id', user.id)
      .single()

    if (!userProfile?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    // Credit gate
    const creditsUsed = userProfile.daily_credits_used ?? 0
    const creditLimit = userProfile.daily_credit_limit ?? 3
    const creditsRemaining = Math.max(0, creditLimit - creditsUsed)

    if (creditsRemaining < ENRICH_CREDIT_COST) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          credits_remaining: creditsRemaining,
          credits_required: ENRICH_CREDIT_COST,
          upgrade_url: '/settings/billing',
        },
        { status: 402 }
      )
    }

    // Fetch the lead — must belong to user's workspace
    const { data: lead } = await supabase
      .from('leads')
      .select('id, workspace_id, first_name, last_name, full_name, email, phone, company_name, company_domain, job_title, city, state, linkedin_url, metadata')
      .eq('id', leadId)
      .eq('workspace_id', userProfile.workspace_id)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Build the enrichment filter — use whatever identifiers we have
    const firstName = lead.first_name || lead.full_name?.split(' ')[0] || undefined
    const lastName = lead.last_name || (lead.full_name?.split(' ').length > 1 ? lead.full_name?.split(' ').slice(1).join(' ') : undefined)

    const enrichFilter: Record<string, string> = {}
    if (lead.email) enrichFilter.email = lead.email
    if (firstName) enrichFilter.first_name = firstName
    if (lastName) enrichFilter.last_name = lastName
    if (lead.company_name) enrichFilter.company = lead.company_name
    if (lead.phone) enrichFilter.phone = lead.phone

    if (Object.keys(enrichFilter).length === 0) {
      return NextResponse.json(
        { error: 'Lead has no identifiable fields to enrich from' },
        { status: 400 }
      )
    }

    // Call Audience Labs /enrich
    const enrichResult = await enrich({ filter: enrichFilter })

    if (!enrichResult.found || !enrichResult.result?.length) {
      // Still deduct a credit — the API was called
      await adminSupabase
        .from('users')
        .update({ daily_credits_used: creditsUsed + ENRICH_CREDIT_COST })
        .eq('id', userProfile.id)

      return NextResponse.json({
        success: false,
        message: 'No additional data found for this lead',
        credits_used: ENRICH_CREDIT_COST,
        credits_remaining: creditsRemaining - ENRICH_CREDIT_COST,
        fields_added: [],
      })
    }

    const profile = enrichResult.result[0]

    // Map enriched data back to lead fields — only fill in what's currently empty
    const before = {
      email: lead.email,
      phone: lead.phone,
      company_name: lead.company_name,
      company_domain: lead.company_domain,
      job_title: lead.job_title,
      city: lead.city,
      state: lead.state,
      linkedin_url: lead.linkedin_url,
    }

    // Build updates — prefer verified emails, respect existing data
    const bve = typeof profile.BUSINESS_VERIFIED_EMAILS === 'string'
      ? profile.BUSINESS_VERIFIED_EMAILS.split(',')[0]?.trim()
      : Array.isArray(profile.BUSINESS_VERIFIED_EMAILS)
        ? profile.BUSINESS_VERIFIED_EMAILS[0]
        : null
    const pve = typeof profile.PERSONAL_VERIFIED_EMAILS === 'string'
      ? profile.PERSONAL_VERIFIED_EMAILS.split(',')[0]?.trim()
      : Array.isArray(profile.PERSONAL_VERIFIED_EMAILS)
        ? profile.PERSONAL_VERIFIED_EMAILS[0]
        : null

    const enrichedEmail = bve || pve || profile.BUSINESS_EMAIL || (profile.PERSONAL_EMAILS as string)?.split(',')?.[0]?.trim() || null
    const enrichedPhone = profile.MOBILE_PHONE || profile.DIRECT_NUMBER || profile.PERSONAL_PHONE || null
    const enrichedLinkedIn = profile.LINKEDIN_URL as string || null

    const updates: Record<string, string | null> = {}
    if (!lead.email && enrichedEmail) updates.email = enrichedEmail
    if (!lead.phone && enrichedPhone) updates.phone = enrichedPhone as string
    if (!lead.company_name && profile.COMPANY_NAME) updates.company_name = profile.COMPANY_NAME as string
    if (!lead.company_domain && profile.COMPANY_DOMAIN) updates.company_domain = profile.COMPANY_DOMAIN as string
    if (!lead.job_title && (profile.JOB_TITLE || profile.HEADLINE)) updates.job_title = (profile.JOB_TITLE || profile.HEADLINE) as string
    if (!lead.city && (profile.PERSONAL_CITY || profile.COMPANY_CITY)) updates.city = (profile.PERSONAL_CITY || profile.COMPANY_CITY) as string
    if (!lead.state && (profile.PERSONAL_STATE || profile.COMPANY_STATE)) updates.state = (profile.PERSONAL_STATE || profile.COMPANY_STATE) as string
    if (!lead.linkedin_url && enrichedLinkedIn) updates.linkedin_url = enrichedLinkedIn

    const fieldsAdded = Object.keys(updates)

    // Apply updates if there are any new fields
    if (fieldsAdded.length > 0) {
      const { error: updateError } = await adminSupabase
        .from('leads')
        .update({
          ...updates,
          enrichment_status: 'enriched',
          enriched_at: new Date().toISOString(),
          enrichment_attempts: (lead as any).enrichment_attempts + 1 || 1,
        })
        .eq('id', leadId)

      if (updateError) {
        console.error('[Enrich] Failed to update lead:', updateError)
        return NextResponse.json({ error: 'Failed to save enrichment' }, { status: 500 })
      }
    }

    // Deduct credit regardless of whether fields were added (API was called)
    await adminSupabase
      .from('users')
      .update({ daily_credits_used: creditsUsed + ENRICH_CREDIT_COST })
      .eq('id', userProfile.id)

    const after = { ...before, ...updates }

    return NextResponse.json({
      success: true,
      fields_added: fieldsAdded,
      before,
      after,
      credits_used: ENRICH_CREDIT_COST,
      credits_remaining: creditsRemaining - ENRICH_CREDIT_COST,
    })
  } catch (error: any) {
    console.error('[Enrich] Unexpected error:', error)
    return NextResponse.json({ error: 'Enrichment failed', details: error.message }, { status: 500 })
  }
}
