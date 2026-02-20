/**
 * Email Service
 * Cursive Platform
 *
 * Email sending utilities using Resend.
 */

import { Resend } from 'resend'
import { renderEmail } from './render'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import {
  WelcomeEmail,
  QueryCompletedEmail,
  CreditLowEmail,
  ExportReadyEmail,
  WeeklyDigestEmail,
  PasswordResetEmail,
  CampaignCompletedEmail,
  PaymentFailedEmail,
  NewLeadEmail,
  PartnerApprovedEmail,
  PartnerRejectedEmail,
  PurchaseConfirmationEmail,
  PayoutCompletedEmail,
  PayoutFailedEmail,
  CreditPurchaseConfirmationEmail,
} from './templates'

// ============================================
// INITIALIZATION
// ============================================

// Initialize Resend client lazily to avoid build-time errors
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

// ============================================
// TYPES
// ============================================

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
  headers?: Record<string, string>
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// ============================================
// EMAIL SENDER
// ============================================

const FROM_EMAIL = process.env.EMAIL_FROM || 'Cursive <notifications@meetcursive.com>'

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const resend = getResendClient()
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      tags: options.tags,
      headers: {
        'List-Unsubscribe': `<${APP_URL}/settings/notifications>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        ...options.headers,
      },
    })

    if (error) {
      safeError('[Email] Send error:', error)
      return { success: false, error: error.message }
    }

    safeLog('[Email] Sent successfully:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    safeError('[Email] Send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// TEMPLATE SENDERS
// ============================================

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string
): Promise<EmailResult> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`

  const html = await renderEmail(
    WelcomeEmail({ userName, loginUrl })
  )

  return sendEmail({
    to: email,
    subject: 'Welcome to Cursive!',
    html,
    tags: [{ name: 'category', value: 'welcome' }],
  })
}

/**
 * Send query completed notification
 */
export async function sendQueryCompletedEmail(
  email: string,
  userName: string,
  queryName: string,
  leadsCount: number,
  queryId: string
): Promise<EmailResult> {
  const queryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/queries/${queryId}`

  const html = await renderEmail(
    QueryCompletedEmail({ userName, queryName, leadsCount, queryUrl })
  )

  return sendEmail({
    to: email,
    subject: `Your query "${queryName}" is complete`,
    html,
    tags: [
      { name: 'category', value: 'notification' },
      { name: 'type', value: 'query_completed' },
    ],
  })
}

/**
 * Send credit low warning
 */
export async function sendCreditLowEmail(
  email: string,
  userName: string,
  creditsRemaining: number
): Promise<EmailResult> {
  const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`

  const html = await renderEmail(
    CreditLowEmail({ userName, creditsRemaining, billingUrl })
  )

  return sendEmail({
    to: email,
    subject: 'Your Cursive credits are running low',
    html,
    tags: [
      { name: 'category', value: 'notification' },
      { name: 'type', value: 'credit_warning' },
    ],
  })
}

/**
 * Send export ready notification
 */
export async function sendExportReadyEmail(
  email: string,
  userName: string,
  exportName: string,
  downloadUrl: string,
  expiresAt: Date
): Promise<EmailResult> {
  const html = await renderEmail(
    ExportReadyEmail({
      userName,
      exportName,
      downloadUrl,
      expiresAt: expiresAt.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    })
  )

  return sendEmail({
    to: email,
    subject: `Your export "${exportName}" is ready`,
    html,
    tags: [
      { name: 'category', value: 'notification' },
      { name: 'type', value: 'export_ready' },
    ],
  })
}

/**
 * Send weekly digest
 */
export async function sendWeeklyDigestEmail(
  email: string,
  userName: string,
  stats: {
    newLeads: number
    queriesCompleted: number
    topQueryName: string
    topQueryLeads: number
  }
): Promise<EmailResult> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

  const html = await renderEmail(
    WeeklyDigestEmail({ userName, stats, dashboardUrl })
  )

  return sendEmail({
    to: email,
    subject: 'Your Cursive Weekly Summary',
    html,
    tags: [
      { name: 'category', value: 'digest' },
      { name: 'type', value: 'weekly' },
    ],
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetToken: string
): Promise<EmailResult> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

  const html = await renderEmail(
    PasswordResetEmail({
      userName,
      resetUrl,
      expiresIn: '1 hour',
    })
  )

  return sendEmail({
    to: email,
    subject: 'Reset your Cursive password',
    html,
    tags: [
      { name: 'category', value: 'auth' },
      { name: 'type', value: 'password_reset' },
    ],
  })
}

/**
 * Send campaign completed notification
 */
export async function sendCampaignCompletedEmail(
  email: string,
  userName: string,
  campaignName: string,
  campaignId: string,
  stats: {
    totalSent: number
    opened: number
    clicked: number
    replied: number
  }
): Promise<EmailResult> {
  const campaignUrl = `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaignId}`

  const html = await renderEmail(
    CampaignCompletedEmail({ userName, campaignName, stats, campaignUrl })
  )

  return sendEmail({
    to: email,
    subject: `Campaign "${campaignName}" has completed`,
    html,
    tags: [
      { name: 'category', value: 'notification' },
      { name: 'type', value: 'campaign_completed' },
    ],
  })
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  email: string,
  userName: string,
  amount: number,
  currency: string,
  attemptCount: number
): Promise<EmailResult> {
  const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`
  const formattedAmount = (amount / 100).toFixed(2) // Stripe amounts are in cents

  const html = await renderEmail(
    PaymentFailedEmail({
      userName,
      amount: formattedAmount,
      currency,
      billingUrl,
      attemptCount,
    })
  )

  return sendEmail({
    to: email,
    subject: 'Payment failed - action required',
    html,
    tags: [
      { name: 'category', value: 'billing' },
      { name: 'type', value: 'payment_failed' },
    ],
  })
}

/**
 * Send new lead assignment notification
 */
export async function sendNewLeadEmail(
  email: string,
  userName: string,
  lead: {
    name: string
    company?: string | null
    title?: string | null
    location?: string | null
    leadId: string
  },
  matchedOn?: string | null
): Promise<EmailResult> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/my-leads?leadId=${lead.leadId}`

  const html = await renderEmail(
    NewLeadEmail({
      userName,
      leadName: lead.name,
      leadCompany: lead.company || null,
      leadTitle: lead.title || null,
      leadLocation: lead.location || null,
      matchedOn: matchedOn || null,
      dashboardUrl,
    })
  )

  return sendEmail({
    to: email,
    subject: `New lead: ${lead.name}${lead.company ? ` at ${lead.company}` : ''}`,
    html,
    tags: [
      { name: 'category', value: 'notification' },
      { name: 'type', value: 'new_lead' },
    ],
  })
}

/**
 * Send partner approved notification
 */
export async function sendPartnerApprovedEmail(
  email: string,
  partnerName: string,
  companyName: string,
  apiKey: string
): Promise<EmailResult> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/partner`

  const html = await renderEmail(
    PartnerApprovedEmail({
      partnerName,
      companyName,
      apiKey,
      dashboardUrl,
    })
  )

  return sendEmail({
    to: email,
    subject: `Welcome to the Marketplace - ${companyName} Approved!`,
    html,
    tags: [
      { name: 'category', value: 'partner' },
      { name: 'type', value: 'partner_approved' },
    ],
  })
}

/**
 * Send partner rejected notification
 */
export async function sendPartnerRejectedEmail(
  email: string,
  partnerName: string,
  companyName: string,
  reason: string
): Promise<EmailResult> {
  const supportEmail = process.env.SUPPORT_EMAIL || 'hello@meetcursive.com'

  const html = await renderEmail(
    PartnerRejectedEmail({
      partnerName,
      companyName,
      reason,
      supportEmail,
    })
  )

  return sendEmail({
    to: email,
    subject: `Partner Application Update - ${companyName}`,
    html,
    tags: [
      { name: 'category', value: 'partner' },
      { name: 'type', value: 'partner_rejected' },
    ],
  })
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmationEmail(
  email: string,
  buyerName: string,
  purchaseDetails: {
    totalLeads: number
    totalPrice: number
    purchaseId: string
    downloadUrl: string
    downloadExpiresAt: Date
  }
): Promise<EmailResult> {
  const html = await renderEmail(
    PurchaseConfirmationEmail({
      buyerName,
      totalLeads: purchaseDetails.totalLeads,
      totalPrice: purchaseDetails.totalPrice,
      downloadUrl: purchaseDetails.downloadUrl,
      downloadExpiresAt: purchaseDetails.downloadExpiresAt.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      purchaseId: purchaseDetails.purchaseId,
    })
  )

  return sendEmail({
    to: email,
    subject: `Purchase Confirmed - ${purchaseDetails.totalLeads} Leads`,
    html,
    tags: [
      { name: 'category', value: 'marketplace' },
      { name: 'type', value: 'purchase_confirmation' },
    ],
  })
}

/**
 * Send payout completed notification
 */
export async function sendPayoutCompletedEmail(
  email: string,
  partnerName: string,
  payoutDetails: {
    amount: number
    currency: string
    leadsCount: number
    periodStart: Date
    periodEnd: Date
    payoutId: string
  }
): Promise<EmailResult> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/partner/payouts`

  const html = await renderEmail(
    PayoutCompletedEmail({
      partnerName,
      amount: payoutDetails.amount,
      currency: payoutDetails.currency,
      leadsCount: payoutDetails.leadsCount,
      periodStart: payoutDetails.periodStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      periodEnd: payoutDetails.periodEnd.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      payoutId: payoutDetails.payoutId,
      dashboardUrl,
    })
  )

  return sendEmail({
    to: email,
    subject: `Payout Processed - $${payoutDetails.amount.toFixed(2)}`,
    html,
    tags: [
      { name: 'category', value: 'partner' },
      { name: 'type', value: 'payout_completed' },
    ],
  })
}

/**
 * Send credit purchase confirmation
 */
export async function sendCreditPurchaseConfirmationEmail(
  email: string,
  buyerName: string,
  creditDetails: {
    creditsAmount: number
    totalPrice: number
    packageName: string
    newBalance: number
  }
): Promise<EmailResult> {
  const html = await renderEmail(
    CreditPurchaseConfirmationEmail({
      buyerName,
      creditsAmount: creditDetails.creditsAmount,
      totalPrice: creditDetails.totalPrice,
      packageName: creditDetails.packageName,
      newBalance: creditDetails.newBalance,
    })
  )

  return sendEmail({
    to: email,
    subject: `Credits Purchased - ${creditDetails.creditsAmount} Credits Added`,
    html,
    tags: [
      { name: 'category', value: 'marketplace' },
      { name: 'type', value: 'credit_purchase' },
    ],
  })
}

/**
 * Send payout failed notification
 */
export async function sendPayoutFailedEmail(
  email: string,
  partnerName: string,
  payoutDetails: {
    amount: number
    currency: string
    reason: string
    payoutId: string
  }
): Promise<EmailResult> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/partner/payouts`

  const html = await renderEmail(
    PayoutFailedEmail({
      partnerName,
      amount: payoutDetails.amount,
      currency: payoutDetails.currency,
      reason: payoutDetails.reason,
      payoutId: payoutDetails.payoutId,
      dashboardUrl,
    })
  )

  return sendEmail({
    to: email,
    subject: `Payout Failed - Action Required`,
    html,
    tags: [
      { name: 'category', value: 'partner' },
      { name: 'type', value: 'payout_failed' },
    ],
  })
}

/**
 * Send custom audience request confirmation email
 */
export async function sendCustomAudienceConfirmationEmail(
  email: string,
  userName: string,
  industry: string,
  volume: number
): Promise<EmailResult> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
  const marketplaceUrl = `${APP_URL}/marketplace`
  const unsubscribeUrl = `${APP_URL}/settings/notifications`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Custom Audience Request Received</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="background:#2563eb;padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Cursive</p>
        </td></tr>
        <tr><td style="padding:40px 32px;">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#18181b;">We received your custom audience request!</h1>
          <p style="margin:0 0 16px;font-size:16px;color:#71717a;line-height:1.6;">Hi ${userName},</p>
          <p style="margin:0 0 24px;font-size:16px;color:#71717a;line-height:1.6;">
            Your request for a custom ${industry} audience of ${volume.toLocaleString()} leads has been received. Our team is reviewing it now.
          </p>
          <table cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;width:100%;">
            <tr><td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#18181b;">Request Summary</p>
              <p style="margin:0 0 4px;font-size:14px;color:#71717a;">Industry: <strong style="color:#18181b;">${industry}</strong></p>
              <p style="margin:0;font-size:14px;color:#71717a;">Volume: <strong style="color:#18181b;">${volume.toLocaleString()} leads</strong></p>
            </td></tr>
          </table>
          <p style="margin:0 0 24px;font-size:16px;color:#71717a;line-height:1.6;">
            Expect a 25-lead sample within 48 hours. Our team will reach out to discuss pricing and timeline.
          </p>
          <p style="margin:0 0 32px;font-size:16px;color:#71717a;line-height:1.6;">
            In the meantime, explore our marketplace for immediately available leads:
          </p>
          <a href="${marketplaceUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">Browse Marketplace</a>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #e4e4e7;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
            You're receiving this because you submitted a custom audience request at leads.meetcursive.com.<br>
            <a href="${unsubscribeUrl}" style="color:#a1a1aa;">Manage notifications</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Hi ${userName},\n\nYour custom audience request has been received.\n\nIndustry: ${industry}\nVolume: ${volume.toLocaleString()} leads\n\nExpect a 25-lead sample within 48 hours.\n\nIn the meantime, browse available leads: ${marketplaceUrl}`

  return sendEmail({
    to: email,
    subject: 'Custom Audience Request Received — Sample in 48 Hours',
    html,
    text,
    tags: [
      { name: 'category', value: 'notification' },
      { name: 'type', value: 'custom_audience_request' },
    ],
  })
}

// ============================================
// BATCH SENDING
// ============================================

interface BatchEmailResult {
  total: number
  successful: number
  failed: number
  errors: { email: string; error: string }[]
}

/**
 * Send emails in batch
 */
export async function sendBatchEmails(
  emails: { to: string; subject: string; html: string }[]
): Promise<BatchEmailResult> {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  )

  const errors: { email: string; error: string }[] = []
  let successful = 0
  let failed = 0

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successful++
    } else {
      failed++
      errors.push({
        email: emails[index].to,
        error:
          result.status === 'rejected'
            ? String(result.reason)
            : result.value.error || 'Unknown error',
      })
    }
  })

  return {
    total: emails.length,
    successful,
    failed,
    errors,
  }
}

// ============================================
// EMAIL PREFERENCES
// ============================================

export const EMAIL_CATEGORIES = {
  marketing: {
    name: 'Marketing',
    description: 'Product updates and feature announcements',
  },
  notifications: {
    name: 'Notifications',
    description: 'Query completions and lead alerts',
  },
  digest: {
    name: 'Weekly Digest',
    description: 'Weekly summary of your account activity',
  },
  security: {
    name: 'Security',
    description: 'Password resets and security alerts',
  },
} as const

export type EmailCategory = keyof typeof EMAIL_CATEGORIES
