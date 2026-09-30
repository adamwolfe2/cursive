/**
 * "Your 25 leads are ready" email for the free-leads flow (/start).
 * The button is a one-time magic link; the leads are pulled only after it is opened.
 *
 * Standalone layout (not createEmailTemplate): this is the first email a
 * prospect ever gets from Cursive, so it carries its own premium shell.
 * Table-based, inline styles, 600px, VML button for Outlook, light-only.
 */
import { sendEmail } from '../resend-client'
import { escapeHtml } from './layout'
import { APP_URL } from '@/lib/config/urls'
import { safeError } from '@/lib/utils/log-sanitizer'

interface FreeLeadsReadyEmailData {
  to: string
  /** The /auth/confirm URL carrying the one-time token_hash (next=/start/leads). */
  loginUrl: string
  /** Prospect's own site, e.g. "acme.com". */
  domain: string
  /** Optional one-line ICP, e.g. "You sell SOC 2 audits to Series A SaaS teams." */
  icpSummary?: string
}

// Prod URL on purpose: preview/local APP_URLs are not reachable from inboxes.
const LOGO_URL = 'https://leads.meetcursive.com/cursive-logo.png'
const SUPPORT_EMAIL = 'support@meetcursive.com'
/** Supabase magic link lifetime (auth.email otp expiry, default 3600s). */
const LINK_EXPIRY = '1 hour'

const INK = '#1d2025'
const MUTED = '#6b7280'
const BORDER = '#e5e7eb'
const BLUE = '#007AFF'
const CANVAS = '#f5f6f8'
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

const FIELDS = ['Full name', 'Job title', 'Verified work email', 'LinkedIn profile']

function button(href: string, label: string): string {
  return `
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="20%" stroke="f" fillcolor="${BLUE}">
<w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-- -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-table">
  <tr>
    <td align="center" bgcolor="${BLUE}" style="background-color:${BLUE};border-radius:10px;">
      <a href="${href}" target="_blank" rel="noopener noreferrer" class="btn"
         style="display:inline-block;padding:16px 36px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:-0.01em;">${label}</a>
    </td>
  </tr>
</table>
<!--<![endif]-->`
}

function fieldRows(): string {
  return FIELDS.map(
    (f, i) => `
      <tr>
        <td width="28" valign="middle" style="padding:10px 0 10px 16px;${i ? `border-top:1px solid ${BORDER};` : ''}">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="8" height="8" bgcolor="${BLUE}" style="width:8px;height:8px;background-color:${BLUE};border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr></table>
        </td>
        <td valign="middle" style="padding:10px 16px 10px 0;font-family:${FONT};font-size:14px;line-height:20px;color:${INK};${i ? `border-top:1px solid ${BORDER};` : ''}">${f}</td>
      </tr>`
  ).join('')
}

export function renderFreeLeadsReadyEmail({ to, loginUrl, domain, icpSummary }: FreeLeadsReadyEmailData) {
  const safeDomain = escapeHtml(domain)
  const safeTo = escapeHtml(to)
  const safeUrl = escapeHtml(loginUrl)
  const summary = icpSummary?.trim()
  const startUrl = `${APP_URL}/start`
  const startLabel = escapeHtml(startUrl.replace(/^https?:\/\//, ''))
  const subject = 'Your 25 leads are ready'
  const preheader = `25 decision-makers matched to ${safeDomain}, with verified work emails. Your link works once and expires in ${LINK_EXPIRY}.`

  const icpBlock = summary
    ? `
          <tr>
            <td class="px" style="padding:0 40px 28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#f0f7ff" style="background-color:#f0f7ff;border:1px solid #d6eaff;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 4px 0;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${MUTED};">Who we looked for</p>
                    <p style="margin:0;font-family:${FONT};font-size:15px;line-height:22px;color:${INK};">${escapeHtml(summary)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${subject}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  :root { color-scheme: light; supported-color-schemes: light; }
  body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  a { color:${BLUE}; }
  @media only screen and (max-width:620px) {
    .outer { padding:16px 12px !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:26px !important; line-height:32px !important; }
    .btn-table { width:100% !important; }
    .btn { display:block !important; padding:16px 20px !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${CANVAS};opacity:0;">${preheader}${'&#8199;&#65279;&#847; '.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}" style="background-color:${CANVAS};">
  <tr>
    <td align="center" class="outer" style="padding:40px 16px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td style="padding:0 4px 20px 4px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td valign="middle" style="padding-right:10px;"><img src="${LOGO_URL}" width="30" height="26" alt="Cursive" style="display:block;border:0;outline:none;width:30px;height:26px;"></td>
              <td valign="middle" style="font-family:${FONT};font-size:18px;line-height:24px;font-weight:700;color:${INK};letter-spacing:-0.02em;">Cursive</td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid ${BORDER};border-radius:14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="px" style="padding:40px 40px 0 40px;">
                  <p style="margin:0 0 12px 0;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${MUTED};letter-spacing:0.02em;">Free leads for ${safeDomain}</p>
                  <h1 class="h1" style="margin:0 0 16px 0;font-family:${FONT};font-size:30px;line-height:36px;font-weight:700;color:${INK};letter-spacing:-0.025em;">Your 25 leads are ready.</h1>
                  <p style="margin:0 0 28px 0;font-family:${FONT};font-size:16px;line-height:26px;color:#374151;">We matched 25 decision-makers to what ${safeDomain} sells. Open them now to see who they are and how to reach them.</p>
                </td>
              </tr>
              <tr>
                <td class="px" style="padding:0 40px 20px 40px;">
                  ${button(safeUrl, 'Open my 25 leads')}
                </td>
              </tr>
              <tr>
                <td class="px" style="padding:0 40px 32px 40px;">
                  <p style="margin:0;font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED};">This link signs you in, works once, and expires in ${LINK_EXPIRY}. If it has expired, request a new one at <a href="${escapeHtml(startUrl)}" target="_blank" rel="noopener noreferrer" style="color:${BLUE};text-decoration:none;">${startLabel}</a>.</p>
                </td>
              </tr>
              <tr>
                <td class="px" style="padding:0 40px 32px 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" bgcolor="${BORDER}" style="height:1px;background-color:${BORDER};font-size:0;line-height:0;">&nbsp;</td></tr></table>
                </td>
              </tr>${icpBlock}
              <tr>
                <td class="px" style="padding:0 40px 32px 40px;">
                  <p style="margin:0 0 10px 0;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${MUTED};">Every lead includes</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BORDER};border-radius:10px;border-collapse:separate;">
                    ${fieldRows()}
                  </table>
                </td>
              </tr>
              <tr>
                <td class="px" style="padding:20px 40px 32px 40px;border-top:1px solid ${BORDER};">
                  <p style="margin:0 0 6px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">Button not working? Paste this link into your browser:</p>
                  <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;word-break:break-all;"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:${BLUE};text-decoration:underline;">${safeUrl}</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 8px 0 8px;">
            <p style="margin:0 0 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">You are receiving this because ${safeTo} requested free leads for ${safeDomain} on meetcursive.com. If that was not you, ignore this email and nothing will happen.</p>
            <p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:${MUTED};text-decoration:underline;">${SUPPORT_EMAIL}</a> </p>
            <p style="margin:8px 0 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">Cursive &middot; meetcursive.com</p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`

  const text = [
    'Your 25 leads are ready.',
    '',
    `We matched 25 decision-makers to what ${domain} sells.`,
    ...(summary ? ['', `Who we looked for: ${summary}`] : []),
    '',
    `Every lead includes: ${FIELDS.join(', ')}.`,
    '',
    'Open my 25 leads:',
    loginUrl,
    '',
    `This link signs you in, works once, and expires in ${LINK_EXPIRY}. If it has expired, request a new one at ${startUrl}`,
    '',
    '--',
    `You are receiving this because ${to} requested free leads for ${domain} on meetcursive.com. If that was not you, ignore this email and nothing will happen.`,
    `Questions? ${SUPPORT_EMAIL}`,
    'Cursive, meetcursive.com',
  ].join('\n')

  return { subject, html, text }
}

export async function sendFreeLeadsReadyEmail(data: FreeLeadsReadyEmailData) {
  const { subject, html, text } = renderFreeLeadsReadyEmail(data)
  try {
    return await sendEmail({ to: data.to, from: 'Cursive <notifications@meetcursive.com>', subject, html, text })
  } catch (err) {
    safeError('[free-leads-ready] send failed:', err)
    return { success: false as const, error: err }
  }
}
