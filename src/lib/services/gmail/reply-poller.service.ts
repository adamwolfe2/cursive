/**
 * Gmail Reply Poller — Phase 2.5
 * --------------------------------
 * Without this service, every email Outbound Agent sends through Gmail
 * would be invisible to the Cursive dashboard once the recipient replies.
 * EmailBison's reply webhook never fires (we didn't send through it), so
 * `email_replies` would never get a row, and the workflow's Replying /
 * Meeting Booked stage cards would stay frozen at 0 forever.
 *
 * What this does
 * --------------
 * For a single connected Gmail account:
 *   1. Lists message ids in INBOX changed since the account's
 *      last_reply_poll_at (default: last 24h on first run)
 *   2. Fetches each message's headers + plain-text body
 *   3. Reads `In-Reply-To` and `References` headers
 *   4. Looks up matching `email_sends` row by `message_id_header`
 *   5. If a match is found: classifies sentiment via Claude, inserts an
 *      `email_replies` row, dedupes by gmail_message_id (UNIQUE index)
 *   6. Updates `last_reply_poll_at` so the next poll starts here
 *
 * Used by:
 *   - src/inngest/functions/gmail-reply-poller.ts (cron + per-account event)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessToken } from './email-account.service'
import { classifySentiment } from '@/lib/services/autoresearch/sentiment-classifier'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const GMAIL_LIST_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const GMAIL_GET_URL = (id: string) =>
  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`

interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  payload?: {
    headers?: Array<{ name: string; value: string }>
    body?: { data?: string }
    parts?: GmailPart[]
  }
  internalDate?: string
  snippet?: string
}

interface GmailPart {
  mimeType?: string
  body?: { data?: string; size?: number }
  parts?: GmailPart[]
}

export interface PollResult {
  account_id: string
  email_address: string
  fetched: number
  matched: number
  inserted: number
  skipped_already_processed: number
  skipped_no_match: number
  errors: number
}

// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================

/**
 * Poll one Gmail account for replies. Idempotent — re-running on the same
 * window is safe (gmail_message_id has a UNIQUE index).
 */
export async function pollGmailAccountForReplies(accountId: string): Promise<PollResult> {
  const supabase = createAdminClient()
  const result: PollResult = {
    account_id: accountId,
    email_address: '',
    fetched: 0,
    matched: 0,
    inserted: 0,
    skipped_already_processed: 0,
    skipped_no_match: 0,
    errors: 0,
  }

  // 1. Load the account
  const { data: account, error: accErr } = await supabase
    .from('email_accounts')
    .select('id, workspace_id, email_address, last_reply_poll_at, provider, is_verified')
    .eq('id', accountId)
    .maybeSingle()

  if (accErr || !account) {
    throw new Error(`Email account ${accountId} not found`)
  }
  if (account.provider !== 'gmail' || !account.is_verified) {
    throw new Error(`Account ${accountId} is not a verified Gmail account`)
  }

  result.email_address = account.email_address

  // 2. Get a valid access token
  const accessToken = await getValidAccessToken(accountId)

  // 3. Build Gmail search query — newer than last poll, in INBOX, not from self
  const lastPolledAt = account.last_reply_poll_at
    ? new Date(account.last_reply_poll_at)
    : new Date(Date.now() - 24 * 60 * 60 * 1000)
  const sinceEpoch = Math.floor(lastPolledAt.getTime() / 1000)
  const q = `in:inbox after:${sinceEpoch} -from:${account.email_address}`

  const listUrl = `${GMAIL_LIST_URL}?q=${encodeURIComponent(q)}&maxResults=50`
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${listRes.status}`)
  }

  const listJson = (await listRes.json()) as { messages?: Array<{ id: string; threadId: string }> }
  const messages = listJson.messages ?? []
  result.fetched = messages.length

  if (messages.length === 0) {
    await supabase
      .from('email_accounts')
      .update({ last_reply_poll_at: new Date().toISOString() })
      .eq('id', accountId)
    return result
  }

  // 4. Fetch + process each message
  for (const stub of messages) {
    try {
      // Dedupe FIRST — skip if we've already processed this Gmail message id
      const { data: existing } = await supabase
        .from('email_replies')
        .select('id')
        .eq('gmail_message_id', stub.id)
        .maybeSingle()

      if (existing) {
        result.skipped_already_processed += 1
        continue
      }

      const msg = await fetchGmailMessage(stub.id, accessToken)
      if (!msg) {
        result.errors += 1
        continue
      }

      const headers = parseHeaders(msg.payload?.headers ?? [])
      const inReplyTo = headers.get('in-reply-to')
      const references = headers.get('references')

      if (!inReplyTo && !references) {
        // Not a reply at all — skip
        result.skipped_no_match += 1
        continue
      }

      // Build the candidate header values to match against email_sends.message_id_header
      const candidates = new Set<string>()
      if (inReplyTo) candidates.add(stripBrackets(inReplyTo))
      if (references) {
        for (const ref of references.split(/\s+/)) {
          if (ref.trim()) candidates.add(stripBrackets(ref))
        }
      }

      // Look up the original send by message_id_header
      const candidateList = Array.from(candidates)
      const { data: matchedSends } = await supabase
        .from('email_sends')
        .select('id, workspace_id, campaign_id, lead_id, recipient_email, subject')
        .in(
          'message_id_header',
          // Try both with and without brackets — different MTAs vary
          [
            ...candidateList,
            ...candidateList.map(c => `<${c}>`),
          ]
        )
        .eq('workspace_id', account.workspace_id)
        .limit(1)

      const send = matchedSends?.[0]
      if (!send) {
        result.skipped_no_match += 1
        continue
      }

      result.matched += 1

      // Extract from + body
      const fromHeader = headers.get('from') ?? ''
      const { fromEmail, fromName } = parseFromHeader(fromHeader)
      const subject = headers.get('subject') ?? '(no subject)'
      const bodyText = extractPlainText(msg.payload) || msg.snippet || ''
      const bodyHtml = extractHtml(msg.payload) ?? null
      const receivedAt = msg.internalDate
        ? new Date(parseInt(msg.internalDate, 10)).toISOString()
        : new Date().toISOString()

      // Classify sentiment via the existing classifier (keyword tier 1, Claude tier 2).
      // Best-effort — never throws because we want to ALWAYS persist the reply.
      let sentiment: string | null = null
      let confidence: number | null = null
      try {
        const cls = await classifySentiment(bodyText, subject, {})
        sentiment = cls.sentiment
        confidence = cls.confidence
      } catch (clsErr) {
        safeError('[gmail-poll] sentiment classify failed (non-fatal):', clsErr)
      }
      // Derive intent_score from sentiment so the workflow's Meeting Booked
      // counter (which filters on intent_score >= 8) actually moves.
      const intentScore = deriveIntentScore(sentiment)

      // Insert into email_replies (workspace-scoped, dedupe via UNIQUE index)
      const insert: Record<string, unknown> = {
        workspace_id: account.workspace_id,
        campaign_id: send.campaign_id,
        email_send_id: send.id,
        lead_id: send.lead_id,
        from_email: fromEmail || 'unknown@unknown',
        from_name: fromName || null,
        subject,
        body_text: bodyText,
        body_html: bodyHtml,
        received_at: receivedAt,
        gmail_message_id: stub.id,
        sentiment,
        intent_score: intentScore,
        classification_confidence: confidence,
        classified_at: sentiment ? new Date().toISOString() : null,
        classification_metadata: { source: 'gmail-poller', gmail_thread_id: stub.threadId },
        status: 'new',
      }

      const { error: insertErr } = await supabase.from('email_replies').insert(insert)
      if (insertErr) {
        // Unique violation = race condition with another poller run, fine to skip
        if (insertErr.code === '23505') {
          result.skipped_already_processed += 1
        } else {
          safeError('[gmail-poll] insert reply failed:', insertErr)
          result.errors += 1
        }
        continue
      }

      // Bump the email_sends row so the existing UI knows it has a reply
      await supabase
        .from('email_sends')
        .update({ replied_at: receivedAt })
        .eq('id', send.id)
        .is('replied_at', null)

      result.inserted += 1
    } catch (err) {
      safeError(`[gmail-poll] message ${stub.id} failed:`, err)
      result.errors += 1
    }
  }

  // 5. Bump last poll timestamp
  await supabase
    .from('email_accounts')
    .update({ last_reply_poll_at: new Date().toISOString() })
    .eq('id', accountId)

  safeLog('[gmail-poll] done', result)
  return result
}

// ============================================================================
// HELPERS
// ============================================================================

async function fetchGmailMessage(id: string, accessToken: string): Promise<GmailMessage | null> {
  const res = await fetch(GMAIL_GET_URL(id), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return (await res.json()) as GmailMessage
}

function parseHeaders(headers: Array<{ name: string; value: string }>): Map<string, string> {
  const m = new Map<string, string>()
  for (const h of headers) {
    m.set(h.name.toLowerCase(), h.value)
  }
  return m
}

function stripBrackets(s: string): string {
  return s.trim().replace(/^</, '').replace(/>$/, '')
}

function parseFromHeader(raw: string): { fromEmail: string; fromName: string | null } {
  // Examples:
  //   "Jane Smith" <jane@example.com>
  //   Jane Smith <jane@example.com>
  //   jane@example.com
  const m = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/)
  if (m) {
    return { fromEmail: m[2].trim(), fromName: m[1].trim() || null }
  }
  return { fromEmail: raw.trim(), fromName: null }
}

/**
 * Walk a Gmail payload tree, returning the first text/plain part decoded.
 */
function extractPlainText(payload?: GmailMessage['payload']): string {
  if (!payload) return ''
  return walkPart(payload as GmailPart, 'text/plain') ?? ''
}

function extractHtml(payload?: GmailMessage['payload']): string | null {
  if (!payload) return null
  return walkPart(payload as GmailPart, 'text/html')
}

function walkPart(part: GmailPart, mime: string): string | null {
  if (part.mimeType === mime && part.body?.data) {
    return decodeBase64Url(part.body.data)
  }
  if (part.parts) {
    for (const child of part.parts) {
      const found = walkPart(child, mime)
      if (found) return found
    }
  }
  return null
}

function decodeBase64Url(s: string): string {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

/**
 * Map keyword/Claude sentiment → 0–10 intent score.
 * The workflow's Meeting Booked count filters on intent_score >= 8 AND
 * sentiment IN ('positive','question'), so positive replies need to land
 * at 8+ to be counted.
 */
function deriveIntentScore(sentiment: string | null): number | null {
  if (!sentiment) return null
  switch (sentiment) {
    case 'positive':
      return 9
    case 'question':
      return 8
    case 'neutral':
      return 5
    case 'negative':
    case 'not_interested':
      return 2
    case 'out_of_office':
    case 'unsubscribe':
      return 0
    default:
      return 5
  }
}
