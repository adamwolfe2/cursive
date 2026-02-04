/**
 * Email Templates for Service Subscriptions
 * Clean, simple, personal - signed by Adam @ Cursive
 */

import { createEmailTemplate, EMAIL_CONFIG } from './resend-client'

/**
 * Welcome Email - Sent after subscription is created
 */
export function createWelcomeEmail({
  customerName,
  tierName,
  monthlyPrice,
}: {
  customerName: string
  tierName: string
  monthlyPrice: number
}) {
  const content = `
    <h1 class="email-title">Welcome to ${tierName}</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Thank you for subscribing to ${tierName}. I'm excited to help you scale your lead generation and outreach.
    </p>

    <p class="email-text">
      Your subscription is now active at $${monthlyPrice.toLocaleString()}/month. Here's what happens next:
    </p>

    <ul style="margin: 16px 0; padding-left: 24px;">
      <li style="margin-bottom: 8px;">You'll receive your first delivery within 5-7 business days</li>
      <li style="margin-bottom: 8px;">I'll reach out personally to schedule our kickoff call</li>
      <li style="margin-bottom: 8px;">You can manage your subscription anytime from your dashboard</li>
    </ul>

    <a href="${EMAIL_CONFIG.baseUrl}/services/manage" class="email-button">
      View Your Subscription
    </a>

    <p class="email-text">
      If you have any questions or need anything, just reply to this email. I'm here to help.
    </p>
  `

  const text = `
Welcome to ${tierName}

Hi ${customerName},

Thank you for subscribing to ${tierName}. I'm excited to help you scale your lead generation and outreach.

Your subscription is now active at $${monthlyPrice.toLocaleString()}/month. Here's what happens next:

- You'll receive your first delivery within 5-7 business days
- I'll reach out personally to schedule our kickoff call
- You can manage your subscription anytime from your dashboard

View Your Subscription: ${EMAIL_CONFIG.baseUrl}/services/manage

If you have any questions or need anything, just reply to this email. I'm here to help.

Adam @ Cursive
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Welcome to ${tierName} - Let's get started`,
      title: `Welcome to ${tierName}`,
      content,
    }),
    text,
  }
}

/**
 * Payment Successful - Sent when recurring payment succeeds
 */
export function createPaymentSuccessEmail({
  customerName,
  tierName,
  amount,
  periodEnd,
}: {
  customerName: string
  tierName: string
  amount: number
  periodEnd: string
}) {
  const formattedDate = new Date(periodEnd).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const content = `
    <h1 class="email-title">Payment Received</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Your payment of $${amount.toLocaleString()} for ${tierName} has been processed successfully.
    </p>

    <p class="email-text">
      Your subscription is active through ${formattedDate}. You can view your invoice and subscription details anytime from your dashboard.
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services/manage" class="email-button">
      View Invoice
    </a>

    <p class="email-text">
      Thank you for being a valued customer.
    </p>
  `

  const text = `
Payment Received

Hi ${customerName},

Your payment of $${amount.toLocaleString()} for ${tierName} has been processed successfully.

Your subscription is active through ${formattedDate}. You can view your invoice and subscription details anytime from your dashboard.

View Invoice: ${EMAIL_CONFIG.baseUrl}/services/manage

Thank you for being a valued customer.

Adam @ Cursive
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Payment confirmed - $${amount.toLocaleString()}`,
      title: 'Payment Received',
      content,
    }),
    text,
  }
}

/**
 * Payment Failed - Sent when payment attempt fails
 */
export function createPaymentFailedEmail({
  customerName,
  tierName,
  amount,
}: {
  customerName: string
  tierName: string
  amount: number
}) {
  const content = `
    <h1 class="email-title">Payment Issue</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      We had trouble processing your payment of $${amount.toLocaleString()} for ${tierName}.
    </p>

    <p class="email-text">
      This can happen for several reasons - expired card, insufficient funds, or your bank declining the charge. To keep your subscription active, please update your payment method.
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services/manage" class="email-button">
      Update Payment Method
    </a>

    <p class="email-text">
      If you need help or have questions, just reply to this email and I'll sort it out with you personally.
    </p>
  `

  const text = `
Payment Issue

Hi ${customerName},

We had trouble processing your payment of $${amount.toLocaleString()} for ${tierName}.

This can happen for several reasons - expired card, insufficient funds, or your bank declining the charge. To keep your subscription active, please update your payment method.

Update Payment Method: ${EMAIL_CONFIG.baseUrl}/services/manage

If you need help or have questions, just reply to this email and I'll sort it out with you personally.

Adam @ Cursive
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: 'Action needed - Update your payment method',
      title: 'Payment Issue',
      content,
    }),
    text,
  }
}

/**
 * Subscription Cancelled - Sent when subscription is cancelled
 */
export function createSubscriptionCancelledEmail({
  customerName,
  tierName,
  accessUntil,
}: {
  customerName: string
  tierName: string
  accessUntil: string
}) {
  const formattedDate = new Date(accessUntil).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const content = `
    <h1 class="email-title">Subscription Cancelled</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Your ${tierName} subscription has been cancelled. You'll continue to have access through ${formattedDate}.
    </p>

    <p class="email-text">
      I'm sorry to see you go. If there's anything we could have done better, I'd genuinely appreciate hearing your feedback. Just reply to this email.
    </p>

    <p class="email-text">
      If you change your mind, you can reactivate your subscription anytime.
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services" class="email-button">
      Reactivate Subscription
    </a>

    <p class="email-text">
      Thank you for giving Cursive a try.
    </p>
  `

  const text = `
Subscription Cancelled

Hi ${customerName},

Your ${tierName} subscription has been cancelled. You'll continue to have access through ${formattedDate}.

I'm sorry to see you go. If there's anything we could have done better, I'd genuinely appreciate hearing your feedback. Just reply to this email.

If you change your mind, you can reactivate your subscription anytime.

Reactivate Subscription: ${EMAIL_CONFIG.baseUrl}/services

Thank you for giving Cursive a try.

Adam @ Cursive
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Your subscription has been cancelled`,
      title: 'Subscription Cancelled',
      content,
    }),
    text,
  }
}

/**
 * Onboarding Reminder - Sent if onboarding not completed after 3 days
 */
export function createOnboardingReminderEmail({
  customerName,
  tierName,
}: {
  customerName: string
  tierName: string
}) {
  const content = `
    <h1 class="email-title">Let's Get You Started</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      I noticed you haven't completed your onboarding for ${tierName} yet. I want to make sure you get the most value from your subscription.
    </p>

    <p class="email-text">
      Onboarding only takes about 10 minutes and helps me understand your goals so I can deliver exactly what you need.
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services/onboarding" class="email-button">
      Complete Onboarding
    </a>

    <p class="email-text">
      If you're stuck or have questions, just reply to this email and I'll help you through it.
    </p>
  `

  const text = `
Let's Get You Started

Hi ${customerName},

I noticed you haven't completed your onboarding for ${tierName} yet. I want to make sure you get the most value from your subscription.

Onboarding only takes about 10 minutes and helps me understand your goals so I can deliver exactly what you need.

Complete Onboarding: ${EMAIL_CONFIG.baseUrl}/services/onboarding

If you're stuck or have questions, just reply to this email and I'll help you through it.

Adam @ Cursive
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: 'Complete your onboarding to get started',
      title: "Let's Get You Started",
      content,
    }),
    text,
  }
}

/**
 * Renewal Reminder - Sent 7 days before renewal
 */
export function createRenewalReminderEmail({
  customerName,
  tierName,
  amount,
  renewalDate,
}: {
  customerName: string
  tierName: string
  amount: number
  renewalDate: string
}) {
  const formattedDate = new Date(renewalDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const content = `
    <h1 class="email-title">Upcoming Renewal</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Your ${tierName} subscription will automatically renew on ${formattedDate} for $${amount.toLocaleString()}.
    </p>

    <p class="email-text">
      No action needed - your payment method on file will be charged automatically. If you need to update your payment method or have any questions, you can manage your subscription from your dashboard.
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services/manage" class="email-button">
      Manage Subscription
    </a>

    <p class="email-text">
      Thank you for being a valued customer. If there's anything I can do to improve your experience, please let me know.
    </p>
  `

  const text = `
Upcoming Renewal

Hi ${customerName},

Your ${tierName} subscription will automatically renew on ${formattedDate} for $${amount.toLocaleString()}.

No action needed - your payment method on file will be charged automatically. If you need to update your payment method or have any questions, you can manage your subscription from your dashboard.

Manage Subscription: ${EMAIL_CONFIG.baseUrl}/services/manage

Thank you for being a valued customer. If there's anything I can do to improve your experience, please let me know.

Adam @ Cursive
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Your subscription renews on ${formattedDate}`,
      title: 'Upcoming Renewal',
      content,
    }),
    text,
  }
}

/**
 * Delivery Notification - Sent when lead list or report is delivered
 */
export function createDeliveryNotificationEmail({
  customerName,
  deliveryType,
  downloadUrl,
}: {
  customerName: string
  deliveryType: string
  downloadUrl: string
}) {
  const typeLabels: Record<string, string> = {
    lead_list: 'Lead List',
    campaign_setup: 'Campaign Report',
    monthly_report: 'Monthly Report',
    optimization_session: 'Optimization Report',
  }

  const deliveryLabel = typeLabels[deliveryType] || deliveryType

  const content = `
    <h1 class="email-title">Your ${deliveryLabel} is Ready</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Your ${deliveryLabel} has been completed and is ready for download.
    </p>

    <a href="${downloadUrl}" class="email-button">
      Download Now
    </a>

    <p class="email-text">
      If you have any questions about the delivery or need adjustments, just reply to this email and I'll help you out.
    </p>
  `

  const text = `
Your ${deliveryLabel} is Ready

Hi ${customerName},

Your ${deliveryLabel} has been completed and is ready for download.

Download Now: ${downloadUrl}

If you have any questions about the delivery or need adjustments, just reply to this email and I'll help you out.

Adam @ Cursive
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Your ${deliveryLabel} is ready to download`,
      title: `${deliveryLabel} Ready`,
      content,
    }),
    text,
  }
}
