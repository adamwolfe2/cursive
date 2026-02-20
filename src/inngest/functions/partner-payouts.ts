// Partner Payout Inngest Functions
// Handles weekly commission payouts via Stripe Connect

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'
import { COMMISSION_CONFIG, processPendingCommissions, getPartnersEligibleForPayout } from '@/lib/services/commission.service'
import { sendPayoutCompletedEmail } from '@/lib/email/service'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * Weekly partner payout job
 * Runs every Monday at 2 AM UTC
 */
export const weeklyPartnerPayouts = inngest.createFunction(
  {
    id: 'partner-payouts-weekly',
    name: 'Weekly Partner Payouts',
    retries: 2,
    timeouts: { finish: "5m" },
    concurrency: {
      limit: 1, // Only one instance at a time
    },
  },
  { cron: '0 2 * * 1' }, // Every Monday at 2 AM UTC
  async ({ step, logger }) => {
    // Step 1: Process pending commissions (move past holdback to payable)
    const commissionResults = await step.run('process-pending-commissions', async () => {
      return processPendingCommissions()
    })

    logger.info('Processed pending commissions', commissionResults)

    // Step 2: Get eligible partners
    const eligiblePartners = await step.run('get-eligible-partners', async () => {
      return getPartnersEligibleForPayout()
    })

    logger.info(`Found ${eligiblePartners.length} partners eligible for payout`)

    if (eligiblePartners.length === 0) {
      return {
        processed: commissionResults.processed,
        payoutsCreated: 0,
        totalPaid: 0,
      }
    }

    // Step 3: Process each partner payout
    let payoutsCreated = 0
    let totalPaid = 0
    const errors: string[] = []

    for (const partner of eligiblePartners) {
      const result = await step.run(`payout-${partner.partnerId}`, async () => {
        return processPartnerPayout(partner)
      })

      if (result.success) {
        payoutsCreated++
        totalPaid += result.amount
      } else {
        errors.push(`Partner ${partner.partnerId}: ${result.error}`)
      }
    }

    logger.info('Weekly payouts completed', { payoutsCreated, totalPaid, errors })

    return {
      processed: commissionResults.processed,
      payoutsCreated,
      totalPaid,
      errors: errors.length > 0 ? errors : undefined,
    }
  }
)

/**
 * Process individual partner payout
 */
async function processPartnerPayout(partner: {
  partnerId: string
  partnerName: string
  partnerEmail: string
  availableBalance: number
  stripeAccountId: string | null
  stripeOnboardingComplete: boolean
}): Promise<{ success: boolean; amount: number; error?: string; transferId?: string }> {
  const supabase = createAdminClient()

  // Check Stripe Connect account
  if (!partner.stripeAccountId) {
    return {
      success: false,
      amount: 0,
      error: 'No Stripe Connect account linked',
    }
  }

  if (!partner.stripeOnboardingComplete) {
    return {
      success: false,
      amount: 0,
      error: 'Stripe Connect onboarding not complete',
    }
  }

  // Check minimum payout threshold
  if (partner.availableBalance < COMMISSION_CONFIG.MIN_PAYOUT_AMOUNT) {
    return {
      success: false,
      amount: 0,
      error: `Balance $${partner.availableBalance} below minimum $${COMMISSION_CONFIG.MIN_PAYOUT_AMOUNT}`,
    }
  }

  // Generate idempotency key for this payout
  const weekStart = getWeekStart()
  const idempotencyKey = `payout-${partner.partnerId}-${weekStart}`

  // Check if payout already exists for this week
  const { data: existingPayout } = await supabase
    .from('payout_requests')
    .select('id, stripe_transfer_id')
    .eq('partner_id', partner.partnerId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  if (existingPayout) {
    return {
      success: true,
      amount: partner.availableBalance,
      transferId: existingPayout.stripe_transfer_id,
      error: 'Payout already processed this week',
    }
  }

  // Convert to cents for Stripe
  const amountCents = Math.floor(partner.availableBalance * 100)

  try {
    // Create Stripe Transfer
    const stripe = getStripeClient()
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: partner.stripeAccountId,
      description: `Weekly payout for ${partner.partnerName}`,
      metadata: {
        partner_id: partner.partnerId,
        week_start: weekStart,
        payout_type: 'weekly',
      },
    }, {
      idempotencyKey,
    })

    // Create payout record
    const { error: insertError } = await supabase
      .from('payout_requests')
      .insert({
        partner_id: partner.partnerId,
        amount: partner.availableBalance,
        stripe_transfer_id: transfer.id,
        idempotency_key: idempotencyKey,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })

    if (insertError) {
      safeError('Failed to insert payout record:', insertError)
      // Don't fail - transfer already succeeded
    }

    // Atomically update partner balance: decrement by payout amount (not reset to 0)
    // This prevents losing commissions earned between fetch and update
    const { error: balanceError } = await supabase.rpc('process_partner_payout', {
      p_partner_id: partner.partnerId,
      p_payout_amount: partner.availableBalance,
    })

    if (balanceError) {
      safeError('[Payout] Failed to update partner balance atomically:', balanceError)
      // Fallback: direct update (still better than read-then-write)
      await supabase
        .from('partners')
        .update({
          available_balance: 0,
          last_payout_at: new Date().toISOString(),
        })
        .eq('id', partner.partnerId)
    }

    // Mark commissions as paid
    const { data: paidItems } = await supabase
      .from('marketplace_purchase_items')
      .update({
        commission_status: 'paid',
        commission_paid_at: new Date().toISOString(),
      })
      .eq('partner_id', partner.partnerId)
      .eq('commission_status', 'payable')
      .select('lead_id')

    // Send payout completion email
    try {
      const weekEnd = new Date()
      const weekStartDate = new Date(weekStart)

      await sendPayoutCompletedEmail(
        partner.partnerEmail,
        partner.partnerName,
        {
          amount: partner.availableBalance,
          currency: 'usd',
          leadsCount: paidItems?.length || 0,
          periodStart: weekStartDate,
          periodEnd: weekEnd,
          payoutId: transfer.id,
        }
      )
    } catch (emailError) {
      safeError('[Payout] Failed to send completion email:', emailError)
      // Don't fail the payout if email fails
    }

    return {
      success: true,
      amount: partner.availableBalance,
      transferId: transfer.id,
    }
  } catch (error) {
    safeError(`Stripe transfer failed for partner ${partner.partnerId}:`, error)

    // Record failed payout attempt
    await supabase
      .from('payout_requests')
      .insert({
        partner_id: partner.partnerId,
        amount: partner.availableBalance,
        idempotency_key: idempotencyKey,
        status: 'failed',
        failure_reason: error instanceof Error ? error.message : 'Unknown error',
      })

    return {
      success: false,
      amount: 0,
      error: error instanceof Error ? error.message : 'Stripe transfer failed',
    }
  }
}

/**
 * Get week start date string (YYYY-MM-DD)
 */
function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(now)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

/**
 * Manual payout trigger (admin-initiated)
 */
export const triggerManualPayout = inngest.createFunction(
  {
    id: 'partner-payout-manual',
    name: 'Manual Partner Payout',
    retries: 1,
    timeouts: { finish: "5m" },
  },
  { event: 'partner/payout-requested' },
  async ({ event, step, logger }) => {
    const { partnerId, requestedBy } = event.data

    logger.info(`Manual payout requested for partner ${partnerId} by ${requestedBy}`)

    // Wrap DB fetch in step.run for memoization across retries
    const partner = await step.run('fetch-partner', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('partners')
        .select('id, name, email, available_balance, stripe_account_id, stripe_onboarding_complete')
        .eq('id', partnerId)
        .maybeSingle()

      if (error || !data) {
        throw new Error(`Partner not found: ${partnerId}`)
      }

      return data
    })

    // Process payout
    const result = await step.run('process-payout', async () => {
      return processPartnerPayout({
        partnerId: partner.id,
        partnerName: partner.name,
        partnerEmail: partner.email,
        availableBalance: partner.available_balance || 0,
        stripeAccountId: partner.stripe_account_id,
        stripeOnboardingComplete: partner.stripe_onboarding_complete || false,
      })
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    logger.info('Manual payout completed', result)

    return result
  }
)

/**
 * Daily commission release job
 * Moves commissions from pending_holdback to payable after 14 days
 */
export const dailyCommissionRelease = inngest.createFunction(
  {
    id: 'commission-release-daily',
    name: 'Daily Commission Release',
    retries: 2,
    timeouts: { finish: "5m" },
  },
  { cron: '0 1 * * *' }, // 1 AM daily
  async ({ step, logger }) => {
    const results = await step.run('release-commissions', async () => {
      return processPendingCommissions()
    })

    logger.info('Daily commission release completed', results)

    return results
  }
)

/**
 * Reconcile payout statuses with Stripe
 * Runs weekly to catch any missed updates
 */
export const reconcilePayouts = inngest.createFunction(
  {
    id: 'payout-reconciliation',
    name: 'Payout Reconciliation',
    retries: 1,
    timeouts: { finish: "5m" },
  },
  { cron: '0 5 * * 0' }, // 5 AM every Sunday
  async ({ step, logger }) => {
    // Wrap DB fetch in step.run for memoization across retries
    const payouts = await step.run('fetch-payouts-for-reconciliation', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('payout_requests')
        .select('id, stripe_transfer_id, status')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .not('stripe_transfer_id', 'is', null)
        .limit(100)

      if (error || !data) {
        throw new Error('Failed to fetch payouts for reconciliation')
      }

      return data
    })

    let reconciled = 0

    for (const payout of payouts) {
      const wasReversed = await step.run(`reconcile-${payout.id}`, async () => {
        try {
          const stripe = getStripeClient()
          const transfer = await stripe.transfers.retrieve(payout.stripe_transfer_id!)

          // Check if transfer was reversed or failed
          if (transfer.reversed) {
            const supabase = createAdminClient()
            await supabase
              .from('payout_requests')
              .update({ status: 'reversed' })
              .eq('id', payout.id)
            return true
          }
          return false
        } catch (err) {
          safeError(`Failed to reconcile payout ${payout.id}:`, err)
          return false
        }
      })

      if (wasReversed) {
        reconciled++
      }
    }

    logger.info('Payout reconciliation completed', { checked: payouts.length, reconciled })

    return { checked: payouts.length, reconciled }
  }
)
