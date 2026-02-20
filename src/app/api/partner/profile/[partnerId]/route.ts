/**
 * Partner Profile API
 * GET /api/partner/profile/[partnerId]
 *
 * Requires auth (partner or admin).
 * - If partnerId matches the current user's linked_partner_id → returns full data.
 * - Otherwise → returns anonymized public data.
 *
 * Response shape:
 *   {
 *     partner_name: string          (real name for own profile, anonymized for others)
 *     tier: 'Bronze' | 'Silver' | 'Gold'
 *     is_own_profile: boolean
 *     member_since: string          (ISO date)
 *     total_leads_sold: number
 *     total_earnings: number
 *     conversion_rate: number       (percentage)
 *     monthly_trend: MonthlyTrend[] (last 6 months, oldest first)
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPartnerTier } from '@/lib/services/partner-tier.service'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

export const dynamic = 'force-dynamic'

export interface MonthlyTrend {
  month: string    // "YYYY-MM"
  label: string    // "Jan 2026"
  earnings: number
  leads_sold: number
}

export interface PartnerProfileData {
  partner_name: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  is_own_profile: boolean
  member_since: string
  total_leads_sold: number
  total_earnings: number
  conversion_rate: number
  monthly_trend: MonthlyTrend[]
}

function obscureName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Partner'
  const parts = trimmed.split(/\s+/)
  const firstName = parts[0]
  const lastName = parts.length > 1 ? parts[parts.length - 1] : null
  if (lastName) return `${firstName} ${lastName.charAt(0)}.`
  if (firstName.length > 3) return `${firstName.slice(0, 3)}...`
  return firstName
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 })
    }

    // 1. Auth check — must be logged in
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const isOwnProfile = user.linked_partner_id === partnerId
    const isAdmin = user.role === 'owner' || user.role === 'admin'

    // Partners can only view their own profile or the leaderboard profiles
    // Admins can view any profile with full data
    if (!isOwnProfile && !isAdmin && user.role !== 'partner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Fetch partner data using admin client
    const adminClient = createAdminClient()

    const { data: partner, error: partnerError } = await adminClient
      .from('partners')
      .select('id, name, total_leads_uploaded, created_at')
      .eq('id', partnerId)
      .maybeSingle()

    if (partnerError) {
      safeError('[PartnerProfile] Failed to query partner:', partnerError)
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
    }

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // 3. Compute last 6 months date range
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const sixMonthsAgoIso = sixMonthsAgo.toISOString()

    // 4. Fetch all-time purchases + uploads in parallel
    const [allPurchasesResult, uploadsResult, recentPurchasesResult] = await Promise.all([
      adminClient
        .from('lead_purchases')
        .select('partner_commission, purchased_at')
        .eq('partner_id', partnerId),

      adminClient
        .from('partner_uploads')
        .select('leads_count')
        .eq('partner_id', partnerId),

      adminClient
        .from('lead_purchases')
        .select('partner_commission, purchased_at')
        .eq('partner_id', partnerId)
        .gte('purchased_at', sixMonthsAgoIso),
    ])

    if (allPurchasesResult.error) {
      safeError('[PartnerProfile] Failed to query purchases:', allPurchasesResult.error)
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
    }

    // 5. Aggregate all-time stats
    const allPurchases = allPurchasesResult.data ?? []
    const totalLeadsSold = allPurchases.length
    const totalEarnings =
      Math.round(
        allPurchases.reduce((s, r) => s + (r.partner_commission ?? 0), 0) * 100
      ) / 100

    const totalUploaded = (uploadsResult.data ?? []).reduce(
      (s, r) => s + (r.leads_count ?? 0),
      0
    )
    const conversionRate =
      totalUploaded > 0
        ? Math.round((totalLeadsSold / totalUploaded) * 10000) / 100
        : 0

    // 6. Build 6-month trend (fill in months with 0 if no data)
    const monthlyMap: Record<string, { earnings: number; leads_sold: number }> = {}

    // Initialize all 6 months to 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = { earnings: 0, leads_sold: 0 }
    }

    // Fill in actual data
    for (const row of recentPurchasesResult.data ?? []) {
      const d = new Date(row.purchased_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyMap[key]) {
        monthlyMap[key].earnings += row.partner_commission ?? 0
        monthlyMap[key].leads_sold += 1
      }
    }

    const monthly_trend: MonthlyTrend[] = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, stats]) => {
        const [year, month] = key.split('-')
        const date = new Date(Number(year), Number(month) - 1, 1)
        const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        return {
          month: key,
          label,
          earnings: Math.round(stats.earnings * 100) / 100,
          leads_sold: stats.leads_sold,
        }
      })

    const tierObj = getPartnerTier(partner.total_leads_uploaded ?? 0)

    // 7. Build response — anonymize if not own profile (and not admin)
    const showRealName = isOwnProfile || isAdmin

    const responseData: PartnerProfileData = {
      partner_name: showRealName ? partner.name : obscureName(partner.name),
      tier: tierObj.name,
      is_own_profile: isOwnProfile,
      member_since: partner.created_at,
      total_leads_sold: totalLeadsSold,
      total_earnings: totalEarnings,
      conversion_rate: conversionRate,
      monthly_trend,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    return handleApiError(error)
  }
}
