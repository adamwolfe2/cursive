/**
 * Service Email Sender
 * Connects webhook events to email templates
 */

import { sendEmail } from './resend-client'
import {
  createWelcomeEmail,
  createPaymentSuccessEmail,
  createPaymentFailedEmail,
  createSubscriptionCancelledEmail,
  createOnboardingReminderEmail,
  createRenewalReminderEmail,
  createDeliveryNotificationEmail,
} from './templates'

interface ServiceSubscriptionEmailData {
  customerEmail: string
  customerName: string
  tierName: string
  monthlyPrice: number
}

interface PaymentEmailData {
  customerEmail: string
  customerName: string
  tierName: string
  amount: number
  periodEnd?: string
}

interface CancellationEmailData {
  customerEmail: string
  customerName: string
  tierName: string
  accessUntil: string
}

interface OnboardingReminderEmailData {
  customerEmail: string
  customerName: string
  tierName: string
}

interface RenewalReminderEmailData {
  customerEmail: string
  customerName: string
  tierName: string
  amount: number
  renewalDate: string
}

interface DeliveryNotificationEmailData {
  customerEmail: string
  customerName: string
  deliveryType: string
  downloadUrl: string
}

/**
 * Send welcome email after subscription is created
 */
export async function sendWelcomeEmail(data: ServiceSubscriptionEmailData) {
  const { html, text } = createWelcomeEmail({
    customerName: data.customerName,
    tierName: data.tierName,
    monthlyPrice: data.monthlyPrice,
  })

  return sendEmail({
    to: data.customerEmail,
    subject: `Welcome to ${data.tierName}`,
    html,
    text,
  })
}

/**
 * Send payment successful email
 */
export async function sendPaymentSuccessEmail(data: PaymentEmailData) {
  const { html, text } = createPaymentSuccessEmail({
    customerName: data.customerName,
    tierName: data.tierName,
    amount: data.amount,
    periodEnd: data.periodEnd || new Date().toISOString(),
  })

  return sendEmail({
    to: data.customerEmail,
    subject: 'Payment Received',
    html,
    text,
  })
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(data: PaymentEmailData) {
  const { html, text } = createPaymentFailedEmail({
    customerName: data.customerName,
    tierName: data.tierName,
    amount: data.amount,
  })

  return sendEmail({
    to: data.customerEmail,
    subject: 'Action Needed: Payment Issue',
    html,
    text,
  })
}

/**
 * Send subscription cancelled email
 */
export async function sendCancellationEmail(data: CancellationEmailData) {
  const { html, text } = createSubscriptionCancelledEmail({
    customerName: data.customerName,
    tierName: data.tierName,
    accessUntil: data.accessUntil,
  })

  return sendEmail({
    to: data.customerEmail,
    subject: 'Subscription Cancelled',
    html,
    text,
  })
}

/**
 * Send onboarding reminder email
 */
export async function sendOnboardingReminderEmail(data: OnboardingReminderEmailData) {
  const { html, text } = createOnboardingReminderEmail({
    customerName: data.customerName,
    tierName: data.tierName,
  })

  return sendEmail({
    to: data.customerEmail,
    subject: "Let's Get You Started",
    html,
    text,
  })
}

/**
 * Send renewal reminder email (7 days before renewal)
 */
export async function sendRenewalReminderEmail(data: RenewalReminderEmailData) {
  const { html, text } = createRenewalReminderEmail({
    customerName: data.customerName,
    tierName: data.tierName,
    amount: data.amount,
    renewalDate: data.renewalDate,
  })

  return sendEmail({
    to: data.customerEmail,
    subject: 'Upcoming Renewal',
    html,
    text,
  })
}

/**
 * Send delivery notification email
 */
export async function sendDeliveryNotificationEmail(data: DeliveryNotificationEmailData) {
  const { html, text } = createDeliveryNotificationEmail({
    customerName: data.customerName,
    deliveryType: data.deliveryType,
    downloadUrl: data.downloadUrl,
  })

  const typeLabels: Record<string, string> = {
    lead_list: 'Lead List',
    campaign_setup: 'Campaign Report',
    monthly_report: 'Monthly Report',
    optimization_session: 'Optimization Report',
  }

  const deliveryLabel = typeLabels[data.deliveryType] || data.deliveryType

  return sendEmail({
    to: data.customerEmail,
    subject: `Your ${deliveryLabel} is Ready`,
    html,
    text,
  })
}
