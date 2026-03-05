/**
 * GET/PATCH /api/admin/affiliates/[id]
 * Get application detail + approve/reject/pause/terminate
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendPartnerApproved,
  sendPartnerRejected,
} from '@/lib/email/affiliate-emails'
import { safeError } from '@/lib/utils/log-sanitizer'
import { randomUUID } from 'crypto'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminRole()
    const { id } = await params
    const admin = createAdminClient()

    const { data: application, error } = await admin
      .from('affiliate_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !application) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // If approved, also fetch affiliate record
    let affiliate = null
    if (application.status === 'approved') {
      const { data } = await admin
        .from('affiliates')
        .select('*, referrals:affiliate_referrals(*), commissions:affiliate_commissions(*), milestones:affiliate_milestone_bonuses(*)')
        .eq('application_id', id)
        .maybeSingle()
      affiliate = data
    }

    return NextResponse.json({ application, affiliate })
  } catch (error) {
    safeError('[admin/affiliates/[id]] GET error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminRole()
    const { id } = await params
    const body = await request.json()
    const { action, reviewNotes } = body as { action: string; reviewNotes?: string }

    const admin = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'

    const { data: application, error: fetchError } = await admin
      .from('affiliate_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (action === 'approve') {
      if (application.status !== 'pending') {
        return NextResponse.json({ error: 'Already reviewed' }, { status: 400 })
      }

      // Generate unique 8-char partner code
      let partnerCode = ''
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()
        const { data: existing } = await admin
          .from('affiliates')
          .select('id')
          .eq('partner_code', candidate)
          .maybeSingle()
        if (!existing) { partnerCode = candidate; break }
      }
      if (!partnerCode) {
        return NextResponse.json({ error: 'Failed to generate unique partner code' }, { status: 500 })
      }

      // Create affiliate record
      const { error: affiliateError } = await admin.from('affiliates').insert({
        application_id: id,
        email: application.email,
        first_name: application.first_name,
        last_name: application.last_name,
        partner_code: partnerCode,
        status: 'active',
        total_activations: 0,
        current_tier: 0,
        free_months_earned: 0,
        total_earnings: 0,
        stripe_onboarding_complete: false,
      })

      if (affiliateError) {
        throw new Error(affiliateError.message)
      }

      // Update application
      await admin
        .from('affiliate_applications')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', id)

      const referralUrl = `https://meetcursive.com?ref=${partnerCode}`
      const dashboardUrl = `${appUrl}/affiliate/dashboard`

      sendPartnerApproved(
        application.email,
        application.first_name,
        partnerCode,
        referralUrl,
        dashboardUrl
      ).catch(() => {})

      return NextResponse.json({ success: true, partnerCode })
    }

    if (action === 'reject') {
      await admin
        .from('affiliate_applications')
        .update({
          status: 'rejected',
          review_notes: reviewNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      sendPartnerRejected(application.email, application.first_name).catch(() => {})

      return NextResponse.json({ success: true })
    }

    if (action === 'pause' || action === 'terminate') {
      const newStatus = action === 'pause' ? 'paused' : 'terminated'

      const { data: affiliate } = await admin
        .from('affiliates')
        .select('id')
        .eq('application_id', id)
        .maybeSingle()

      if (affiliate) {
        await admin
          .from('affiliates')
          .update({ status: newStatus })
          .eq('id', affiliate.id)

        if (action === 'terminate') {
          // Mark all pending commissions/bonuses as failed
          await admin
            .from('affiliate_commissions')
            .update({ status: 'failed' })
            .eq('affiliate_id', affiliate.id)
            .eq('status', 'pending')

          await admin
            .from('affiliate_milestone_bonuses')
            .update({ status: 'failed' })
            .eq('affiliate_id', affiliate.id)
            .eq('status', 'pending')
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    safeError('[admin/affiliates/[id]] PATCH error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
