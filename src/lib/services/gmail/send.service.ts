/**
 * Gmail Send Service — Phase 2
 * ----------------------------
 * Sends an email via the authenticated user's Gmail account
 * (gmail.users.messages.send). Uses getValidAccessToken() for automatic
 * refresh, builds an RFC 2822 message, and base64url-encodes it.
 *
 * Returns the Gmail message id + thread id, which we persist on the
 * email_sends row in place of the EmailBison message id.
 *
 * Used by:
 *   - src/inngest/functions/campaign-send.ts (sendApprovedEmail) when
 *     the email_send row has email_account_id set to a gmail account.
 */

import { getValidAccessToken } from './email-account.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'

export interface GmailSendInput {
  /** email_accounts.id of the connected Gmail row */
  accountId: string
  fromEmail: string
  fromName?: string | null
  toEmail: string
  toName?: string | null
  subject: string
  bodyHtml: string
  /** Optional plain-text alt body */
  bodyText?: string | null
  /** RFC 5322 In-Reply-To / References (for replies) */
  inReplyTo?: string | null
  references?: string | null
}

export interface GmailSendResult {
  messageId: string
  threadId: string
  sentAt: string
}

/**
 * Send a single email via the authenticated Gmail account.
 *
 * Throws on any error — caller is responsible for status updates.
 */
export async function sendViaGmail(input: GmailSendInput): Promise<GmailSendResult> {
  const accessToken = await getValidAccessToken(input.accountId)

  const raw = buildRfc2822Message(input)
  const encoded = base64urlEncode(raw)

  const res = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    safeError('[gmail-send] failed', { status: res.status, body: errBody.slice(0, 500) })
    throw new Error(`Gmail send failed: ${res.status} ${errBody.slice(0, 200)}`)
  }

  const json = (await res.json()) as { id?: string; threadId?: string; labelIds?: string[] }
  if (!json.id || !json.threadId) {
    throw new Error('Gmail send returned an unexpected response shape')
  }

  return {
    messageId: json.id,
    threadId: json.threadId,
    sentAt: new Date().toISOString(),
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build a multipart/alternative RFC 2822 message with text + html parts.
 * Gmail accepts UTF-8 — we use a simple `=?UTF-8?B?...?=` encoded-word for
 * the subject so non-ASCII characters survive.
 */
function buildRfc2822Message(input: GmailSendInput): string {
  const boundary = `cursive-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const fromHeader = input.fromName
    ? `${formatHeaderName(input.fromName)} <${input.fromEmail}>`
    : input.fromEmail

  const toHeader = input.toName
    ? `${formatHeaderName(input.toName)} <${input.toEmail}>`
    : input.toEmail

  const headers: string[] = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: ${encodeSubject(input.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ]

  if (input.inReplyTo) headers.push(`In-Reply-To: ${input.inReplyTo}`)
  if (input.references) headers.push(`References: ${input.references}`)

  const textPart = input.bodyText && input.bodyText.length > 0
    ? input.bodyText
    : stripHtmlForFallback(input.bodyHtml)

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    textPart,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    input.bodyHtml,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n')

  return headers.join('\r\n') + '\r\n\r\n' + body
}

/**
 * Quote a display name with double quotes if it contains a special char.
 * RFC 2822 atoms vs quoted-strings — keep it simple.
 */
function formatHeaderName(name: string): string {
  const trimmed = name.replace(/[\r\n]/g, '').trim()
  if (/[(),:;<>@[\\\]"]/.test(trimmed)) {
    return `"${trimmed.replace(/"/g, '\\"')}"`
  }
  return trimmed
}

/**
 * RFC 2047 encoded-word for subjects with non-ASCII characters.
 * If the subject is plain ASCII we leave it alone (more readable in inbox).
 */
function encodeSubject(subject: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(subject)) return subject
  const b64 = Buffer.from(subject, 'utf8').toString('base64')
  return `=?UTF-8?B?${b64}?=`
}

/**
 * Cheap HTML → text fallback. Preserves paragraph and line breaks.
 */
function stripHtmlForFallback(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

/**
 * Standard base64url encoding (Gmail API format).
 */
function base64urlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
