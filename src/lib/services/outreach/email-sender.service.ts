/**
 * Email Sender Service
 * Cursive Platform
 *
 * Handles email sending through multiple providers:
 * - Resend (transactional)
 * - Gmail OAuth
 * - Outlook OAuth
 * - SMTP
 */

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES
// ============================================================================

export interface EmailSendRequest {
  to: string
  toName?: string
  from: string
  fromName?: string
  subject: string
  bodyHtml?: string
  bodyText?: string
  replyTo?: string
  trackOpens?: boolean
  trackClicks?: boolean
  tags?: string[]
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
  provider: string
}

export interface EmailAccount {
  id: string
  workspaceId: string
  emailAddress: string
  displayName: string | null
  provider: 'gmail' | 'outlook' | 'smtp' | 'resend'
  isVerified: boolean
  isPrimary: boolean
  dailySendLimit: number
  sendsToday: number
}

// ============================================================================
// RESEND CLIENT (Default for transactional)
// ============================================================================

let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

// ============================================================================
// EMAIL SENDING
// ============================================================================

/**
 * Send email using the appropriate provider
 */
export async function sendEmail(
  request: EmailSendRequest,
  accountId?: string,
  workspaceId?: string
): Promise<EmailSendResult> {
  // If account ID provided, use that specific account
  if (accountId && workspaceId) {
    const account = await getEmailAccount(accountId, workspaceId)
    if (account) {
      return await sendWithAccount(request, account)
    }
  }

  // Default to Resend for transactional emails
  return await sendWithResend(request)
}

/**
 * Send email using Resend
 */
async function sendWithResend(request: EmailSendRequest): Promise<EmailSendResult> {
  try {
    const resend = getResendClient()

    const fromAddress = request.fromName
      ? `${request.fromName} <${request.from}>`
      : request.from

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: request.to,
      subject: request.subject,
      html: request.bodyHtml,
      text: request.bodyText,
      reply_to: request.replyTo,
      tags: request.tags?.map((tag) => ({ name: tag, value: 'true' })),
    })

    if (error) {
      return {
        success: false,
        error: error.message,
        provider: 'resend',
      }
    }

    return {
      success: true,
      messageId: data?.id,
      provider: 'resend',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email',
      provider: 'resend',
    }
  }
}

/**
 * Send email using connected account (Gmail/Outlook/SMTP)
 */
async function sendWithAccount(
  request: EmailSendRequest,
  account: EmailAccount
): Promise<EmailSendResult> {
  // Check daily limit
  if (account.sendsToday >= account.dailySendLimit) {
    return {
      success: false,
      error: 'Daily send limit reached for this account',
      provider: account.provider,
    }
  }

  switch (account.provider) {
    case 'gmail':
      return await sendWithGmail(request, account)
    case 'outlook':
      return await sendWithOutlook(request, account)
    case 'smtp':
      return await sendWithSmtp(request, account)
    default:
      return await sendWithResend(request)
  }
}

/**
 * Send email via Gmail API
 */
async function sendWithGmail(
  request: EmailSendRequest,
  account: EmailAccount
): Promise<EmailSendResult> {
  try {
    // Get credentials from database
    const supabase = await createClient()
    const { data: accountData } = await supabase
      .from('email_accounts')
      .select('credentials_encrypted')
      .eq('id', account.id)
      .single()

    if (!accountData?.credentials_encrypted) {
      return {
        success: false,
        error: 'Gmail credentials not found',
        provider: 'gmail',
      }
    }

    const credentials = accountData.credentials_encrypted as any

    // Refresh token if needed
    if (new Date(credentials.expires_at) <= new Date()) {
      const refreshed = await refreshGmailToken(account.id, credentials.refresh_token)
      if (!refreshed) {
        return {
          success: false,
          error: 'Failed to refresh Gmail token',
          provider: 'gmail',
        }
      }
      credentials.access_token = refreshed.access_token
    }

    // Build the email
    const emailContent = buildMimeMessage(request)
    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Send via Gmail API
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error?.message || 'Gmail API error',
        provider: 'gmail',
      }
    }

    const data = await response.json()

    // Increment sends count
    await incrementSendCount(account.id)

    return {
      success: true,
      messageId: data.id,
      provider: 'gmail',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gmail send failed',
      provider: 'gmail',
    }
  }
}

/**
 * Send email via Outlook/Microsoft Graph API
 */
async function sendWithOutlook(
  request: EmailSendRequest,
  account: EmailAccount
): Promise<EmailSendResult> {
  try {
    const supabase = await createClient()
    const { data: accountData } = await supabase
      .from('email_accounts')
      .select('credentials_encrypted')
      .eq('id', account.id)
      .single()

    if (!accountData?.credentials_encrypted) {
      return {
        success: false,
        error: 'Outlook credentials not found',
        provider: 'outlook',
      }
    }

    const credentials = accountData.credentials_encrypted as any

    // Refresh token if needed
    if (new Date(credentials.expires_at) <= new Date()) {
      const refreshed = await refreshOutlookToken(account.id, credentials.refresh_token)
      if (!refreshed) {
        return {
          success: false,
          error: 'Failed to refresh Outlook token',
          provider: 'outlook',
        }
      }
      credentials.access_token = refreshed.access_token
    }

    // Build Microsoft Graph message
    const message = {
      message: {
        subject: request.subject,
        body: {
          contentType: request.bodyHtml ? 'HTML' : 'Text',
          content: request.bodyHtml || request.bodyText,
        },
        toRecipients: [
          {
            emailAddress: {
              address: request.to,
              name: request.toName,
            },
          },
        ],
        from: {
          emailAddress: {
            address: request.from,
            name: request.fromName,
          },
        },
      },
      saveToSentItems: true,
    }

    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/sendMail',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error?.message || 'Outlook API error',
        provider: 'outlook',
      }
    }

    await incrementSendCount(account.id)

    return {
      success: true,
      messageId: `outlook-${Date.now()}`,
      provider: 'outlook',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Outlook send failed',
      provider: 'outlook',
    }
  }
}

/**
 * Send email via SMTP
 */
async function sendWithSmtp(
  request: EmailSendRequest,
  account: EmailAccount
): Promise<EmailSendResult> {
  try {
    const supabase = await createClient()
    const { data: accountData } = await supabase
      .from('email_accounts')
      .select('credentials_encrypted')
      .eq('id', account.id)
      .single()

    if (!accountData?.credentials_encrypted) {
      return {
        success: false,
        error: 'SMTP credentials not found',
        provider: 'smtp',
      }
    }

    const credentials = accountData.credentials_encrypted as any

    // Use nodemailer for SMTP
    const nodemailer = await import('nodemailer')

    const transporter = nodemailer.createTransport({
      host: credentials.host,
      port: credentials.port || 587,
      secure: credentials.port === 465,
      auth: {
        user: credentials.username,
        pass: credentials.password,
      },
    })

    const info = await transporter.sendMail({
      from: request.fromName
        ? `"${request.fromName}" <${request.from}>`
        : request.from,
      to: request.to,
      subject: request.subject,
      text: request.bodyText,
      html: request.bodyHtml,
      replyTo: request.replyTo,
    })

    await incrementSendCount(account.id)

    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'SMTP send failed',
      provider: 'smtp',
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get email account from database
 */
async function getEmailAccount(
  accountId: string,
  workspaceId: string
): Promise<EmailAccount | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!data) return null

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    emailAddress: data.email_address,
    displayName: data.display_name,
    provider: data.provider,
    isVerified: data.is_verified,
    isPrimary: data.is_primary,
    dailySendLimit: data.daily_send_limit,
    sendsToday: data.sends_today,
  }
}

/**
 * Increment the send count for an account
 */
async function incrementSendCount(accountId: string): Promise<void> {
  const supabase = await createClient()

  await supabase.rpc('increment_email_sends', { account_id: accountId })

  // Fallback if RPC doesn't exist
  await supabase
    .from('email_accounts')
    .update({
      sends_today: supabase.rpc ? undefined : 1, // Will be incremented by trigger ideally
      last_used_at: new Date().toISOString(),
    })
    .eq('id', accountId)
}

/**
 * Build MIME message for Gmail
 */
function buildMimeMessage(request: EmailSendRequest): string {
  const boundary = `boundary_${Date.now()}`

  const headers = [
    `From: ${request.fromName ? `"${request.fromName}" <${request.from}>` : request.from}`,
    `To: ${request.toName ? `"${request.toName}" <${request.to}>` : request.to}`,
    `Subject: ${request.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ]

  if (request.replyTo) {
    headers.push(`Reply-To: ${request.replyTo}`)
  }

  const parts = []

  if (request.bodyText) {
    parts.push(
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      request.bodyText
    )
  }

  if (request.bodyHtml) {
    parts.push(
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      request.bodyHtml
    )
  }

  parts.push(`--${boundary}--`)

  return [...headers, '', ...parts].join('\r\n')
}

/**
 * Refresh Gmail OAuth token
 */
async function refreshGmailToken(
  accountId: string,
  refreshToken: string
): Promise<{ access_token: string } | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured')
      return null
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) return null

    const data = await response.json()

    // Update token in database
    const supabase = await createClient()
    await supabase
      .from('email_accounts')
      .update({
        credentials_encrypted: {
          access_token: data.access_token,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        },
      })
      .eq('id', accountId)

    return { access_token: data.access_token }
  } catch {
    return null
  }
}

/**
 * Refresh Outlook OAuth token
 */
async function refreshOutlookToken(
  accountId: string,
  refreshToken: string
): Promise<{ access_token: string } | null> {
  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      console.error('Microsoft OAuth credentials not configured')
      return null
    }

    const response = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Mail.Send offline_access',
        }),
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    // Update token in database
    const supabase = await createClient()
    await supabase
      .from('email_accounts')
      .update({
        credentials_encrypted: {
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        },
      })
      .eq('id', accountId)

    return { access_token: data.access_token }
  } catch {
    return null
  }
}

// ============================================================================
// TRACKING
// ============================================================================

/**
 * Log sent email for tracking
 */
export async function logSentEmail(
  workspaceId: string,
  leadId: string | null,
  accountId: string | null,
  request: EmailSendRequest,
  result: EmailSendResult,
  sequenceEnrollmentId?: string
): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sent_emails')
    .insert({
      workspace_id: workspaceId,
      lead_id: leadId,
      email_account_id: accountId,
      sequence_enrollment_id: sequenceEnrollmentId,
      to_email: request.to,
      to_name: request.toName,
      from_email: request.from,
      from_name: request.fromName,
      subject: request.subject,
      body_html: request.bodyHtml,
      body_text: request.bodyText,
      status: result.success ? 'sent' : 'failed',
      external_id: result.messageId,
      sent_at: result.success ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to log sent email:', error)
    return null
  }

  // Log activity if lead is associated
  if (leadId) {
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      workspace_id: workspaceId,
      activity_type: 'email_sent',
      description: `Email sent: ${request.subject}`,
      metadata: {
        email_id: data.id,
        to: request.to,
        subject: request.subject,
      },
    })
  }

  return data.id
}

// ============================================================================
// BULK SENDING
// ============================================================================

/**
 * Send emails in bulk with rate limiting
 */
export async function sendBulkEmails(
  requests: Array<EmailSendRequest & { leadId?: string }>,
  workspaceId: string,
  accountId?: string,
  options: {
    delayBetweenMs?: number
    maxConcurrent?: number
  } = {}
): Promise<{
  sent: number
  failed: number
  results: Array<{ index: number; result: EmailSendResult }>
}> {
  const { delayBetweenMs = 1000, maxConcurrent = 5 } = options

  const results: Array<{ index: number; result: EmailSendResult }> = []
  let sent = 0
  let failed = 0

  // Process in batches
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent)

    const batchResults = await Promise.all(
      batch.map(async (request, batchIndex) => {
        const index = i + batchIndex
        const result = await sendEmail(request, accountId, workspaceId)

        await logSentEmail(
          workspaceId,
          request.leadId || null,
          accountId || null,
          request,
          result
        )

        return { index, result }
      })
    )

    for (const { index, result } of batchResults) {
      results.push({ index, result })
      if (result.success) {
        sent++
      } else {
        failed++
      }
    }

    // Rate limiting delay between batches
    if (i + maxConcurrent < requests.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs))
    }
  }

  return { sent, failed, results }
}
