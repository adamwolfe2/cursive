/**
 * Resend Email Client
 * Handles all transactional emails for service subscriptions
 */

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
export const EMAIL_CONFIG = {
  from: 'Adam @ Cursive <send@meetcursive.com>',
  replyTo: 'adam@meetcursive.com',

  // Brand colors
  colors: {
    primary: '#2563eb', // blue-600
    text: '#000000',
    textMuted: '#71717a', // zinc-500
    background: '#ffffff',
    border: '#e4e4e7', // zinc-200
  },

  // Logo
  logoUrl: 'https://leads.meetcursive.com/logo.png', // Update with actual logo URL

  // Base URL
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://leads.meetcursive.com',
}

/**
 * Send email helper with error handling
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject,
      html,
      text,
    })

    console.log('[Email] Sent successfully:', subject, 'to:', to)
    return { success: true, data: result }
  } catch (error) {
    console.error('[Email] Failed to send:', subject, error)
    return { success: false, error }
  }
}

/**
 * Email template wrapper with consistent styling
 */
export function createEmailTemplate({
  preheader,
  title,
  content,
}: {
  preheader?: string
  title: string
  content: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f5;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      padding: 40px 40px 32px 40px;
      text-align: center;
      border-bottom: 1px solid ${EMAIL_CONFIG.colors.border};
    }
    .email-logo {
      height: 40px;
    }
    .email-body {
      padding: 40px;
      color: ${EMAIL_CONFIG.colors.text};
      font-size: 16px;
      line-height: 24px;
    }
    .email-title {
      margin: 0 0 24px 0;
      font-size: 24px;
      font-weight: 600;
      color: ${EMAIL_CONFIG.colors.text};
      line-height: 32px;
    }
    .email-text {
      margin: 0 0 16px 0;
      color: ${EMAIL_CONFIG.colors.text};
    }
    .email-button {
      display: inline-block;
      margin: 24px 0;
      padding: 12px 32px;
      background-color: ${EMAIL_CONFIG.colors.primary};
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
    }
    .email-signature {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid ${EMAIL_CONFIG.colors.border};
      color: ${EMAIL_CONFIG.colors.text};
    }
    .email-footer {
      padding: 32px 40px;
      text-align: center;
      color: ${EMAIL_CONFIG.colors.textMuted};
      font-size: 14px;
      line-height: 20px;
    }
    .preheader {
      display: none;
      max-width: 0;
      max-height: 0;
      overflow: hidden;
      font-size: 1px;
      line-height: 1px;
      color: #fff;
      opacity: 0;
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="email-wrapper">
    <div class="email-header">
      <img src="${EMAIL_CONFIG.logoUrl}" alt="Cursive" class="email-logo" />
    </div>
    <div class="email-body">
      ${content}
      <div class="email-signature">
        <p class="email-text" style="margin-bottom: 0;">
          Adam @ Cursive
        </p>
      </div>
    </div>
    <div class="email-footer">
      <p style="margin: 0 0 8px 0;">Cursive</p>
      <p style="margin: 0;">
        <a href="${EMAIL_CONFIG.baseUrl}/services/manage" style="color: ${EMAIL_CONFIG.colors.textMuted}; text-decoration: underline;">Manage Subscription</a>
        ·
        <a href="mailto:${EMAIL_CONFIG.replyTo}" style="color: ${EMAIL_CONFIG.colors.textMuted}; text-decoration: underline;">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}
