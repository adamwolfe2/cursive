/**
 * Funnel Confirmation Email
 *
 * Sent immediately after Stripe checkout.session.completed for a funnel order.
 * Contains the portal link where the buyer installs the pixel (if applicable)
 * and submits their audience ICP (if applicable).
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { FunnelOfferSlug } from '@/lib/stripe/funnel-products'

interface FunnelConfirmationEmailData {
  to: string
  customerName: string | null
  portalUrl: string
  /** Optional one-click dashboard login (Phase 2). Omitted if not provisioned. */
  dashboardUrl?: string
  offerSlug: FunnelOfferSlug
}

function offerHeadline(slug: FunnelOfferSlug): string {
  switch (slug) {
    case 'pixel_97':
      return 'Your Visitor Pixel is ready to install'
    case 'audience_197':
      return 'Tell us who to find — your audience is next'
    case 'bundle_247':
      return 'Welcome to Cursive — let\'s get you set up'
  }
}

function offerSummary(slug: FunnelOfferSlug): string {
  switch (slug) {
    case 'pixel_97':
      return 'You\'ll install the pixel in about 60 seconds. After that you\'re live and the identified visitors start flowing.'
    case 'audience_197':
      return 'You\'ll tell us about your product and ideal customer. We\'ll build your first audience within 24 hours.'
    case 'bundle_247':
      return 'Two quick steps: install your pixel (60 seconds) and tell us who to find for your weekly audience. You\'ll be live today.'
  }
}

export async function sendFunnelConfirmationEmail(
  data: FunnelConfirmationEmailData
) {
  const { to, customerName, portalUrl, dashboardUrl, offerSlug } = data
  const firstName = (customerName ?? '').trim().split(/\s+/)[0] || 'there'

  const headline = offerHeadline(offerSlug)
  const summary = offerSummary(offerSlug)

  // Secondary CTA — one-click into the dashboard (no password). Only rendered
  // when a workspace was provisioned for this buyer.
  const dashboardButton = dashboardUrl
    ? `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="border:1px solid #007AFF;border-radius:8px;">
          <a href="${dashboardUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:600;color:#007AFF;text-decoration:none;border-radius:8px;">
            Open My Dashboard →
          </a>
        </td>
      </tr>
    </table>`
    : ''

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hi ${escapeForEmail(firstName)} — payment received, you're all set.
    </p>

    <p class="email-text">
      ${escapeForEmail(summary)}
    </p>

    <!-- Primary CTA: setup portal -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 12px;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${portalUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Open Your Setup Portal →
          </a>
        </td>
      </tr>
    </table>
    ${dashboardButton}

    <p class="email-text" style="font-size:13px;color:#6b7280;">
      Bookmark this link — it's your private portal. Every step lives there.
      If you ever lose it, reply to this email and we'll resend.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <div class="email-signature">
      <p style="margin:0 0 4px;">Adam Wolfe<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
        Reply any time — I read every email.
      </p>
    </div>
  `

  try {
    return await sendEmail({
      to,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject: headline,
      html: createEmailTemplate({
        preheader: 'Open your private setup portal to finish in under 2 minutes.',
        title: headline,
        content,
      }),
      text: [
        `Hi ${firstName} — payment received, you're all set.`,
        '',
        summary,
        '',
        `Open your setup portal: ${portalUrl}`,
        ...(dashboardUrl ? ['', `Open your dashboard (no password): ${dashboardUrl}`] : []),
        '',
        `Bookmark this link — it's your private portal. Reply to this email if you ever lose it.`,
        '',
        `— Adam Wolfe`,
        `Cursive · https://meetcursive.com`,
      ].join('\n'),
    })
  } catch (err) {
    safeError('[funnel-confirmation] send failed:', err)
    return { success: false, error: err }
  }
}

function escapeForEmail(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
