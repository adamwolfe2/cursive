/**
 * "Your ideal customer profile" email (/start "Email me this profile"): the ICP the scan built,
 * plus one button back to /start?site=<domain> (the scan replays from cache, then 25 leads).
 * Same premium shell as free-leads-ready. Every model- or user-supplied string is escaped.
 */
import { sendEmail } from '../resend-client'
import { escapeHtml } from './layout'
import { APP_URL } from '@/lib/config/urls'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { Icp } from '@/lib/free-leads/contract'

const sizeBandLabel = (v: string) => (v === '10001+' ? '10,001+ people' : `${v.replace(' to ', '-')} people`)
const LOGO_URL = 'https://leads.meetcursive.com/cursive-logo.png'
const INK = '#1d2025'
const MUTED = '#6b7280'
const BORDER = '#e5e7eb'
const BLUE = '#007AFF'
const CANVAS = '#f5f6f8'
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

interface ProfileEmail {
  to: string
  domain: string
  icp: Icp
}

function rows(icp: Icp): Array<[string, string]> {
  const list = (v: string[]) => v.join(', ')
  const where = [...icp.cities, ...icp.states, ...icp.countries]
  return (
    [
      ['Titles', list(icp.job_titles)],
      ['Industries', list(icp.industries)],
      ['Seniority', list(icp.seniority)],
      ['Company size', icp.company_size.map(sizeBandLabel).join(', ')],
      ['Where', list(where)],
    ] as Array<[string, string]>
  ).filter(([, v]) => v)
}

export function renderFreeLeadsProfileEmail({ to, domain, icp }: ProfileEmail) {
  const safeDomain = escapeHtml(domain)
  const cta = `${APP_URL}/start?site=${encodeURIComponent(domain)}`
  const subject = `Who buys from ${domain}`
  const table = rows(icp)
    .map(
      ([k, v], i) => `
      <tr>
        <td valign="top" width="120" style="padding:10px 12px 10px 16px;font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;color:${MUTED};${i ? `border-top:1px solid ${BORDER};` : ''}">${k}</td>
        <td valign="top" style="padding:10px 16px 10px 0;font-family:${FONT};font-size:14px;line-height:20px;color:${INK};${i ? `border-top:1px solid ${BORDER};` : ''}">${escapeHtml(v)}</td>
      </tr>`
    )
    .join('')
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td style="padding:0 4px 20px 4px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle" style="padding-right:10px;"><img src="${LOGO_URL}" width="30" height="26" alt="Cursive" style="display:block;border:0;width:30px;height:26px;"></td>
    <td valign="middle" style="font-family:${FONT};font-size:18px;font-weight:700;color:${INK};">Cursive</td></tr></table></td></tr>
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid ${BORDER};border-radius:14px;padding:40px;">
    <p style="margin:0 0 12px 0;font-family:${FONT};font-size:13px;font-weight:600;color:${MUTED};">Ideal customer profile for ${safeDomain}</p>
    <h1 style="margin:0 0 16px 0;font-family:${FONT};font-size:26px;line-height:32px;font-weight:700;color:${INK};">${escapeHtml(icp.summary)}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BORDER};border-radius:10px;border-collapse:separate;margin:8px 0 28px 0;">${table}</table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="${BLUE}" style="background-color:${BLUE};border-radius:10px;">
      <a href="${escapeHtml(cta)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 32px;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Get 25 leads like this, free</a>
    </td></tr></table>
    <p style="margin:20px 0 0 0;font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED};">Use a work email on the next step and we send the 25 to your inbox.</p>
  </td></tr>
  <tr><td style="padding:24px 8px 0 8px;"><p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">You are receiving this because ${escapeHtml(to)} asked for this profile on meetcursive.com. Nothing else will be sent unless you ask for your leads.</p></td></tr>
</table></td></tr></table></body></html>`
  const text = [
    `Ideal customer profile for ${domain}`,
    '',
    icp.summary,
    '',
    ...rows(icp).map(([k, v]) => `${k}: ${v}`),
    '',
    `Get 25 leads like this, free: ${cta}`,
  ].join('\n')
  return { subject, html, text }
}

export async function sendFreeLeadsProfileEmail(data: ProfileEmail) {
  const { subject, html, text } = renderFreeLeadsProfileEmail(data)
  try {
    return await sendEmail({ to: data.to, from: 'Cursive <notifications@meetcursive.com>', subject, html, text })
  } catch (err) {
    safeError('[free-leads-profile] send failed:', err)
    return { success: false as const, error: err }
  }
}
