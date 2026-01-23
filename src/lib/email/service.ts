/**
 * Email Service
 * OpenInfo Platform
 *
 * Email sending utilities using Resend.
 */

import { Resend } from 'resend'
import {
  renderEmail,
  WelcomeEmail,
  QueryCompletedEmail,
  CreditLowEmail,
  ExportReadyEmail,
  WeeklyDigestEmail,
  PasswordResetEmail,
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
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// ============================================
// EMAIL SENDER
// ============================================

const FROM_EMAIL = process.env.EMAIL_FROM || 'OpenInfo <notifications@openinfo.com>'

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const resend = getResendClient()

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      tags: options.tags,
    })

    if (error) {
      console.error('[Email] Send error:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Sent successfully:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('[Email] Send error:', error)
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

  const html = renderEmail(
    WelcomeEmail({ userName, loginUrl })
  )

  return sendEmail({
    to: email,
    subject: 'Welcome to OpenInfo!',
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

  const html = renderEmail(
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

  const html = renderEmail(
    CreditLowEmail({ userName, creditsRemaining, billingUrl })
  )

  return sendEmail({
    to: email,
    subject: 'Your OpenInfo credits are running low',
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
  const html = renderEmail(
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

  const html = renderEmail(
    WeeklyDigestEmail({ userName, stats, dashboardUrl })
  )

  return sendEmail({
    to: email,
    subject: 'Your OpenInfo Weekly Summary',
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

  const html = renderEmail(
    PasswordResetEmail({
      userName,
      resetUrl,
      expiresIn: '1 hour',
    })
  )

  return sendEmail({
    to: email,
    subject: 'Reset your OpenInfo password',
    html,
    tags: [
      { name: 'category', value: 'auth' },
      { name: 'type', value: 'password_reset' },
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
