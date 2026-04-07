/**
 * POST /api/integrations/gmail/test-send
 *
 * Sends a one-off test email TO the user's own connected Gmail address
 * FROM the same address. Lets the user verify the OAuth + send pipeline
 * works end-to-end before committing to a real Outbound Agent Run.
 *
 * No body required — uses the workspace's primary verified Gmail account.
 * Returns the Gmail message id on success.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  ApiError,
} from '@/lib/utils/api-error-handler'
import { findGmailAccountForWorkspace, TokenRevokedError, markNeedsReconnect } from '@/lib/services/gmail/email-account.service'
import { sendViaGmail } from '@/lib/services/gmail/send.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export const maxDuration = 30

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const account = await findGmailAccountForWorkspace(user.workspace_id)
    if (!account) {
      throw new ApiError(
        'No Gmail account connected. Click Connect Gmail first.',
        412
      )
    }

    const subject = `Cursive Outbound Agent — test send ${new Date().toLocaleTimeString()}`
    const bodyHtml = `
      <p>Hi ${account.display_name ?? 'there'},</p>
      <p>This is a test email from your <strong>Cursive Outbound Agent</strong>.</p>
      <p>If you're seeing this in your inbox, the Gmail integration is working end-to-end:</p>
      <ul>
        <li>OAuth tokens are stored + refreshing correctly</li>
        <li>Cursive can build RFC 822 messages and POST them to Gmail</li>
        <li>Gmail accepted and delivered the message via your account</li>
      </ul>
      <p>You're ready to run a real workflow. Visit <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://leads.meetcursive.com'}/outbound">/outbound</a> to start.</p>
      <p>— Cursive</p>
    `.trim()

    try {
      const result = await sendViaGmail({
        accountId: account.id,
        fromEmail: account.email_address,
        fromName: account.display_name,
        toEmail: account.email_address, // send to self
        toName: account.display_name,
        subject,
        bodyHtml,
        bodyText:
          `Cursive Outbound Agent — test send.\n\n` +
          `If you're reading this, the Gmail integration works end-to-end. ` +
          `Visit ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://leads.meetcursive.com'}/outbound to start a real workflow.`,
      })

      return NextResponse.json({
        ok: true,
        message_id: result.messageId,
        thread_id: result.threadId,
        sent_to: account.email_address,
      })
    } catch (err) {
      // Token revocation → mark + return clear error
      if (err instanceof TokenRevokedError) {
        await markNeedsReconnect(account.id, 'invalid_grant during test send')
        throw new ApiError(
          `Gmail access has been revoked for ${account.email_address}. Click Reconnect Gmail.`,
          401
        )
      }
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('401')) {
        await markNeedsReconnect(account.id, msg)
        throw new ApiError(
          `Gmail returned 401 for ${account.email_address}. Reconnect required.`,
          401
        )
      }
      safeError('[gmail-test-send] failed:', err)
      throw err
    }
  } catch (error) {
    return handleApiError(error)
  }
}
