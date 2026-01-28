// Marketplace Background Jobs
// Partner score calculation, freshness decay, and volume bonus updates

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateVolumeBonus, COMMISSION_CONFIG } from '@/lib/services/commission.service'
import { calculateFreshnessScore, calculateMarketplacePrice } from '@/lib/services/lead-scoring.service'

// Partner score weights per spec
const PARTNER_SCORE_WEIGHTS = {
  VERIFICATION_PASS_RATE: 0.35,
  DUPLICATE_RATE: 0.20,
  DATA_COMPLETENESS: 0.15,
  FRESHNESS_AT_SALE: 0.15,
  BUYER_SATISFACTION: 0.15, // Placeholder for now
}

/**
 * Daily freshness score decay job
 * Updates freshness scores for all marketplace leads using sigmoid decay
 */
export const dailyFreshnessDecay = inngest.createFunction(
  {
    id: 'marketplace-freshness-decay',
    name: 'Daily Freshness Score Decay',
    retries: 2,
  },
  { cron: '0 0 * * *' }, // Midnight daily
  async ({ step, logger }) => {
    const supabase = createAdminClient()

    // Process in batches to avoid timeouts
    const batchSize = 1000
    let totalUpdated = 0
    let hasMore = true
    let offset = 0

    while (hasMore) {
      const result = await step.run(`update-batch-${offset}`, async () => {
        // Get leads that need updating
        const { data: leads, error } = await supabase
          .from('leads')
          .select('id, created_at, phone, verification_status, intent_score_calculated')
          .eq('is_marketplace_listed', true)
          .range(offset, offset + batchSize - 1)
          .order('id')

        if (error) {
          throw new Error(`Failed to fetch leads: ${error.message}`)
        }

        if (!leads || leads.length === 0) {
          return { updated: 0, hasMore: false }
        }

        // Update each lead's freshness score and price
        let updated = 0
        for (const lead of leads) {
          const createdAt = new Date(lead.created_at)
          const freshnessScore = calculateFreshnessScore(createdAt)
          const marketplacePrice = calculateMarketplacePrice({
            intentScore: lead.intent_score_calculated || 50,
            freshnessScore,
            hasPhone: !!lead.phone,
            verificationStatus: lead.verification_status || 'pending',
          })

          const { error: updateError } = await supabase
            .from('leads')
            .update({
              freshness_score: freshnessScore,
              marketplace_price: marketplacePrice,
            })
            .eq('id', lead.id)

          if (!updateError) {
            updated++
          }
        }

        return {
          updated,
          hasMore: leads.length === batchSize,
        }
      })

      totalUpdated += result.updated
      hasMore = result.hasMore
      offset += batchSize
    }

    logger.info(`Freshness decay completed: ${totalUpdated} leads updated`)

    return { totalUpdated }
  }
)

/**
 * Daily partner score calculation job
 * Calculates weighted partner scores based on various metrics
 */
export const dailyPartnerScoreCalculation = inngest.createFunction(
  {
    id: 'marketplace-partner-score',
    name: 'Daily Partner Score Calculation',
    retries: 2,
  },
  { cron: '0 2 * * *' }, // 2 AM daily
  async ({ step, logger }) => {
    const supabase = createAdminClient()

    // Get all active partners
    const { data: partners, error } = await supabase
      .from('partners')
      .select('id')
      .eq('is_active', true)

    if (error || !partners) {
      throw new Error(`Failed to fetch partners: ${error?.message}`)
    }

    let updated = 0

    for (const partner of partners) {
      await step.run(`score-partner-${partner.id}`, async () => {
        const score = await calculatePartnerScore(partner.id)

        // Update partner score
        await supabase
          .from('partners')
          .update({
            partner_score: score.totalScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partner.id)

        // Store score history
        await supabase
          .from('partner_score_history')
          .insert({
            partner_id: partner.id,
            score: score.totalScore,
            components: score.components,
          })

        updated++
      })
    }

    logger.info(`Partner scores calculated for ${updated} partners`)

    return { updated }
  }
)

/**
 * Calculate partner score based on weighted metrics
 */
async function calculatePartnerScore(partnerId: string): Promise<{
  totalScore: number
  components: Record<string, number>
}> {
  const supabase = createAdminClient()

  // Get partner data
  const { data: partner, error } = await supabase
    .from('partners')
    .select('verification_pass_rate, duplicate_rate, data_completeness_rate')
    .eq('id', partnerId)
    .single()

  if (error || !partner) {
    return { totalScore: 50, components: {} }
  }

  const components: Record<string, number> = {}

  // 1. Verification pass rate (35%) - higher is better
  const verificationScore = Math.min(100, (partner.verification_pass_rate || 0))
  components.verification = verificationScore

  // 2. Duplicate rate (20%) - lower is better (invert)
  const duplicateScore = Math.max(0, 100 - (partner.duplicate_rate || 0) * 2)
  components.duplicates = duplicateScore

  // 3. Data completeness (15%) - higher is better
  const completenessScore = partner.data_completeness_rate || 50
  components.completeness = completenessScore

  // 4. Freshness at sale (15%) - average freshness when leads sold
  const { data: soldLeads } = await supabase
    .from('marketplace_purchase_items')
    .select('freshness_score_at_purchase')
    .eq('partner_id', partnerId)
    .limit(100)

  let freshnessScore = 70 // Default
  if (soldLeads && soldLeads.length > 0) {
    const avgFreshness = soldLeads.reduce((sum, l) => sum + (l.freshness_score_at_purchase || 70), 0) / soldLeads.length
    freshnessScore = avgFreshness
  }
  components.freshness = freshnessScore

  // 5. Buyer satisfaction (15%) - placeholder (neutral 70)
  // TODO: Implement when we have buyer feedback/ratings
  const satisfactionScore = 70
  components.satisfaction = satisfactionScore

  // Calculate weighted total
  const totalScore = Math.round(
    components.verification * PARTNER_SCORE_WEIGHTS.VERIFICATION_PASS_RATE +
    components.duplicates * PARTNER_SCORE_WEIGHTS.DUPLICATE_RATE +
    components.completeness * PARTNER_SCORE_WEIGHTS.DATA_COMPLETENESS +
    components.freshness * PARTNER_SCORE_WEIGHTS.FRESHNESS_AT_SALE +
    components.satisfaction * PARTNER_SCORE_WEIGHTS.BUYER_SATISFACTION
  )

  return { totalScore, components }
}

/**
 * Monthly volume bonus update job
 * Updates partner volume bonus eligibility based on monthly uploads
 */
export const monthlyVolumeBonusUpdate = inngest.createFunction(
  {
    id: 'marketplace-volume-bonus',
    name: 'Monthly Volume Bonus Update',
    retries: 2,
  },
  { cron: '0 3 1 * *' }, // 3 AM on 1st of each month
  async ({ step, logger }) => {
    const supabase = createAdminClient()

    // Get all active partners
    const { data: partners, error } = await supabase
      .from('partners')
      .select('id')
      .eq('is_active', true)

    if (error || !partners) {
      throw new Error(`Failed to fetch partners: ${error?.message}`)
    }

    let eligible = 0
    let notEligible = 0

    for (const partner of partners) {
      const result = await step.run(`volume-bonus-${partner.id}`, async () => {
        const bonus = await calculateVolumeBonus(partner.id)

        // Update partner bonus commission rate
        await supabase
          .from('partners')
          .update({
            bonus_commission_rate: bonus.bonusRate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partner.id)

        return bonus.eligible
      })

      if (result) {
        eligible++
      } else {
        notEligible++
      }
    }

    logger.info(`Volume bonus update: ${eligible} eligible, ${notEligible} not eligible`)

    return { eligible, notEligible }
  }
)

/**
 * Check and process referral milestones
 * Runs daily to check partner referral milestones
 */
export const processReferralMilestones = inngest.createFunction(
  {
    id: 'marketplace-referral-milestones',
    name: 'Process Referral Milestones',
    retries: 2,
  },
  { cron: '0 4 * * *' }, // 4 AM daily
  async ({ step, logger }) => {
    const supabase = createAdminClient()

    // Get pending partner referrals
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('id')
      .eq('referral_type', 'partner_to_partner')
      .neq('status', 'rewarded')

    if (error || !referrals) {
      return { checked: 0, rewarded: 0 }
    }

    let rewarded = 0

    for (const referral of referrals) {
      await step.run(`check-referral-${referral.id}`, async () => {
        // Import dynamically to avoid circular deps
        const { processPartnerReferralMilestones } = await import('@/lib/services/referral.service')
        const result = await processPartnerReferralMilestones(referral.id)

        if (result.milestonesAwarded.length > 0) {
          rewarded++
        }
      })
    }

    logger.info(`Referral milestones: checked ${referrals.length}, rewarded ${rewarded}`)

    return { checked: referrals.length, rewarded }
  }
)

/**
 * Update partner data completeness rates
 * Calculates average data completeness for partner's leads
 */
export const updatePartnerDataCompleteness = inngest.createFunction(
  {
    id: 'marketplace-data-completeness',
    name: 'Update Partner Data Completeness',
    retries: 2,
  },
  { cron: '0 5 * * *' }, // 5 AM daily
  async ({ step, logger }) => {
    const supabase = createAdminClient()

    // Get all active partners
    const { data: partners, error } = await supabase
      .from('partners')
      .select('id')
      .eq('is_active', true)

    if (error || !partners) {
      return { updated: 0 }
    }

    let updated = 0

    for (const partner of partners) {
      await step.run(`completeness-${partner.id}`, async () => {
        // Get sample of partner's leads
        const { data: leads } = await supabase
          .from('leads')
          .select('phone, company_name, company_domain, job_title, seniority_level, company_size, city, state')
          .eq('partner_id', partner.id)
          .limit(200)

        if (!leads || leads.length === 0) return

        // Calculate average completeness
        const fields = ['phone', 'company_name', 'company_domain', 'job_title', 'seniority_level', 'company_size', 'city', 'state']
        let totalCompleteness = 0

        for (const lead of leads) {
          let filled = 0
          for (const field of fields) {
            if (lead[field as keyof typeof lead]) {
              filled++
            }
          }
          totalCompleteness += (filled / fields.length) * 100
        }

        const avgCompleteness = totalCompleteness / leads.length

        await supabase
          .from('partners')
          .update({
            data_completeness_rate: Math.round(avgCompleteness * 100) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partner.id)

        updated++
      })
    }

    logger.info(`Data completeness updated for ${updated} partners`)

    return { updated }
  }
)
