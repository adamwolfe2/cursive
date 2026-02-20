/**
 * Lead Enrichment API
 * POST /api/leads/[id]/enrich
 *
 * Enriches a single lead using the enrichment API.
 * Costs 1 credit per call. Fills in any missing contact/company fields.
 * Returns before/after field comparison so the UI can animate the reveal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrich } from '@/lib/audiencelab/api-client'
import { safeError } from '@/lib/utils/log-sanitizer'

const ENRICH_CREDIT_COST = 1

/** Non-blocking enrichment log insert */
async function logEnrichment(
  adminSupabase: ReturnType<typeof createAdminClient>,
  params: {
    workspace_id: string
    lead_id: string
    user_id: string
    status: 'success' | 'failed' | 'no_data'
    credits_used: number
    fields_added: string[]
  }
) {
  try {
    await adminSupabase.from('enrichment_log').insert(params)
  } catch {
    // Non-blocking — don't let logging failures disrupt enrichment
  }
}

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
      .maybeSingle()

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
      .select('id, workspace_id, first_name, last_name, full_name, email, phone, company_name, company_domain, job_title, city, state, linkedin_url, metadata, enrichment_status, enriched_at')
      .eq('id', leadId)
      .eq('workspace_id', userProfile.workspace_id)
      .maybeSingle()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Prevent double-charge: if already enriched or previously failed, don't charge again
    if (lead.enrichment_status === 'enriched') {
      return NextResponse.json({
        success: true,
        message: 'Lead is already enriched',
        fields_added: [],
        already_enriched: true,
        credits_used: 0,
        credits_remaining: creditsRemaining,
      })
    }

    if (lead.enrichment_status === 'failed') {
      // Allow retry after 30-day cooldown — AudienceLabs data refreshes over time
      const RETRY_COOLDOWN_DAYS = 30
      const enrichedAt = lead.enriched_at ? new Date(lead.enriched_at) : null
      const cooldownExpired = enrichedAt
        ? Date.now() - enrichedAt.getTime() > RETRY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
        : true // No enriched_at = legacy lead, allow retry

      if (!cooldownExpired) {
        const daysLeft = Math.ceil(
          (RETRY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000 - (Date.now() - enrichedAt!.getTime())) / (24 * 60 * 60 * 1000)
        )
        return NextResponse.json({
          success: false,
          message: `No additional data was found previously. You can retry in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
          fields_added: [],
          credits_used: 0,
          credits_remaining: creditsRemaining,
          retry_available_at: new Date(enrichedAt!.getTime() + RETRY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      // Cooldown expired — reset status to allow re-enrichment
      await adminSupabase
        .from('leads')
        .update({ enrichment_status: 'pending' })
        .eq('id', leadId)
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
      // Still deduct a credit atomically — the API was called
      await adminSupabase.rpc('increment_credits', {
        user_id: userProfile.id,
        amount: ENRICH_CREDIT_COST,
      })

      // Mark lead as enrichment_failed with timestamp for cooldown tracking
      await adminSupabase
        .from('leads')
        .update({
          enrichment_status: 'failed',
          enriched_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      logEnrichment(adminSupabase, {
        workspace_id: userProfile.workspace_id,
        lead_id: leadId,
        user_id: userProfile.id,
        status: 'no_data',
        credits_used: ENRICH_CREDIT_COST,
        fields_added: [],
      })

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
        safeError('[Enrich] Failed to update lead:', updateError)
        return NextResponse.json({ error: 'Failed to save enrichment' }, { status: 500 })
      }
    }

    // Deduct credit atomically regardless of whether fields were added (API was called)
    await adminSupabase.rpc('increment_credits', {
      user_id: userProfile.id,
      amount: ENRICH_CREDIT_COST,
    })

    logEnrichment(adminSupabase, {
      workspace_id: userProfile.workspace_id,
      lead_id: leadId,
      user_id: userProfile.id,
      status: 'success',
      credits_used: ENRICH_CREDIT_COST,
      fields_added: fieldsAdded,
    })

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
    safeError('[Enrich] Unexpected error:', error)
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 })
  }
}
