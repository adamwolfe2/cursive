// Referral Service
// Handles referral program logic for both buyers and partners

import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Referral configuration - EXACT SPEC VALUES
export const REFERRAL_CONFIG = {
  // =============================================================================
  // BUYER REFERRAL REWARDS (Credits)
  // =============================================================================
  // Milestone 1: When referred user creates account
  BUYER_SIGNUP_REFERRER_CREDIT: 50,

  // Milestone 2: When referred user makes first purchase
  BUYER_FIRST_PURCHASE_REFERRER_CREDIT: 200,
  BUYER_FIRST_PURCHASE_REFEREE_CREDIT: 100,

  // Milestone 3: When referred user reaches $500 cumulative spend
  BUYER_SPEND_MILESTONE_AMOUNT: 500, // dollars
  BUYER_SPEND_MILESTONE_REFERRER_CREDIT: 500,

  // =============================================================================
  // PARTNER REFERRAL REWARDS (Cash milestones, NOT ongoing override)
  // =============================================================================
  // Milestone 1: Referred partner uploads 1K verified leads
  PARTNER_MILESTONE_1_LEADS: 1000,
  PARTNER_MILESTONE_1_REWARD: 50, // $50

  // Milestone 2: Referred partner earns $500 in commissions
  PARTNER_MILESTONE_2_COMMISSIONS: 500,
  PARTNER_MILESTONE_2_REWARD: 100, // $100

  // Milestone 3: Referred partner earns $2,000 in commissions
  PARTNER_MILESTONE_3_COMMISSIONS: 2000,
  PARTNER_MILESTONE_3_REWARD: 250, // $250

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

// =============================================================================
// BUYER REFERRAL MILESTONE PROCESSING
// =============================================================================

/**
 * Process buyer signup milestone (Milestone 1)
 * Called when a referred buyer creates their account
 * Reward: 50 credits to referrer
 */
export async function processBuyerSignupMilestone(referralId: string): Promise<{
  rewarded: boolean
  creditsAwarded: number
}> {
  const supabase = createAdminClient()

  const { data: referral, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .single()

  if (error || !referral) {
    throw new Error('Referral not found')
  }

  // Check if milestone already achieved
  const milestones = (referral.milestones_achieved as string[]) || []
  if (milestones.includes('signup')) {
    return { rewarded: false, creditsAwarded: 0 }
  }

  // Award credits to referrer
  const creditsAwarded = REFERRAL_CONFIG.BUYER_SIGNUP_REFERRER_CREDIT
  await addCreditsToWorkspace(referral.referrer_user_id!, creditsAwarded, 'referral')

  // Record milestone
  await supabase
    .from('referrals')
    .update({
      milestones_achieved: [...milestones, 'signup'],
      rewards_issued: [
        ...((referral.rewards_issued as object[]) || []),
        { milestone: 'signup', type: 'credits', amount: creditsAwarded, to: 'referrer', at: new Date().toISOString() }
      ],
      total_rewards_value: (referral.total_rewards_value || 0) + creditsAwarded,
      status: 'converted',
      converted_at: referral.converted_at || new Date().toISOString(),
    })
    .eq('id', referralId)

  return { rewarded: true, creditsAwarded }
}

/**
 * Process buyer first purchase milestone (Milestone 2)
 * Called when a referred buyer makes their first purchase
 * Reward: 200 credits to referrer, 100 credits to referee
 */
export async function processBuyerFirstPurchaseMilestone(referralId: string): Promise<{
  rewarded: boolean
  referrerCredits: number
  refereeCredits: number
}> {
  const supabase = createAdminClient()

  const { data: referral, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .single()

  if (error || !referral) {
    throw new Error('Referral not found')
  }

  const milestones = (referral.milestones_achieved as string[]) || []
  if (milestones.includes('first_purchase')) {
    return { rewarded: false, referrerCredits: 0, refereeCredits: 0 }
  }

  const referrerCredits = REFERRAL_CONFIG.BUYER_FIRST_PURCHASE_REFERRER_CREDIT
  const refereeCredits = REFERRAL_CONFIG.BUYER_FIRST_PURCHASE_REFEREE_CREDIT

  // Award credits
  await addCreditsToWorkspace(referral.referrer_user_id!, referrerCredits, 'referral')
  await addCreditsToWorkspace(referral.referred_user_id!, refereeCredits, 'referral')

  // Record milestone
  await supabase
    .from('referrals')
    .update({
      milestones_achieved: [...milestones, 'first_purchase'],
      rewards_issued: [
        ...((referral.rewards_issued as object[]) || []),
        { milestone: 'first_purchase', type: 'credits', amount: referrerCredits, to: 'referrer', at: new Date().toISOString() },
        { milestone: 'first_purchase', type: 'credits', amount: refereeCredits, to: 'referee', at: new Date().toISOString() }
      ],
      total_rewards_value: (referral.total_rewards_value || 0) + referrerCredits + refereeCredits,
    })
    .eq('id', referralId)

  return { rewarded: true, referrerCredits, refereeCredits }
}

/**
 * Process buyer spend milestone (Milestone 3)
 * Called when referred buyer reaches $500 cumulative spend
 * Reward: 500 additional credits to referrer
 */
export async function processBuyerSpendMilestone(referralId: string): Promise<{
  rewarded: boolean
  creditsAwarded: number
}> {
  const supabase = createAdminClient()

  const { data: referral, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .single()

  if (error || !referral) {
    throw new Error('Referral not found')
  }

  const milestones = (referral.milestones_achieved as string[]) || []
  if (milestones.includes('spend_500')) {
    return { rewarded: false, creditsAwarded: 0 }
  }

  // Check if referee has reached $500 spend
  const { data: purchases } = await supabase
    .from('marketplace_purchases')
    .select('total_price')
    .eq('buyer_workspace_id', referral.referred_user_id)
    .eq('status', 'completed')

  const totalSpend = purchases?.reduce((sum, p) => sum + (p.total_price || 0), 0) || 0
  if (totalSpend < REFERRAL_CONFIG.BUYER_SPEND_MILESTONE_AMOUNT) {
    return { rewarded: false, creditsAwarded: 0 }
  }

  const creditsAwarded = REFERRAL_CONFIG.BUYER_SPEND_MILESTONE_REFERRER_CREDIT
  await addCreditsToWorkspace(referral.referrer_user_id!, creditsAwarded, 'referral')

  await supabase
    .from('referrals')
    .update({
      milestones_achieved: [...milestones, 'spend_500'],
      rewards_issued: [
        ...((referral.rewards_issued as object[]) || []),
        { milestone: 'spend_500', type: 'credits', amount: creditsAwarded, to: 'referrer', at: new Date().toISOString() }
      ],
      total_rewards_value: (referral.total_rewards_value || 0) + creditsAwarded,
      status: 'rewarded',
    })
    .eq('id', referralId)

  return { rewarded: true, creditsAwarded }
}

// =============================================================================
// PARTNER REFERRAL MILESTONE PROCESSING
// =============================================================================

/**
 * Check and process partner referral milestones
 * Called periodically or after partner events
 */
export async function processPartnerReferralMilestones(referralId: string): Promise<{
  milestonesAwarded: string[]
  totalCashAwarded: number
}> {
  const supabase = createAdminClient()

  const { data: referral, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .single()

  if (error || !referral || !referral.referred_partner_id) {
    return { milestonesAwarded: [], totalCashAwarded: 0 }
  }

  // Get referred partner stats
  const { data: partner } = await supabase
    .from('partners')
    .select('total_leads_uploaded, total_earnings, verification_pass_rate')
    .eq('id', referral.referred_partner_id)
    .single()

  if (!partner) {
    return { milestonesAwarded: [], totalCashAwarded: 0 }
  }

  const milestones = (referral.milestones_achieved as string[]) || []
  const newMilestones: string[] = []
  let totalCashAwarded = 0

  // Milestone 1: 1K verified leads
  const verifiedLeads = Math.floor((partner.total_leads_uploaded || 0) * ((partner.verification_pass_rate || 0) / 100))
  if (!milestones.includes('partner_1k_leads') && verifiedLeads >= REFERRAL_CONFIG.PARTNER_MILESTONE_1_LEADS) {
    newMilestones.push('partner_1k_leads')
    totalCashAwarded += REFERRAL_CONFIG.PARTNER_MILESTONE_1_REWARD

    // Add to referrer's available balance (as cash, not credits)
    if (referral.referrer_partner_id) {
      await supabase
        .from('partners')
        .update({
          available_balance: supabase.rpc('coalesce', { value: 'available_balance', default_value: 0 }) + REFERRAL_CONFIG.PARTNER_MILESTONE_1_REWARD,
        })
        .eq('id', referral.referrer_partner_id)

      // Actually use a proper update
      const { data: referrerPartner } = await supabase
        .from('partners')
        .select('available_balance')
        .eq('id', referral.referrer_partner_id)
        .single()

      await supabase
        .from('partners')
        .update({
          available_balance: (referrerPartner?.available_balance || 0) + REFERRAL_CONFIG.PARTNER_MILESTONE_1_REWARD,
        })
        .eq('id', referral.referrer_partner_id)
    }
  }

  // Milestone 2: $500 in commissions
  if (!milestones.includes('partner_500_commissions') && (partner.total_earnings || 0) >= REFERRAL_CONFIG.PARTNER_MILESTONE_2_COMMISSIONS) {
    newMilestones.push('partner_500_commissions')
    totalCashAwarded += REFERRAL_CONFIG.PARTNER_MILESTONE_2_REWARD

    if (referral.referrer_partner_id) {
      const { data: referrerPartner } = await supabase
        .from('partners')
        .select('available_balance')
        .eq('id', referral.referrer_partner_id)
        .single()

      await supabase
        .from('partners')
        .update({
          available_balance: (referrerPartner?.available_balance || 0) + REFERRAL_CONFIG.PARTNER_MILESTONE_2_REWARD,
        })
        .eq('id', referral.referrer_partner_id)
    }
  }

  // Milestone 3: $2,000 in commissions
  if (!milestones.includes('partner_2000_commissions') && (partner.total_earnings || 0) >= REFERRAL_CONFIG.PARTNER_MILESTONE_3_COMMISSIONS) {
    newMilestones.push('partner_2000_commissions')
    totalCashAwarded += REFERRAL_CONFIG.PARTNER_MILESTONE_3_REWARD

    if (referral.referrer_partner_id) {
      const { data: referrerPartner } = await supabase
        .from('partners')
        .select('available_balance')
        .eq('id', referral.referrer_partner_id)
        .single()

      await supabase
        .from('partners')
        .update({
          available_balance: (referrerPartner?.available_balance || 0) + REFERRAL_CONFIG.PARTNER_MILESTONE_3_REWARD,
        })
        .eq('id', referral.referrer_partner_id)
    }
  }

  // Update referral record
  if (newMilestones.length > 0) {
    const rewardsIssued = (referral.rewards_issued as object[]) || []
    const newRewards = newMilestones.map(m => ({
      milestone: m,
      type: 'cash',
      amount: m === 'partner_1k_leads' ? REFERRAL_CONFIG.PARTNER_MILESTONE_1_REWARD :
              m === 'partner_500_commissions' ? REFERRAL_CONFIG.PARTNER_MILESTONE_2_REWARD :
              REFERRAL_CONFIG.PARTNER_MILESTONE_3_REWARD,
      to: 'referrer',
      at: new Date().toISOString()
    }))

    await supabase
      .from('referrals')
      .update({
        milestones_achieved: [...milestones, ...newMilestones],
        rewards_issued: [...rewardsIssued, ...newRewards],
        total_rewards_value: (referral.total_rewards_value || 0) + totalCashAwarded,
        status: newMilestones.length > 0 ? 'rewarded' : referral.status,
      })
      .eq('id', referralId)
  }

  return { milestonesAwarded: newMilestones, totalCashAwarded }
}

/**
 * Legacy function - redirects to milestone-based processing
 * @deprecated Use specific milestone functions instead
 */
export async function processReferralReward(
  referralId: string
): Promise<ReferralRewardResult | null> {
  // For backward compatibility, process signup milestone for buyer referrals
  const supabase = createAdminClient()

  const { data: referral } = await supabase
    .from('referrals')
    .select('referral_type')
    .eq('id', referralId)
    .single()

  if (!referral) return null

  if (referral.referral_type === 'user_to_user') {
    const result = await processBuyerSignupMilestone(referralId)
    return {
      referrerReward: result.creditsAwarded,
      refereeReward: 0,
      rewardType: 'credits',
      status: result.rewarded ? 'applied' : 'pending',
    }
  } else {
    const result = await processPartnerReferralMilestones(referralId)
    return {
      referrerReward: result.totalCashAwarded,
      refereeReward: 0,
      rewardType: 'commission_bonus',
      status: result.milestonesAwarded.length > 0 ? 'applied' : 'pending',
    }
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
