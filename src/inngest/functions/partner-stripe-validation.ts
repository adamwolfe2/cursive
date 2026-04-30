// Partner Stripe Connect Validation
// Daily cron that checks for incomplete partner Stripe onboarding
// and sends reminder emails to complete setup

import { inngest } from '../client'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { emailLayout, ctaButton, BRAND, escapeHtml } from '@/lib/email/templates/layout'

import { APP_URL } from '@/lib/config/urls'
const LOG_PREFIX = '[PartnerStripeValidation]'
const NOTIFICATION_TITLE = 'Stripe onboarding reminder sent'
const COOLDOWN_DAYS = 7
const MAX_PARTNERS_PER_RUN = 20
const MIN_ACCOUNT_AGE_HOURS = 48

interface IncompletePartner {
  id: string
  name: string
  email: string
  company_name: string | null
  stripe_account_id: string
  stripe_onboarding_complete: boolean
  workspace_id: string | null
  created_at: string
}

interface StripeStatus {
  partnerId: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  nowComplete: boolean
}

/**
 * Daily Partner Stripe Validation
 * Runs at 10 AM CT (3 PM UTC) to check for partners who started
 * Stripe Connect onboarding but haven't completed it.
 */
export const partnerStripeValidation = inngest.createFunction(
  {
    id: 'partner-stripe-validation',
    name: 'Partner Stripe Onboarding Validation',
    retries: 2,
    timeouts: { finish: '5m' },
    concurrency: {
      limit: 1,
    },
  },
  { cron: '0 15 * * *' }, // 10 AM CT = 3 PM UTC
  async ({ step }) => {
    // Step 1: Find partners with incomplete Stripe onboarding
    const incompletePartners = await step.run('find-incomplete-partners', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      // Partners who started onboarding (have stripe_account_id)
      // but haven't completed it, and account is at least 48 hours old
      const cutoffDate = new Date(Date.now() - MIN_ACCOUNT_AGE_HOURS * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('partners')
        .select('id, name, email, company_name, stripe_account_id, stripe_onboarding_complete, workspace_id, created_at')
        .not('stripe_account_id', 'is', null)
        .eq('stripe_onboarding_complete', false)
        .eq('is_active', true)
        .lte('created_at', cutoffDate)
        .limit(MAX_PARTNERS_PER_RUN)

      if (error) {
        safeError(`${LOG_PREFIX} Failed to query incomplete partners:`, error)
        throw new Error(`Failed to query partners: ${error.message}`)
      }

      safeLog(`${LOG_PREFIX} Found ${data?.length ?? 0} partners with incomplete Stripe onboarding`)
      return (data || []) as IncompletePartner[]
    })

    if (incompletePartners.length === 0) {
      safeLog(`${LOG_PREFIX} No incomplete partners found. Done.`)
      return { checked: 0, updated: 0, reminded: 0, skipped: 0 }
    }

    // Step 2: Verify current Stripe status for each partner
    const stripeStatuses: StripeStatus[] = []

    for (const partner of incompletePartners) {
      const status = await step.run(`verify-stripe-${partner.id}`, async () => {
        const { getStripeClient } = await import('@/lib/stripe/client')

        try {
          const stripe = getStripeClient()
          const account = await stripe.accounts.retrieve(partner.stripe_account_id)

          const chargesEnabled = account.charges_enabled ?? false
          const payoutsEnabled = account.payouts_enabled ?? false
          const detailsSubmitted = account.details_submitted ?? false
          const nowComplete = detailsSubmitted && chargesEnabled && payoutsEnabled

          // If onboarding is now complete, update the partner record
          if (nowComplete) {
            const { createAdminClient } = await import('@/lib/supabase/admin')
            const supabase = createAdminClient()

            const { error: updateError } = await supabase
              .from('partners')
              .update({
                stripe_onboarding_complete: true,
                status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('id', partner.id)

            if (updateError) {
              safeError(`${LOG_PREFIX} Failed to update partner ${partner.id}:`, updateError)
            } else {
              safeLog(`${LOG_PREFIX} Partner ${partner.id} Stripe onboarding now complete - updated record`)
            }
          }

          return {
            partnerId: partner.id,
            chargesEnabled,
            payoutsEnabled,
            detailsSubmitted,
            nowComplete,
          } as StripeStatus
        } catch (err) {
          safeError(`${LOG_PREFIX} Failed to retrieve Stripe account for partner ${partner.id}:`, err)
          // Return as still incomplete - don't crash the whole run
          return {
            partnerId: partner.id,
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
            nowComplete: false,
          } as StripeStatus
        }
      })

      stripeStatuses.push(status as StripeStatus)
    }

    // Step 3: Send reminder emails to partners still incomplete
    const stillIncomplete = incompletePartners.filter((p) => {
      const status = stripeStatuses.find((s) => s.partnerId === p.id)
      return status && !status.nowComplete
    })

    const updated = incompletePartners.length - stillIncomplete.length

    if (stillIncomplete.length === 0) {
      safeLog(`${LOG_PREFIX} All partners now have complete Stripe onboarding. Updated ${updated}.`)
      return { checked: incompletePartners.length, updated, reminded: 0, skipped: 0 }
    }

    let reminded = 0
    let skipped = 0

    const reminderResult = await step.run('send-reminders', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      let batchReminded = 0
      let batchSkipped = 0

      const cooldownCutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString()

      for (const partner of stillIncomplete) {
        try {
          // Check for recent reminder (dedup via notifications table)
          // Partners may or may not have a workspace_id, so we query by metadata
          const { count: recentCount } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'system')
            .eq('title', NOTIFICATION_TITLE)
            .gte('created_at', cooldownCutoff)
            .eq('related_id', partner.id)
            .eq('related_type', 'partner')

          if (recentCount && recentCount > 0) {
            safeLog(`${LOG_PREFIX} Partner ${partner.id} already reminded within ${COOLDOWN_DAYS} days, skipping`)
            batchSkipped++
            continue
          }

          // Determine what's missing
          const status = stripeStatuses.find((s) => s.partnerId === partner.id)
          const missingItems: string[] = []
          if (status && !status.chargesEnabled) missingItems.push('payment processing (charges)')
          if (status && !status.payoutsEnabled) missingItems.push('payout receiving')
          if (status && !status.detailsSubmitted) missingItems.push('account details')

          // Build and send the reminder email
          const html = buildStripeReminderEmail({
            partnerName: partner.name,
            companyName: partner.company_name,
            missingItems,
            settingsUrl: `${APP_URL}/partner/settings`,
          })

          const result = await sendEmail({
            to: partner.email,
            subject: 'Complete your Stripe setup to start earning',
            html,
            tags: [
              { name: 'category', value: 'partner' },
              { name: 'type', value: 'stripe_onboarding_reminder' },
            ],
          })

          if (!result.success) {
            safeError(`${LOG_PREFIX} Failed to send reminder to partner ${partner.id}:`, result.error)
            batchSkipped++
            continue
          }

          // Record the notification for dedup
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              workspace_id: partner.workspace_id || partner.id, // Use partner ID as fallback
              user_id: partner.id,
              type: 'system',
              category: 'action_required',
              title: NOTIFICATION_TITLE,
              message: `Stripe onboarding reminder sent. Missing: ${missingItems.join(', ')}`,
              related_type: 'partner',
              related_id: partner.id,
              action_url: `${APP_URL}/partner/settings`,
              action_label: 'Complete Setup',
              priority: 1,
              metadata: {
                email_type: 'stripe_onboarding_reminder',
                missing_items: missingItems,
                stripe_account_id: partner.stripe_account_id,
                email_sent_at: new Date().toISOString(),
                email_message_id: result.messageId,
              },
            })

          if (notifError) {
            safeError(`${LOG_PREFIX} Failed to record notification for partner ${partner.id}:`, notifError)
            // Don't fail the whole run - email was already sent
          }

          batchReminded++
          safeLog(`${LOG_PREFIX} Sent Stripe reminder to partner ${partner.id}`)
        } catch (err) {
          safeError(`${LOG_PREFIX} Error processing partner ${partner.id}:`, err)
          batchSkipped++
        }
      }

      return { reminded: batchReminded, skipped: batchSkipped }
    })

    reminded = reminderResult.reminded
    skipped = reminderResult.skipped

    safeLog(`${LOG_PREFIX} Completed. Checked: ${incompletePartners.length}, Updated: ${updated}, Reminded: ${reminded}, Skipped: ${skipped}`)

    return {
      checked: incompletePartners.length,
      updated,
      reminded,
      skipped,
    }
  }
)

/**
 * Build branded HTML email for Stripe onboarding reminder
 */
function buildStripeReminderEmail(params: {
  partnerName: string
  companyName: string | null
  missingItems: string[]
  settingsUrl: string
}): string {
  const { partnerName, companyName, missingItems, settingsUrl } = params
  const displayName = escapeHtml(partnerName)
  const company = companyName ? escapeHtml(companyName) : null

  const missingList = missingItems.length > 0
    ? missingItems.map((item) => `<li style="margin: 4px 0; color: ${BRAND.text};">${escapeHtml(item)}</li>`).join('')
    : `<li style="margin: 4px 0; color: ${BRAND.text};">Complete Stripe account verification</li>`

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: ${BRAND.text}; line-height: 1.4;">
      Complete your Stripe setup
    </h2>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.6;">
      Hi ${displayName},
    </p>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.6;">
      We noticed that your Stripe Connect account${company ? ` for <strong>${company}</strong>` : ''} hasn't been fully set up yet.
      Until your Stripe account is complete, you won't be able to receive payouts for your lead sales.
    </p>

    <div style="background-color: ${BRAND.warningBg}; border: 1px solid ${BRAND.warningBorder}; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${BRAND.text};">
        What's still needed:
      </p>
      <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; line-height: 1.6;">
        ${missingList}
      </ul>
    </div>

    <p style="margin: 0 0 8px; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.6;">
      Click below to finish your Stripe setup. It usually takes less than 5 minutes.
    </p>

    ${ctaButton('Complete Setup', settingsUrl)}

    <p style="margin: 24px 0 0; font-size: 13px; color: ${BRAND.textMuted}; line-height: 1.5;">
      Once your Stripe account is fully verified, your partner account will be activated and you can start
      receiving payouts for every lead you sell on the Cursive marketplace.
    </p>

    <p style="margin: 16px 0 0; font-size: 13px; color: ${BRAND.textMuted}; line-height: 1.5;">
      Having trouble? Reply to this email or reach out to
      <a href="mailto:adam@meetcursive.com" style="color: ${BRAND.primary}; text-decoration: underline;">adam@meetcursive.com</a>
      and we'll help you get set up.
    </p>
  `

  return emailLayout({
    preheader: 'Your Stripe account needs attention -- complete setup to start earning.',
    content,
  })
}
