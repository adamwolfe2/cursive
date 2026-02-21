/**
 * Credit Auto-Recharge
 * Triggered when credits are purchased or when credits fall below the workspace threshold.
 * If auto-recharge is enabled and a saved payment method exists, automatically charges
 * the workspace's card and adds credits. On failure, disables auto-recharge and notifies.
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'

// Maps package IDs to credit amounts and prices (must match CREDIT_PACKAGES)
const PACKAGE_MAP: Record<string, { credits: number; price: number; label: string }> = {
  starter: { credits: 100, price: 99, label: 'Starter (100 credits)' },
  growth: { credits: 500, price: 399, label: 'Growth (500 credits)' },
  scale: { credits: 1000, price: 699, label: 'Scale (1,000 credits)' },
  enterprise: { credits: 5000, price: 2999, label: 'Enterprise (5,000 credits)' },
}

/**
 * Triggered by marketplace/credit-purchased — checks if balance is still below threshold
 * after the purchase, and runs auto-recharge if it is.
 * Also triggered by marketplace/credits-low — runs auto-recharge directly.
 */
export const creditAutoRecharge = inngest.createFunction(
  {
    id: 'credit-auto-recharge',
    name: 'Credit Auto-Recharge',
    retries: 3,
    // Deduplicate by workspace so we don't stack multiple recharges at once
    idempotency: 'event.data.workspace_id',
  },
  [
    { event: 'marketplace/credit-purchased' },
    { event: 'marketplace/credits-low' },
  ],
  async ({ event, step }) => {
    const { workspace_id, user_id } = event.data

    safeLog('[Auto-Recharge] Triggered', { event: event.name, workspace_id })

    // Step 1: Fetch workspace auto-recharge settings and current credit balance
    const settingsAndBalance = await step.run('fetch-settings-and-balance', async () => {
      const adminClient = createAdminClient()

      const { data: workspace } = await adminClient
        .from('workspaces')
        .select('settings')
        .eq('id', workspace_id)
        .maybeSingle()

      const autoRecharge = workspace?.settings?.auto_recharge ?? {
        enabled: false,
        threshold: 10,
        recharge_amount: 'starter',
      }

      // Get current credit balance
      const { data: creditsData } = await adminClient
        .from('workspace_credits')
        .select('balance')
        .eq('workspace_id', workspace_id)
        .maybeSingle()

      const balance = creditsData?.balance ?? 0

      return {
        enabled: autoRecharge.enabled as boolean,
        threshold: autoRecharge.threshold as number,
        recharge_amount: autoRecharge.recharge_amount as string,
        balance,
      }
    })

    const { enabled, threshold, recharge_amount, balance } = settingsAndBalance

    // If auto-recharge is disabled, nothing to do
    if (!enabled) {
      safeLog('[Auto-Recharge] Auto-recharge is disabled for workspace', { workspace_id })
      return { action: 'skipped', reason: 'disabled' }
    }

    // If balance is above threshold, no recharge needed
    if (balance >= threshold) {
      safeLog('[Auto-Recharge] Balance above threshold, no recharge needed', {
        workspace_id,
        balance,
        threshold,
      })
      return { action: 'skipped', reason: 'balance_above_threshold', balance, threshold }
    }

    safeLog('[Auto-Recharge] Balance below threshold, checking payment method', {
      workspace_id,
      balance,
      threshold,
      recharge_amount,
    })

    // Step 2: Look up the user and their Stripe customer ID
    const userInfo = await step.run('fetch-user-info', async () => {
      const adminClient = createAdminClient()

      // Get the workspace owner (first owner found)
      const { data: userData } = await adminClient
        .from('users')
        .select('id, email, full_name, stripe_customer_id')
        .eq('workspace_id', workspace_id)
        .eq('role', 'owner')
        .maybeSingle()

      // Fall back to user_id from event if no owner found
      if (!userData && user_id) {
        const { data: fallbackUser } = await adminClient
          .from('users')
          .select('id, email, full_name, stripe_customer_id')
          .eq('id', user_id)
          .eq('workspace_id', workspace_id) // defense-in-depth: ensure user belongs to workspace
          .maybeSingle()

        return fallbackUser
      }

      return userData
    })

    if (!userInfo?.stripe_customer_id) {
      safeLog('[Auto-Recharge] No Stripe customer ID found, cannot auto-recharge', {
        workspace_id,
      })
      return { action: 'skipped', reason: 'no_stripe_customer' }
    }

    // Step 3: Check if the Stripe customer has a saved payment method
    const paymentMethodId = await step.run('check-payment-method', async () => {
      const stripe = getStripeClient()

      try {
        // List payment methods for the customer
        const paymentMethods = await stripe.paymentMethods.list({
          customer: userInfo.stripe_customer_id!,
          type: 'card',
          limit: 1,
        })

        if (!paymentMethods.data.length) {
          // Also check for default payment method on the customer object
          const customer = await stripe.customers.retrieve(userInfo.stripe_customer_id!)

          if (customer.deleted) {
            return null
          }

          const defaultPm =
            customer.invoice_settings?.default_payment_method ||
            customer.default_source

          return defaultPm ? String(defaultPm) : null
        }

        return paymentMethods.data[0].id
      } catch (err) {
        safeError('[Auto-Recharge] Failed to retrieve payment methods', err)
        return null
      }
    })

    if (!paymentMethodId) {
      safeLog('[Auto-Recharge] No saved payment method found, skipping auto-recharge', {
        workspace_id,
        stripe_customer_id: userInfo.stripe_customer_id,
      })
      return { action: 'skipped', reason: 'no_payment_method' }
    }

    // Resolve the package details
    const packageDetails = PACKAGE_MAP[recharge_amount]
    if (!packageDetails) {
      safeError('[Auto-Recharge] Unknown recharge package ID', { recharge_amount, workspace_id })
      return { action: 'skipped', reason: 'unknown_package' }
    }

    // Step 4: Create a Stripe PaymentIntent and confirm it off-session
    const paymentResult = await step.run('charge-payment-method', async (): Promise<{
      success: boolean
      paymentIntentId: string | null
      error: string | null
    }> => {
      const stripe = getStripeClient()

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: packageDetails.price * 100, // Stripe uses cents
          currency: 'usd',
          customer: userInfo.stripe_customer_id!,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          description: `Auto-recharge: ${packageDetails.label} for workspace ${workspace_id}`,
          metadata: {
            type: 'auto_recharge',
            workspace_id,
            user_id: userInfo.id,
            package_id: recharge_amount,
            credits: String(packageDetails.credits),
          },
        })

        if (paymentIntent.status === 'succeeded') {
          return { success: true, paymentIntentId: paymentIntent.id, error: null }
        }

        return {
          success: false,
          paymentIntentId: paymentIntent.id,
          error: `Payment status: ${paymentIntent.status}`,
        }
      } catch (err: any) {
        safeError('[Auto-Recharge] Stripe PaymentIntent failed', err)
        return { success: false, paymentIntentId: null, error: err?.message || 'Payment failed' }
      }
    })

    if (!paymentResult.success) {
      // Step 5a (failure): Disable auto-recharge and notify user
      await step.run('handle-payment-failure', async () => {
        const adminClient = createAdminClient()

        // Fetch current settings to preserve other keys
        const { data: workspace } = await adminClient
          .from('workspaces')
          .select('settings')
          .eq('id', workspace_id)
          .maybeSingle()

        const existingSettings = workspace?.settings ?? {}
        const existingAutoRecharge = existingSettings.auto_recharge ?? {}

        // Disable auto-recharge
        await adminClient
          .from('workspaces')
          .update({
            settings: {
              ...existingSettings,
              auto_recharge: {
                ...existingAutoRecharge,
                enabled: false,
                disabled_reason: 'payment_failed',
                disabled_at: new Date().toISOString(),
              },
            },
          })
          .eq('id', workspace_id)

        // Insert in-app notification
        await adminClient.from('notifications').insert({
          workspace_id,
          user_id: userInfo.id,
          type: 'auto_recharge_failed',
          category: 'error',
          title: 'Auto-recharge failed',
          message:
            'Your credit auto-recharge could not be processed. Auto-recharge has been disabled. Please update your payment method and re-enable it.',
          action_url: `${APP_URL}/settings/billing`,
          action_label: 'Update billing',
          priority: 10,
          metadata: {
            workspace_id,
            package_id: recharge_amount,
            payment_intent_id: paymentResult.paymentIntentId,
            error: paymentResult.error,
          },
        })

        safeLog('[Auto-Recharge] Auto-recharge disabled due to payment failure', { workspace_id })
      })

      // Send failure notification email
      if (userInfo.email) {
        await step.run('send-failure-email', async () => {
          const result = await sendEmail({
            to: userInfo.email!,
            subject: 'Cursive auto-recharge failed — action required',
            html: buildAutoRechargeFailedEmail(
              userInfo.full_name || 'there',
              packageDetails.label,
              packageDetails.price
            ),
            tags: [
              { name: 'category', value: 'billing' },
              { name: 'type', value: 'auto_recharge_failed' },
            ],
          })

          if (!result.success) {
            safeError('[Auto-Recharge] Failed to send failure email', result.error)
          }
        })
      }

      return {
        action: 'recharge_failed',
        workspace_id,
        error: paymentResult.error,
        auto_recharge_disabled: true,
      }
    }

    // Step 5b (success): Add credits to workspace and notify user
    const newBalance = await step.run('add-credits', async () => {
      const repo = new MarketplaceRepository()

      // Record the credit purchase
      await repo.createCreditPurchase({
        workspaceId: workspace_id,
        userId: userInfo.id,
        credits: packageDetails.credits,
        packageName: recharge_amount,
        amountPaid: packageDetails.price,
        pricePerCredit: packageDetails.price / packageDetails.credits,
        stripePaymentIntentId: paymentResult.paymentIntentId ?? undefined,
      })

      // Add the credits
      const updatedBalance = await repo.addCredits(workspace_id, packageDetails.credits, 'purchase')

      return updatedBalance
    })

    // Insert in-app success notification
    await step.run('send-success-notification', async () => {
      const adminClient = createAdminClient()

      await adminClient.from('notifications').insert({
        workspace_id,
        user_id: userInfo.id,
        type: 'auto_recharge_success',
        category: 'success',
        title: 'Credits auto-recharged',
        message: `${packageDetails.credits.toLocaleString()} credits were automatically added to your account. Your new balance is ${newBalance.toLocaleString()} credits.`,
        action_url: `${APP_URL}/settings/billing`,
        action_label: 'View billing',
        priority: 5,
        metadata: {
          workspace_id,
          credits_added: packageDetails.credits,
          new_balance: newBalance,
          package_id: recharge_amount,
          amount_charged: packageDetails.price,
          payment_intent_id: paymentResult.paymentIntentId,
        },
      })

      safeLog('[Auto-Recharge] Success notification created', { workspace_id, credits_added: packageDetails.credits })
    })

    // Send success confirmation email
    if (userInfo.email) {
      await step.run('send-success-email', async () => {
        const result = await sendEmail({
          to: userInfo.email!,
          subject: `Credits auto-recharged — ${packageDetails.credits.toLocaleString()} credits added`,
          html: buildAutoRechargeSuccessEmail(
            userInfo.full_name || 'there',
            packageDetails.credits,
            packageDetails.price,
            newBalance
          ),
          tags: [
            { name: 'category', value: 'billing' },
            { name: 'type', value: 'auto_recharge_success' },
          ],
        })

        if (!result.success) {
          safeError('[Auto-Recharge] Failed to send success email', result.error)
        }
      })
    }

    safeLog('[Auto-Recharge] Recharge complete', {
      workspace_id,
      credits_added: packageDetails.credits,
      new_balance: newBalance,
      amount_charged: packageDetails.price,
    })

    return {
      action: 'recharged',
      workspace_id,
      credits_added: packageDetails.credits,
      new_balance: newBalance,
      amount_charged: packageDetails.price,
      payment_intent_id: paymentResult.paymentIntentId,
    }
  }
)

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function buildAutoRechargeSuccessEmail(
  firstName: string,
  creditsAdded: number,
  amountCharged: number,
  newBalance: number
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="padding:40px 40px 24px;text-align:center;border-bottom:1px solid #e5e7eb;">
          <img src="${APP_URL}/cursive-logo.png" alt="Cursive" style="height:36px;" />
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Credits auto-recharged</h1>
          <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:24px;">
            Hi ${firstName}, your Cursive credits were running low so we automatically topped them up.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 8px;font-size:14px;color:#15803d;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Recharge Summary</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size:15px;color:#374151;padding:4px 0;">Credits added</td>
                  <td style="font-size:15px;color:#111827;font-weight:600;text-align:right;padding:4px 0;">${creditsAdded.toLocaleString()} credits</td>
                </tr>
                <tr>
                  <td style="font-size:15px;color:#374151;padding:4px 0;">Amount charged</td>
                  <td style="font-size:15px;color:#111827;font-weight:600;text-align:right;padding:4px 0;">$${amountCharged.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="font-size:15px;color:#374151;padding:4px 0;border-top:1px solid #d1fae5;">New balance</td>
                  <td style="font-size:15px;color:#111827;font-weight:700;text-align:right;padding:4px 0;border-top:1px solid #d1fae5;">${newBalance.toLocaleString()} credits</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center">
              <a href="${APP_URL}/settings/billing" style="display:inline-block;padding:12px 28px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
                View Billing
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:22px;">
            To update your auto-recharge settings or turn it off, visit your billing settings.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">Cursive &middot; AI-powered lead intelligence</p>
          <p style="margin:4px 0 0;font-size:12px;">
            <a href="${APP_URL}/settings/notifications" style="color:#9ca3af;text-decoration:underline;">Manage email preferences</a>
            &middot;
            <a href="mailto:hello@meetcursive.com" style="color:#9ca3af;text-decoration:underline;">Contact support</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildAutoRechargeFailedEmail(
  firstName: string,
  packageLabel: string,
  amountAttempted: number
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="padding:40px 40px 24px;text-align:center;border-bottom:1px solid #e5e7eb;">
          <img src="${APP_URL}/cursive-logo.png" alt="Cursive" style="height:36px;" />
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Auto-recharge failed</h1>
          <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:24px;">
            Hi ${firstName}, we tried to automatically recharge your Cursive credits but the payment did not go through.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 8px;font-size:14px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Recharge Attempt</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size:15px;color:#374151;padding:4px 0;">Package</td>
                  <td style="font-size:15px;color:#111827;font-weight:600;text-align:right;padding:4px 0;">${packageLabel}</td>
                </tr>
                <tr>
                  <td style="font-size:15px;color:#374151;padding:4px 0;">Amount attempted</td>
                  <td style="font-size:15px;color:#111827;font-weight:600;text-align:right;padding:4px 0;">$${amountAttempted.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="font-size:15px;color:#dc2626;padding:4px 0;border-top:1px solid #fecaca;">Status</td>
                  <td style="font-size:15px;color:#dc2626;font-weight:700;text-align:right;padding:4px 0;border-top:1px solid #fecaca;">Failed &amp; disabled</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:24px;">
            Auto-recharge has been <strong>disabled</strong> to prevent further failed charges. To keep enriching leads without interruption:
          </p>
          <ol style="margin:0 0 24px;padding-left:24px;font-size:15px;color:#374151;line-height:28px;">
            <li>Update your payment method in billing settings</li>
            <li>Re-enable auto-recharge</li>
          </ol>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center">
              <a href="${APP_URL}/settings/billing" style="display:inline-block;padding:12px 28px;background-color:#dc2626;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
                Update Payment Method
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:22px;">
            Questions? Reply to this email or contact <a href="mailto:hello@meetcursive.com" style="color:#4f46e5;">hello@meetcursive.com</a>.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">Cursive &middot; AI-powered lead intelligence</p>
          <p style="margin:4px 0 0;font-size:12px;">
            <a href="${APP_URL}/settings/notifications" style="color:#9ca3af;text-decoration:underline;">Manage email preferences</a>
            &middot;
            <a href="mailto:hello@meetcursive.com" style="color:#9ca3af;text-decoration:underline;">Contact support</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
