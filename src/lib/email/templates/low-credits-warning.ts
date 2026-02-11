/**
 * Low Credits Warning Email Template
 *
 * Sent when a user's credit balance drops below a threshold.
 * Shows current balance, buy CTA, and subtle Pro upsell if on Free.
 */

import { emailLayout, ctaButton, divider, footnote, escapeHtml, BRAND, URLS } from './layout'

// ============================================
// TYPES
// ============================================

export interface LowCreditsWarningData {
  /** Recipient's first name */
  userName: string
  /** Current credit balance */
  creditBalance: number
  /** User's current plan: 'free', 'starter', 'pro', etc. */
  currentPlan: string
}

// ============================================
// TEMPLATE
// ============================================

export function lowCreditsWarningEmail(data: LowCreditsWarningData): { html: string; text: string; subject: string } {
  const { userName, creditBalance, currentPlan } = data

  const isFreePlan = currentPlan.toLowerCase() === 'free'
  const subject = `You have ${creditBalance} credit${creditBalance === 1 ? '' : 's'} remaining`

  const content = `
    <h1 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: ${BRAND.text}; line-height: 1.3;">Credits Running Low</h1>

    <p style="margin: 0 0 24px; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.5;">
      Hi ${escapeHtml(userName)}, just a heads up &mdash; your credit balance is getting low. When credits run out, new leads won't be delivered to your account.
    </p>

    <!-- Balance card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${BRAND.warningBg}; border: 1px solid ${BRAND.warningBorder}; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <div style="font-size: 12px; color: ${BRAND.warning}; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 8px;">Current Balance</div>
          <div style="font-size: 36px; font-weight: 700; color: ${BRAND.text}; line-height: 1.2;">${creditBalance}</div>
          <div style="font-size: 14px; color: ${BRAND.textMuted}; margin-top: 4px;">credit${creditBalance === 1 ? '' : 's'} remaining</div>
        </td>
      </tr>
    </table>

    ${ctaButton('Buy Credits', URLS.billing)}

    ${isFreePlan ? `
    ${divider()}

    <!-- Pro upsell -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${BRAND.backgroundMuted}; border: 1px solid ${BRAND.border}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: ${BRAND.text};">Get more with Pro</p>
          <p style="margin: 0 0 12px; font-size: 13px; color: ${BRAND.textSecondary}; line-height: 1.5;">
            Pro members get monthly credit refills, priority lead routing, and integrations with Slack, Zapier, and custom webhooks.
          </p>
          <a href="${URLS.billing}" style="font-size: 13px; font-weight: 500; color: ${BRAND.primary}; text-decoration: underline;">View Pro plan &rarr;</a>
        </td>
      </tr>
    </table>
    ` : ''}

    ${footnote('You can turn off low-credit alerts in <a href="' + URLS.emailPreferences + '" style="color: ' + BRAND.textMuted + '; text-decoration: underline;">email preferences</a>.')}
  `

  const text = [
    `Credits Running Low`,
    '',
    `Hi ${userName},`,
    '',
    `Your credit balance is down to ${creditBalance} credit${creditBalance === 1 ? '' : 's'}. When credits run out, new leads won't be delivered to your account.`,
    '',
    `Buy credits: ${URLS.billing}`,
    isFreePlan ? `\nUpgrade to Pro for monthly credit refills and priority routing: ${URLS.billing}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  return { html: emailLayout({ preheader: subject, content }), text, subject }
}
