// Referral Service
// Handles referral program logic for both buyers and partners

import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Referral configuration
export const REFERRAL_CONFIG = {
  // Buyer referral rewards (credits)
  BUYER_REFERRER_CREDIT: 25, // Credits for the referrer when referee makes first purchase
  BUYER_REFEREE_CREDIT: 10, // Credits for the new buyer on signup

  // Partner referral rewards
  PARTNER_REFERRER_BONUS: 0.02, // 2% bonus on referee's first 90 days of sales
  PARTNER_REFEREE_BONUS: 0.05, // 5% bonus commission for first 90 days

  // Time limits
  PARTNER_BONUS_DAYS: 90,

  // Referral code format
  CODE_LENGTH: 8,
  CODE_PREFIX: {
    buyer: 'BUY',
    partner: 'PRT',
  },
}

interface CreateReferralParams {
  referrerId: string
  referrerType: 'buyer' | 'partner'
  refereeId: string
  refereeType: 'buyer' | 'partner'
  referralCode: string
}

interface ReferralRewardResult {
  referrerReward: number
  refereeReward: number
  rewardType: 'credits' | 'commission_bonus'
  status: 'pending' | 'applied'
}

/**
 * Generate a unique referral code
 */
export function generateReferralCode(type: 'buyer' | 'partner'): string {
  const prefix = REFERRAL_CONFIG.CODE_PREFIX[type]
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, REFERRAL_CONFIG.CODE_LENGTH)
  return `${prefix}-${random}`
}

/**
 * Validate a referral code format
 */
export function isValidReferralCode(code: string): boolean {
  const pattern = /^(BUY|PRT)-[A-Z0-9]{8}$/
  return pattern.test(code)
}

/**
 * Get referral type from code
 */
export function getReferralTypeFromCode(code: string): 'buyer' | 'partner' | null {
  if (code.startsWith('BUY-')) return 'buyer'
  if (code.startsWith('PRT-')) return 'partner'
  return null
}

/**
 * Look up a referral code and get referrer info
 */
export async function lookupReferralCode(
  code: string
): Promise<{
  valid: boolean
  referrerId?: string
  referrerType?: 'buyer' | 'partner'
  referrerName?: string
} | null> {
  if (!isValidReferralCode(code)) {
    return { valid: false }
  }

  const supabase = createAdminClient()
  const referralType = getReferralTypeFromCode(code)

  if (referralType === 'buyer') {
    // Look up in workspaces table (buyer referral codes)
    const { data } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('referral_code', code)
      .single()

    if (data) {
      return {
        valid: true,
        referrerId: data.id,
        referrerType: 'buyer',
        referrerName: data.name,
      }
    }
  } else if (referralType === 'partner') {
    // Look up in partners table
    const { data } = await supabase
      .from('partners')
      .select('id, name')
      .eq('referral_code', code)
      .eq('is_active', true)
      .single()

    if (data) {
      return {
        valid: true,
        referrerId: data.id,
        referrerType: 'partner',
        referrerName: data.name,
      }
    }
  }

  return { valid: false }
}

/**
 * Create a referral record when someone signs up with a referral code
 */
export async function createReferral(params: CreateReferralParams): Promise<string> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: params.referrerId,
      referrer_type: params.referrerType,
      referee_id: params.refereeId,
      referee_type: params.refereeType,
      referral_code: params.referralCode,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create referral: ${error.message}`)
  }

  return data.id
}

/**
 * Process referral reward when qualifying action occurs
 * For buyers: first purchase
 * For partners: first lead sale
 */
export async function processReferralReward(
  referralId: string
): Promise<ReferralRewardResult | null> {
  const supabase = createAdminClient()

  // Get referral details
  const { data: referral, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .single()

  if (error || !referral) {
    throw new Error('Referral not found')
  }

  // Check if already processed
  if (referral.status === 'completed') {
    return null
  }

  let referrerReward = 0
  let refereeReward = 0
  let rewardType: 'credits' | 'commission_bonus' = 'credits'

  if (referral.referee_type === 'buyer') {
    // Buyer referral - give credits
    rewardType = 'credits'
    referrerReward = REFERRAL_CONFIG.BUYER_REFERRER_CREDIT
    refereeReward = REFERRAL_CONFIG.BUYER_REFEREE_CREDIT

    // Add credits to referrer's workspace
    if (referral.referrer_type === 'buyer') {
      await addCreditsToWorkspace(referral.referrer_id, referrerReward, 'referral')
    }

    // Add credits to referee's workspace
    await addCreditsToWorkspace(referral.referee_id, refereeReward, 'referral')
  } else if (referral.referee_type === 'partner') {
    // Partner referral - give commission bonus
    rewardType = 'commission_bonus'
    referrerReward = REFERRAL_CONFIG.PARTNER_REFERRER_BONUS * 100 // Store as percentage
    refereeReward = REFERRAL_CONFIG.PARTNER_REFEREE_BONUS * 100

    // Set bonus commission rates on both partners
    const bonusExpiry = new Date()
    bonusExpiry.setDate(bonusExpiry.getDate() + REFERRAL_CONFIG.PARTNER_BONUS_DAYS)

    if (referral.referrer_type === 'partner') {
      await supabase
        .from('partners')
        .update({
          bonus_commission_rate: REFERRAL_CONFIG.PARTNER_REFERRER_BONUS,
          bonus_expires_at: bonusExpiry.toISOString(),
        })
        .eq('id', referral.referrer_id)
    }

    await supabase
      .from('partners')
      .update({
        bonus_commission_rate: REFERRAL_CONFIG.PARTNER_REFEREE_BONUS,
        bonus_expires_at: bonusExpiry.toISOString(),
      })
      .eq('id', referral.referee_id)
  }

  // Update referral status
  await supabase
    .from('referrals')
    .update({
      status: 'completed',
      referrer_reward: referrerReward,
      referee_reward: refereeReward,
      reward_type: rewardType,
      completed_at: new Date().toISOString(),
    })
    .eq('id', referralId)

  return {
    referrerReward,
    refereeReward,
    rewardType,
    status: 'applied',
  }
}

/**
 * Add credits to a workspace from referral
 */
async function addCreditsToWorkspace(
  workspaceId: string,
  amount: number,
  source: string
): Promise<void> {
  const supabase = createAdminClient()

  const { data: existingCredits } = await supabase
    .from('workspace_credits')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single()

  if (existingCredits) {
    await supabase
      .from('workspace_credits')
      .update({
        balance: existingCredits.balance + amount,
        total_earned: existingCredits.total_earned + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
  } else {
    await supabase.from('workspace_credits').insert({
      workspace_id: workspaceId,
      balance: amount,
      total_purchased: 0,
      total_used: 0,
      total_earned: amount,
    })
  }
}

/**
 * Get referral stats for a workspace
 */
export async function getWorkspaceReferralStats(workspaceId: string): Promise<{
  referralCode: string
  totalReferrals: number
  successfulReferrals: number
  totalCreditsEarned: number
  pendingReferrals: number
}> {
  const supabase = createAdminClient()

  // Get workspace referral code
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('referral_code')
    .eq('id', workspaceId)
    .single()

  // Get referral stats
  const { data: referrals } = await supabase
    .from('referrals')
    .select('status, referrer_reward')
    .eq('referrer_id', workspaceId)
    .eq('referrer_type', 'buyer')

  const stats = {
    referralCode: workspace?.referral_code || '',
    totalReferrals: referrals?.length || 0,
    successfulReferrals: referrals?.filter((r) => r.status === 'completed').length || 0,
    totalCreditsEarned: referrals
      ?.filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.referrer_reward || 0), 0) || 0,
    pendingReferrals: referrals?.filter((r) => r.status === 'pending').length || 0,
  }

  return stats
}

/**
 * Get referral stats for a partner
 */
export async function getPartnerReferralStats(partnerId: string): Promise<{
  referralCode: string
  totalReferrals: number
  successfulReferrals: number
  activeBonus: boolean
  bonusRate: number
  bonusExpiresAt: string | null
}> {
  const supabase = createAdminClient()

  // Get partner data
  const { data: partner } = await supabase
    .from('partners')
    .select('referral_code, bonus_commission_rate, bonus_expires_at')
    .eq('id', partnerId)
    .single()

  // Get referral stats
  const { data: referrals } = await supabase
    .from('referrals')
    .select('status')
    .eq('referrer_id', partnerId)
    .eq('referrer_type', 'partner')

  const now = new Date()
  const bonusActive = partner?.bonus_expires_at
    ? new Date(partner.bonus_expires_at) > now
    : false

  return {
    referralCode: partner?.referral_code || '',
    totalReferrals: referrals?.length || 0,
    successfulReferrals: referrals?.filter((r) => r.status === 'completed').length || 0,
    activeBonus: bonusActive,
    bonusRate: bonusActive ? (partner?.bonus_commission_rate || 0) : 0,
    bonusExpiresAt: bonusActive ? partner?.bonus_expires_at : null,
  }
}

/**
 * Generate and assign referral code to a workspace
 */
export async function assignWorkspaceReferralCode(workspaceId: string): Promise<string> {
  const supabase = createAdminClient()

  let code = generateReferralCode('buyer')
  let attempts = 0

  // Ensure uniqueness
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('referral_code', code)
      .single()

    if (!existing) break
    code = generateReferralCode('buyer')
    attempts++
  }

  await supabase
    .from('workspaces')
    .update({ referral_code: code })
    .eq('id', workspaceId)

  return code
}

/**
 * Generate and assign referral code to a partner
 */
export async function assignPartnerReferralCode(partnerId: string): Promise<string> {
  const supabase = createAdminClient()

  let code = generateReferralCode('partner')
  let attempts = 0

  // Ensure uniqueness
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('partners')
      .select('id')
      .eq('referral_code', code)
      .single()

    if (!existing) break
    code = generateReferralCode('partner')
    attempts++
  }

  await supabase
    .from('partners')
    .update({ referral_code: code })
    .eq('id', partnerId)

  return code
}

/**
 * Get pending referrals for background processing
 */
export async function getPendingReferralsForProcessing(): Promise<
  Array<{
    referralId: string
    refereeId: string
    refereeType: 'buyer' | 'partner'
  }>
> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('referrals')
    .select('id, referee_id, referee_type')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    throw new Error(`Failed to fetch pending referrals: ${error.message}`)
  }

  return (data || []).map((r) => ({
    referralId: r.id,
    refereeId: r.referee_id,
    refereeType: r.referee_type as 'buyer' | 'partner',
  }))
}

/**
 * Check if a buyer has made their first purchase (for referral reward trigger)
 */
export async function hasBuyerMadeFirstPurchase(workspaceId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { count } = await supabase
    .from('marketplace_purchases')
    .select('*', { count: 'exact', head: true })
    .eq('buyer_workspace_id', workspaceId)
    .eq('status', 'completed')

  return (count || 0) >= 1
}

/**
 * Check if a partner has had their first lead sold (for referral reward trigger)
 */
export async function hasPartnerMadeFirstSale(partnerId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .gt('sold_count', 0)

  return (count || 0) >= 1
}
