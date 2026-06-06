/**
 * Magic Login Link email.
 *
 * Sent when someone requests a passwordless login link. Lets buyers who were
 * provisioned without a password (e.g. funnel buyers) get back into the
 * dashboard any time.
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

interface MagicLoginLinkEmailData {
  to: string
  /** The /auth/confirm URL carrying the one-time token_hash. */
  loginUrl: string
}

export async function sendMagicLoginLinkEmail(data: MagicLoginLinkEmailData) {
  const { to, loginUrl } = data

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Here's your secure login link for Cursive.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${loginUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Log in to your dashboard
          </a>
        </td>
      </tr>
    </table>

    <p class="email-text" style="font-size:13px;color:#6b7280;">
      This link signs you in without a password and expires shortly. If you
      didn't request it, you can safely ignore this email.
    </p>
  `

  try {
    return await sendEmail({
      to,
      from: 'Cursive <notifications@meetcursive.com>',
      subject: 'Your Cursive login link',
      html: createEmailTemplate({
        preheader: 'Your secure, passwordless login link.',
        title: 'Log in to Cursive',
        content,
      }),
      text: [
        "Here's your secure login link for Cursive:",
        '',
        loginUrl,
        '',
        "This link signs you in without a password and expires shortly. If you didn't request it, ignore this email.",
      ].join('\n'),
    })
  } catch (err) {
    safeError('[magic-login-link] send failed:', err)
    return { success: false, error: err }
  }
}
