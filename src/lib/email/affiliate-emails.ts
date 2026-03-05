/**
 * Affiliate Partner Program Email Templates
 * All emails for the affiliate lifecycle
 */

import { sendEmail, createEmailTemplate, EMAIL_CONFIG } from './resend-client'

const ADMIN_EMAIL = 'adam@meetcursive.com'

// ─── Helper ───────────────────────────────────────────────────────────────────
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── Application Received ─────────────────────────────────────────────────────
export async function sendPartnerApplicationReceived(
  to: string,
  firstName: string
): Promise<void> {
  const html = createEmailTemplate({
    preheader: 'Your Cursive Partner Program application is received.',
    title: 'Application Received',
    content: `
      <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Thanks for applying to the Cursive Partner Program. We've received your application
        and our team reviews all submissions within 48 hours.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        If approved, you'll receive your unique referral link and access to your partner dashboard
        where you can track clicks, sign-ups, activations, and earnings in real time.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        We'll follow up shortly with next steps.
      </p>
      <p style="margin:0;font-size:15px;color:#3f3f46;">
        — The Cursive Team
      </p>
    `,
  })

  await sendEmail({
    to,
    subject: 'Your Cursive Partner Program application',
    html,
  })
}

// ─── Application Notification (internal) ─────────────────────────────────────
export async function sendPartnerApplicationNotification(
  applicationId: string,
  name: string,
  audienceType: string[],
  audienceSize: string
): Promise<void> {
  const reviewUrl = `${EMAIL_CONFIG.baseUrl}/admin/affiliates/${applicationId}`
  const html = createEmailTemplate({
    preheader: `New partner application from ${name}`,
    title: 'New Partner Application',
    content: `
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        A new affiliate partner application has been submitted.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#71717a;width:140px;">Name</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:500;">${esc(name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#71717a;">Audience Type</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;">${esc(audienceType.join(', '))}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#71717a;">Audience Size</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;">${esc(audienceSize)}</td>
        </tr>
      </table>
      <a href="${reviewUrl}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
        Review Application
      </a>
    `,
  })

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New partner application: ${name}`,
    html,
  })
}

// ─── Application Approved ─────────────────────────────────────────────────────
export async function sendPartnerApproved(
  to: string,
  firstName: string,
  partnerCode: string,
  referralUrl: string,
  dashboardUrl: string
): Promise<void> {
  const html = createEmailTemplate({
    preheader: `You're in — your partner code is ${partnerCode}`,
    title: 'Welcome to the Partner Program',
    content: `
      <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Congratulations — your Cursive Partner Program application has been approved.
      </p>

      <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;font-weight:500;">Your Partner Code</p>
        <p style="margin:0;font-size:28px;font-weight:700;color:#18181b;letter-spacing:0.05em;">${esc(partnerCode)}</p>
      </div>

      <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;font-weight:500;">Your Referral Link</p>
        <p style="margin:0;font-size:14px;color:#2563eb;word-break:break-all;">${esc(referralUrl)}</p>
      </div>

      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Next steps:</p>
      <ol style="margin:0 0 24px;padding-left:20px;">
        <li style="margin-bottom:8px;font-size:14px;color:#3f3f46;line-height:1.6;">
          <strong>Accept the partner agreement</strong> — log in to your dashboard and accept the terms to unlock access.
        </li>
        <li style="margin-bottom:8px;font-size:14px;color:#3f3f46;line-height:1.6;">
          <strong>Connect your Stripe account</strong> — required to receive cash milestone bonuses and commissions.
        </li>
        <li style="margin-bottom:8px;font-size:14px;color:#3f3f46;line-height:1.6;">
          <strong>Share your link</strong> — every business that installs the Cursive pixel and gets their first audience match earns you +1 free month.
        </li>
      </ol>

      <p style="margin:0 0 16px;font-size:13px;color:#71717a;line-height:1.6;">
        <strong>FTC Disclosure:</strong> Per FTC guidelines, you must clearly disclose your affiliate relationship whenever you promote Cursive to your audience. A simple "I'm a Cursive partner" or "affiliate link" disclosure is sufficient.
      </p>

      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
        Go to Your Dashboard
      </a>
    `,
  })

  await sendEmail({
    to,
    subject: `You're in — partner code ${partnerCode}`,
    html,
  })
}

// ─── Application Rejected ─────────────────────────────────────────────────────
export async function sendPartnerRejected(
  to: string,
  firstName: string
): Promise<void> {
  const html = createEmailTemplate({
    preheader: 'An update on your Cursive Partner Program application',
    title: 'Partner Application Update',
    content: `
      <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Thank you for your interest in the Cursive Partner Program. After reviewing your application,
        we're not able to move forward at this time.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Our program is best suited for established audiences in the B2B, marketing, or ecommerce space.
        If your audience or platform grows, we'd encourage you to reapply — we review every application
        individually.
      </p>
      <p style="margin:0;font-size:15px;color:#3f3f46;">
        — The Cursive Team
      </p>
    `,
  })

  await sendEmail({
    to,
    subject: 'Your Cursive Partner Program application',
    html,
  })
}

// ─── New Lead Notification ────────────────────────────────────────────────────
export async function sendPartnerNewLead(
  to: string,
  firstName: string,
  referredEmail: string
): Promise<void> {
  const html = createEmailTemplate({
    preheader: `${referredEmail} just signed up through your link`,
    title: 'New Referral Sign-Up',
    content: `
      <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        <strong>${esc(referredEmail)}</strong> just signed up through your referral link.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Once they install the Cursive pixel and receive their first audience results, you'll earn
        +1 free month added to your account — and they move you one step closer to your next milestone bonus.
      </p>
      <p style="margin:0;font-size:15px;color:#3f3f46;">
        Keep sharing your link — you're building momentum.
      </p>
    `,
  })

  await sendEmail({
    to,
    subject: `New referral: ${referredEmail} signed up`,
    html,
  })
}

// ─── Activation Notification ──────────────────────────────────────────────────
export async function sendPartnerActivation(
  to: string,
  firstName: string,
  referredEmail: string,
  totalActivations: number,
  freeMonthsEarned: number,
  nextTierCount: number | null,
  nextTierBonus: number | null
): Promise<void> {
  const nextMilestone =
    nextTierCount && nextTierBonus
      ? `<p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
          You're <strong>${nextTierCount}</strong> activation${nextTierCount === 1 ? '' : 's'} away from a
          <strong>$${Math.round(nextTierBonus / 100).toLocaleString()} milestone bonus</strong>. Keep going.
        </p>`
      : ''

  const html = createEmailTemplate({
    preheader: `${referredEmail} activated their pixel — you earned a free month`,
    title: 'Activation Earned',
    content: `
      <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        <strong>${esc(referredEmail)}</strong> installed the Cursive pixel and received their first
        audience match. That earns you <strong>+1 free month</strong> added to your Cursive account.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#15803d;font-weight:500;">Your Progress</p>
        <p style="margin:0;font-size:15px;color:#14532d;line-height:1.6;">
          ${totalActivations} total activation${totalActivations === 1 ? '' : 's'} · ${freeMonthsEarned} free month${freeMonthsEarned === 1 ? '' : 's'} earned
        </p>
      </div>
      ${nextMilestone}
    `,
  })

  await sendEmail({
    to,
    subject: `Pixel activated — +1 free month earned`,
    html,
  })
}

// ─── Tier Milestone ───────────────────────────────────────────────────────────
export async function sendPartnerTierMilestone(
  to: string,
  firstName: string,
  tier: number,
  bonusAmount: number,
  stripeConnected: boolean
): Promise<void> {
  const tierNames = ['', 'Builder', 'Grower', 'Scaler', 'Pro', 'Elite', 'Legend']
  const tierName = tierNames[tier] || `Tier ${tier}`
  const bonusDollars = Math.round(bonusAmount / 100).toLocaleString()

  const stripeNote = stripeConnected
    ? `<p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Your <strong>$${bonusDollars} bonus</strong> will be included in your next monthly payout.
        Payouts process on the 1st of each month.
      </p>`
    : `<p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Your <strong>$${bonusDollars} bonus</strong> is waiting.
        <a href="${EMAIL_CONFIG.baseUrl}/affiliate/settings" style="color:#2563eb;">Connect your Stripe account</a>
        in your dashboard to receive it in your next payout.
      </p>`

  const html = createEmailTemplate({
    preheader: `Tier ${tier} unlocked — $${bonusDollars} bonus`,
    title: `${tierName} — Tier ${tier} Unlocked`,
    content: `
      <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        You've hit <strong>Tier ${tier}: ${tierName}</strong> in the Cursive Partner Program.
      </p>
      ${stripeNote}
      ${tier >= 5 ? `<p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        You've also unlocked <strong>${tier >= 6 ? '20%' : '10%'} recurring commission</strong> on every payment
        from your referred customers — for life.
      </p>` : ''}
    `,
  })

  await sendEmail({
    to,
    subject: `Tier ${tier} unlocked — $${bonusDollars} bonus`,
    html,
  })
}

// ─── Commission Earned ────────────────────────────────────────────────────────
export async function sendPartnerCommissionEarned(
  to: string,
  firstName: string,
  commissionAmount: number,
  totalEarnings: number
): Promise<void> {
  const html = createEmailTemplate({
    preheader: `$${(commissionAmount / 100).toFixed(2)} commission earned`,
    title: 'Commission Earned',
    content: `
      <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        You earned a commission of <strong>$${(commissionAmount / 100).toFixed(2)}</strong> from a referred customer's payment.
      </p>
      <div style="background:#f4f4f5;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-weight:500;">Lifetime Earnings</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:#18181b;">$${(totalEarnings / 100).toFixed(2)}</p>
      </div>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        This commission will be included in your next monthly payout on the 1st.
      </p>
    `,
  })

  await sendEmail({
    to,
    subject: `$${(commissionAmount / 100).toFixed(2)} commission earned`,
    html,
  })
}

// ─── Payout Summary ───────────────────────────────────────────────────────────
export async function sendPartnerPayoutSummary(
  to: string,
  firstName: string,
  payoutAmount: number,
  period: string
): Promise<void> {
  const html = createEmailTemplate({
    preheader: `$${(payoutAmount / 100).toFixed(2)} payout sent for ${period}`,
    title: 'Payout Sent',
    content: `
      <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Your payout of <strong>$${(payoutAmount / 100).toFixed(2)}</strong> for <strong>${esc(period)}</strong>
        has been initiated via Stripe.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Transfers typically arrive in your bank account within 2–5 business days, depending on your location.
      </p>
      <p style="margin:0;font-size:15px;color:#3f3f46;">
        Keep sharing — your next payout will include anything earned between now and the end of the month.
      </p>
    `,
  })

  await sendEmail({
    to,
    subject: `Payout sent: $${(payoutAmount / 100).toFixed(2)} for ${period}`,
    html,
  })
}

// ─── Agreement Reminder ───────────────────────────────────────────────────────
export async function sendPartnerAgreementReminder(
  to: string,
  firstName: string,
  dashboardUrl: string
): Promise<void> {
  const html = createEmailTemplate({
    preheader: 'Accept the partner agreement to access your dashboard',
    title: 'One More Step',
    content: `
      <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Your Cursive Partner Program application was approved, but you haven't accepted the
        partner agreement yet. Your dashboard is locked until it's signed.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
        It only takes 30 seconds — click below to review and accept.
      </p>
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
        Accept Agreement
      </a>
    `,
  })

  await sendEmail({
    to,
    subject: 'Accept the partner agreement to get started',
    html,
  })
}
