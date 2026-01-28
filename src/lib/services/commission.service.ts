// Commission Calculation Service
// Handles commission calculation for partner payouts

import type { Partner, CommissionCalculation } from '@/types/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

// Commission configuration
export const COMMISSION_CONFIG = {
  // Base commission rate (30%)
  BASE_RATE: 0.30,

  // Bonus rates
  FRESH_SALE_BONUS: 0.10, // Lead sold within 7 days of upload
  HIGH_VERIFICATION_BONUS: 0.05, // Partner has 95%+ verification rate
  VOLUME_BONUS: 0.05, // Partner uploaded 10K+ leads this month

  // Maximum commission rate (50%)
  MAX_RATE: 0.50,

  // Holdback period in days
  HOLDBACK_DAYS: 14,

  // Minimum payout threshold
  MIN_PAYOUT_AMOUNT: 50,

  // Fresh sale threshold in days
  FRESH_SALE_DAYS: 7,

  // High verification threshold
  HIGH_VERIFICATION_THRESHOLD: 95,

  // Volume bonus threshold
  VOLUME_THRESHOLD: 10000,
}

interface CommissionInput {
  salePrice: number
  partner: Partner
  leadCreatedAt: Date
  saleDate?: Date
}

/**
 * Calculate commission for a lead sale
 */
export function calculateCommission(input: CommissionInput): CommissionCalculation {
  const { salePrice, partner, leadCreatedAt, saleDate = new Date() } = input

  let rate = partner.base_commission_rate || COMMISSION_CONFIG.BASE_RATE
  const bonuses: string[] = []

  // 1. Fresh sale bonus (sold within 7 days of upload)
  const daysSinceUpload = Math.floor(
    (saleDate.getTime() - leadCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSinceUpload <= COMMISSION_CONFIG.FRESH_SALE_DAYS) {
    rate += COMMISSION_CONFIG.FRESH_SALE_BONUS
    bonuses.push('fresh_sale')
  }

  // 2. High verification rate bonus (95%+)
  if (partner.verification_pass_rate >= COMMISSION_CONFIG.HIGH_VERIFICATION_THRESHOLD) {
    rate += COMMISSION_CONFIG.HIGH_VERIFICATION_BONUS
    bonuses.push('high_verification')
  }

  // 3. Volume bonus (10K+ leads this month)
  // Note: This would need to be calculated based on monthly upload count
  // For now, we use the partner's bonus_commission_rate if set
  if (partner.bonus_commission_rate > 0) {
    rate += partner.bonus_commission_rate
    bonuses.push('volume')
  }

  // Cap at maximum rate
  rate = Math.min(rate, COMMISSION_CONFIG.MAX_RATE)

  // Calculate amount
  const amount = salePrice * rate

  return {
    rate,
    amount: Math.round(amount * 10000) / 10000, // Round to 4 decimals
    bonuses,
  }
}

/**
 * Calculate commission payable date (after holdback period)
 */
export function calculatePayableDate(saleDate: Date = new Date()): Date {
  const payableDate = new Date(saleDate)
  payableDate.setDate(payableDate.getDate() + COMMISSION_CONFIG.HOLDBACK_DAYS)
  return payableDate
}

/**
 * Process pending commissions and move them to payable status
 */
export async function processPendingCommissions(): Promise<{
  processed: number
  totalAmount: number
}> {
  const supabase = createAdminClient()

  // Find commissions past holdback period
  const now = new Date()

  const { data: items, error } = await supabase
    .from('marketplace_purchase_items')
    .select('id, commission_amount, partner_id')
    .eq('commission_status', 'pending_holdback')
    .lte('commission_payable_at', now.toISOString())

  if (error) {
    throw new Error(`Failed to fetch pending commissions: ${error.message}`)
  }

  if (!items || items.length === 0) {
    return { processed: 0, totalAmount: 0 }
  }

  // Update to payable status
  const ids = items.map((item) => item.id)
  const { error: updateError } = await supabase
    .from('marketplace_purchase_items')
    .update({ commission_status: 'payable' })
    .in('id', ids)

  if (updateError) {
    throw new Error(`Failed to update commission status: ${updateError.message}`)
  }

  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + (item.commission_amount || 0), 0)

  // Update partner available balances
  const partnerTotals = items.reduce<Record<string, number>>((acc, item) => {
    if (item.partner_id) {
      acc[item.partner_id] = (acc[item.partner_id] || 0) + (item.commission_amount || 0)
    }
    return acc
  }, {})

  for (const [partnerId, amount] of Object.entries(partnerTotals)) {
    const { data: partner } = await supabase
      .from('partners')
      .select('pending_balance, available_balance')
      .eq('id', partnerId)
      .single()

    if (partner) {
      await supabase
        .from('partners')
        .update({
          pending_balance: Math.max(0, (partner.pending_balance || 0) - amount),
          available_balance: (partner.available_balance || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerId)
    }
  }

  return { processed: items.length, totalAmount }
}

/**
 * Get partners eligible for payout
 */
export async function getPartnersEligibleForPayout(): Promise<
  Array<{
    partnerId: string
    partnerName: string
    partnerEmail: string
    availableBalance: number
    stripeAccountId: string | null
    stripeOnboardingComplete: boolean
  }>
> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('partners')
    .select('id, name, email, available_balance, stripe_account_id, stripe_onboarding_complete')
    .gte('available_balance', COMMISSION_CONFIG.MIN_PAYOUT_AMOUNT)
    .eq('is_active', true)
    .neq('status', 'suspended')

  if (error) {
    throw new Error(`Failed to fetch eligible partners: ${error.message}`)
  }

  return (data || []).map((p) => ({
    partnerId: p.id,
    partnerName: p.name,
    partnerEmail: p.email,
    availableBalance: p.available_balance,
    stripeAccountId: p.stripe_account_id,
    stripeOnboardingComplete: p.stripe_onboarding_complete,
  }))
}

/**
 * Record commission for a purchase item
 */
export async function recordCommission(params: {
  purchaseItemId: string
  partnerId: string
  salePrice: number
  leadCreatedAt: Date
}): Promise<void> {
  const supabase = createAdminClient()

  // Get partner data
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('*')
    .eq('id', params.partnerId)
    .single()

  if (partnerError || !partner) {
    throw new Error('Partner not found')
  }

  // Calculate commission
  const commission = calculateCommission({
    salePrice: params.salePrice,
    partner: partner as Partner,
    leadCreatedAt: params.leadCreatedAt,
  })

  const payableAt = calculatePayableDate()

  // Update purchase item with commission details
  const { error: updateError } = await supabase
    .from('marketplace_purchase_items')
    .update({
      commission_rate: commission.rate,
      commission_amount: commission.amount,
      commission_bonuses: commission.bonuses,
      commission_status: 'pending_holdback',
      commission_payable_at: payableAt.toISOString(),
    })
    .eq('id', params.purchaseItemId)

  if (updateError) {
    throw new Error(`Failed to record commission: ${updateError.message}`)
  }

  // Update partner pending balance
  const { error: balanceError } = await supabase
    .from('partners')
    .update({
      pending_balance: (partner.pending_balance || 0) + commission.amount,
      total_earnings: (partner.total_earnings || 0) + commission.amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.partnerId)

  if (balanceError) {
    throw new Error(`Failed to update partner balance: ${balanceError.message}`)
  }

  // Record in partner_earnings table
  await supabase.from('partner_earnings').insert({
    partner_id: params.partnerId,
    lead_id: null, // Can be linked to lead_id if needed
    amount: commission.amount,
    status: 'pending',
    description: `Commission from lead sale (${Math.round(commission.rate * 100)}%)`,
  })
}

/**
 * Calculate partner's current month volume bonus eligibility
 */
export async function calculateVolumeBonus(partnerId: string): Promise<{
  eligible: boolean
  leadsThisMonth: number
  threshold: number
  bonusRate: number
}> {
  const supabase = createAdminClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    throw new Error(`Failed to count partner leads: ${error.message}`)
  }

  const leadsThisMonth = count || 0
  const eligible = leadsThisMonth >= COMMISSION_CONFIG.VOLUME_THRESHOLD

  return {
    eligible,
    leadsThisMonth,
    threshold: COMMISSION_CONFIG.VOLUME_THRESHOLD,
    bonusRate: eligible ? COMMISSION_CONFIG.VOLUME_BONUS : 0,
  }
}

/**
 * Get commission summary for a partner
 */
export async function getPartnerCommissionSummary(partnerId: string): Promise<{
  totalEarned: number
  totalPending: number
  totalAvailable: number
  totalPaidOut: number
  commissionRate: number
  activeBonuses: string[]
}> {
  const supabase = createAdminClient()

  // Get partner data
  const { data: partner, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single()

  if (error || !partner) {
    throw new Error('Partner not found')
  }

  // Get paid out total
  const { data: paidItems } = await supabase
    .from('marketplace_purchase_items')
    .select('commission_amount')
    .eq('partner_id', partnerId)
    .eq('commission_status', 'paid')

  const totalPaidOut = paidItems?.reduce((sum, item) => sum + (item.commission_amount || 0), 0) || 0

  // Determine active bonuses
  const activeBonuses: string[] = []
  if (partner.verification_pass_rate >= COMMISSION_CONFIG.HIGH_VERIFICATION_THRESHOLD) {
    activeBonuses.push('high_verification')
  }

  const volumeBonus = await calculateVolumeBonus(partnerId)
  if (volumeBonus.eligible) {
    activeBonuses.push('volume')
  }

  // Calculate current commission rate
  let rate = partner.base_commission_rate || COMMISSION_CONFIG.BASE_RATE
  if (activeBonuses.includes('high_verification')) {
    rate += COMMISSION_CONFIG.HIGH_VERIFICATION_BONUS
  }
  if (activeBonuses.includes('volume')) {
    rate += COMMISSION_CONFIG.VOLUME_BONUS
  }
  rate = Math.min(rate, COMMISSION_CONFIG.MAX_RATE)

  return {
    totalEarned: partner.total_earnings || 0,
    totalPending: partner.pending_balance || 0,
    totalAvailable: partner.available_balance || 0,
    totalPaidOut,
    commissionRate: rate,
    activeBonuses,
  }
}
