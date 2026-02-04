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
    <h1 class="email-title">You're in. Here's what happens next.</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Your ${tierName} subscription is live at $${monthlyPrice.toLocaleString()}/month.
    </p>

    <p class="email-text">
      Here's the plan:
    </p>

    <ul style="margin: 16px 0; padding-left: 24px;">
      <li style="margin-bottom: 8px;">Your first delivery hits your inbox within 5-7 business days</li>
      <li style="margin-bottom: 8px;">I'll reach out to schedule our kickoff call</li>
      <li style="margin-bottom: 8px;">You can manage everything from your dashboard anytime</li>
    </ul>

    <a href="${EMAIL_CONFIG.baseUrl}/services/manage" class="email-button">
      View Your Subscription
    </a>

    <p class="email-text">
      Questions? Just reply here. I read every email.
    </p>

    <p class="email-text">
      Adam
    </p>
  `

  const text = `
You're in. Here's what happens next.

Hi ${customerName},

Your ${tierName} subscription is live at $${monthlyPrice.toLocaleString()}/month.

Here's the plan:

- Your first delivery hits your inbox within 5-7 business days
- I'll reach out to schedule our kickoff call
- You can manage everything from your dashboard anytime

View Your Subscription: ${EMAIL_CONFIG.baseUrl}/services/manage

Questions? Just reply here. I read every email.

Adam
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `You're in. Here's what happens next.`,
      title: `You're in. Here's what happens next.`,
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
    <h1 class="email-title">Payment received for ${tierName}</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Just confirming your $${amount.toLocaleString()} payment went through. You're active through ${formattedDate}.
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services/manage" class="email-button">
      View Invoice
    </a>

    <p class="email-text">
      Thanks for sticking with us.
    </p>

    <p class="email-text">
      Adam
    </p>
  `

  const text = `
Payment received for ${tierName}

Hi ${customerName},

Just confirming your $${amount.toLocaleString()} payment went through. You're active through ${formattedDate}.

View Invoice: ${EMAIL_CONFIG.baseUrl}/services/manage

Thanks for sticking with us.

Adam
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Payment confirmed - $${amount.toLocaleString()}`,
      title: `Payment received for ${tierName}`,
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
    <h1 class="email-title">Quick heads up: payment didn't go through</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Your $${amount.toLocaleString()} charge for ${tierName} got declined. Usually it's an expired card or a bank flag.
    </p>

    <p class="email-text">
      Takes 30 seconds to fix:
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services/manage" class="email-button">
      Update Payment Method
    </a>

    <p class="email-text">
      If something's off or you want to chat about your subscription, just reply. I'll sort it out.
    </p>

    <p class="email-text">
      Adam
    </p>
  `

  const text = `
Quick heads up: payment didn't go through

Hi ${customerName},

Your $${amount.toLocaleString()} charge for ${tierName} got declined. Usually it's an expired card or a bank flag.

Takes 30 seconds to fix:

Update Payment Method: ${EMAIL_CONFIG.baseUrl}/services/manage

If something's off or you want to chat about your subscription, just reply. I'll sort it out.

Adam
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Payment didn't go through - quick fix needed`,
      title: `Quick heads up: payment didn't go through`,
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
    <h1 class="email-title">You're cancelled. Door's always open.</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Your ${tierName} subscription is cancelled. You'll still have access through ${formattedDate}.
    </p>

    <p class="email-text">
      If there's something we missed or could've done better, I'd genuinely like to know. Just reply.
    </p>

    <p class="email-text">
      And if you change your mind, reactivating takes one click:
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services" class="email-button">
      Reactivate Subscription
    </a>

    <p class="email-text">
      Thanks for giving Cursive a shot.
    </p>

    <p class="email-text">
      Adam
    </p>
  `

  const text = `
You're cancelled. Door's always open.

Hi ${customerName},

Your ${tierName} subscription is cancelled. You'll still have access through ${formattedDate}.

If there's something we missed or could've done better, I'd genuinely like to know. Just reply.

And if you change your mind, reactivating takes one click:

Reactivate Subscription: ${EMAIL_CONFIG.baseUrl}/services

Thanks for giving Cursive a shot.

Adam
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `You're cancelled. Door's always open.`,
      title: `You're cancelled. Door's always open.`,
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
    <h1 class="email-title">Let's get your first leads rolling</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      You signed up for ${tierName} a few days ago but haven't finished onboarding yet.
    </p>

    <p class="email-text">
      It takes about 10 minutes. I use it to understand your ICP and targeting so your first delivery actually converts.
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services/onboarding" class="email-button">
      Complete Onboarding
    </a>

    <p class="email-text">
      Stuck on something? Reply here and I'll walk you through it.
    </p>

    <p class="email-text">
      Adam
    </p>
  `

  const text = `
Let's get your first leads rolling

Hi ${customerName},

You signed up for ${tierName} a few days ago but haven't finished onboarding yet.

It takes about 10 minutes. I use it to understand your ICP and targeting so your first delivery actually converts.

Complete Onboarding: ${EMAIL_CONFIG.baseUrl}/services/onboarding

Stuck on something? Reply here and I'll walk you through it.

Adam
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Let's get your first leads rolling`,
      title: `Let's get your first leads rolling`,
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
    <h1 class="email-title">Heads up: renewal in 7 days</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Your ${tierName} subscription renews on ${formattedDate} for $${amount.toLocaleString()}.
    </p>

    <p class="email-text">
      Nothing to do on your end. Your card on file gets charged automatically.
    </p>

    <p class="email-text">
      If you need to update your payment method or want to adjust anything before renewal:
    </p>

    <a href="${EMAIL_CONFIG.baseUrl}/services/manage" class="email-button">
      Manage Subscription
    </a>

    <p class="email-text">
      Let me know if there's anything I can do to make the next month better than the last.
    </p>

    <p class="email-text">
      Adam
    </p>
  `

  const text = `
Heads up: renewal in 7 days

Hi ${customerName},

Your ${tierName} subscription renews on ${formattedDate} for $${amount.toLocaleString()}.

Nothing to do on your end. Your card on file gets charged automatically.

If you need to update your payment method or want to adjust anything before renewal:

Manage Subscription: ${EMAIL_CONFIG.baseUrl}/services/manage

Let me know if there's anything I can do to make the next month better than the last.

Adam
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Renewal in 7 days - ${formattedDate}`,
      title: `Heads up: renewal in 7 days`,
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
    <h1 class="email-title">Your ${deliveryLabel} is ready</h1>

    <p class="email-text">
      Hi ${customerName},
    </p>

    <p class="email-text">
      Just finished your ${deliveryLabel}. It's ready to download.
    </p>

    <a href="${downloadUrl}" class="email-button">
      Download Now
    </a>

    <p class="email-text">
      Take a look and let me know if you want any adjustments. Just reply here.
    </p>

    <p class="email-text">
      Adam
    </p>
  `

  const text = `
Your ${deliveryLabel} is ready

Hi ${customerName},

Just finished your ${deliveryLabel}. It's ready to download.

Download Now: ${downloadUrl}

Take a look and let me know if you want any adjustments. Just reply here.

Adam
  `.trim()

  return {
    html: createEmailTemplate({
      preheader: `Your ${deliveryLabel} is ready to download`,
      title: `Your ${deliveryLabel} is ready`,
      content,
    }),
    text,
  }
}
