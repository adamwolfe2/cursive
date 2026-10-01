/**
 * Monday email for weekly-leads subscribers: "N new leads for <domain>", the three best fits with
 * why they fit, and one button into the workspace. Same visual shell as free-leads-profile.
 * Every name, title and reason is escaped. Never names the data provider.
 */
import { sendEmail } from '../resend-client'
import { escapeHtml } from './layout'
import { APP_URL } from '@/lib/config/urls'
import { safeError } from '@/lib/utils/log-sanitizer'

const LOGO_URL = 'https://leads.meetcursive.com/cursive-logo.png'
const INK = '#111827'
const MUTED = '#6b7280'
const BORDER = '#e5e7eb'
const BLUE = '#007AFF'
const CANVAS = '#f5f6f8'
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

export interface WeeklyTopLead {
  name: string
  title: string
  company: string
  why: string | null
}

interface WeeklyEmail {
  to: string
  domain: string
  count: number
  top: WeeklyTopLead[]
}

const unlinked = (domain: string) => escapeHtml(domain).replace(/\./g, '.&#8205;')

export function renderFreeLeadsWeeklyEmail({ domain, count, top }: WeeklyEmail) {
  const cta = `${APP_URL}/leads`
  const subject = `${count} new leads for ${domain}`
  const people = top
    .map(
      (l, i) => `
      <tr><td style="padding:14px 18px;${i ? `border-top:1px solid ${BORDER};` : ''}">
        <p style="margin:0;font-family:${FONT};font-size:15px;line-height:22px;color:${INK};">${escapeHtml(l.name)}</p>
        <p style="margin:0;font-family:${FONT};font-size:13px;line-height:19px;color:${MUTED};">${escapeHtml(l.title)}, ${escapeHtml(l.company)}</p>
        ${l.why ? `<p style="margin:6px 0 0 0;font-family:${FONT};font-size:13px;line-height:19px;color:${INK};"><span style="color:${BLUE};">Why them</span> ${escapeHtml(l.why)}</p>` : ''}
      </td></tr>`
    )
    .join('')
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
  <tr><td style="padding:0 4px 18px 4px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle" style="padding-right:10px;"><img src="${LOGO_URL}" width="28" height="24" alt="Cursive" style="display:block;border:0;width:28px;height:24px;"></td>
    <td valign="middle" style="font-family:${FONT};font-size:17px;font-weight:600;color:${INK};">Cursive</td></tr></table></td></tr>
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid ${BORDER};border-radius:14px;padding:36px;">
    <p style="margin:0 0 10px 0;font-family:${FONT};font-size:13px;line-height:18px;color:${MUTED};">This week for ${unlinked(domain)}</p>
    <h1 style="margin:0 0 22px 0;font-family:${FONT};font-size:26px;line-height:32px;font-weight:400;letter-spacing:-0.02em;color:${INK};">${count} new people who fit, ready in your workspace.</h1>
    ${people ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BORDER};border-radius:10px;border-collapse:separate;margin:0 0 26px 0;">${people}</table>` : ''}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="${BLUE}" style="background-color:${BLUE};border-radius:10px;">
      <a href="${escapeHtml(cta)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:16px;line-height:20px;color:#ffffff;text-decoration:none;border-radius:10px;">Open all ${count}</a>
    </td></tr></table>
    <p style="margin:16px 0 0 0;font-family:${FONT};font-size:14px;line-height:21px;color:${MUTED};">Each one has a checked work email. Same profile you approved; none of them are repeats.</p>
  </td></tr>
</table></td></tr></table></body></html>`
  const text = [
    `This week for ${domain}: ${count} new people who fit.`,
    '',
    ...top.map((l) => `${l.name}, ${l.title}, ${l.company}${l.why ? `\n  Why them: ${l.why}` : ''}`),
    '',
    `Open all ${count}: ${cta}`,
  ].join('\n')
  return { subject, html, text }
}

export async function sendFreeLeadsWeeklyEmail(data: WeeklyEmail) {
  const { subject, html, text } = renderFreeLeadsWeeklyEmail(data)
  try {
    return await sendEmail({ to: data.to, from: 'Cursive <notifications@meetcursive.com>', subject, html, text })
  } catch (err) {
    safeError('[free-leads-weekly] email send failed:', err)
    return { success: false as const, error: err }
  }
}
