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

const sizeBandLabel = (v: string) => (v === '10001+' ? '10,001+\u00a0people' : `${v.replace(' to ', '-')}\u00a0people`)
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
  const list = (v: string[]) => v.join(' · ')
  const where = [...icp.cities, ...icp.states, ...icp.countries]
  return (
    [
      ['Titles', list(icp.job_titles)],
      ['Industries', list(icp.industries)],
      ['Seniority', list(icp.seniority)],
      ['Company size', icp.company_size.map(sizeBandLabel).join(' · ')],
      ['Where', list(where)],
    ] as Array<[string, string]>
  ).filter(([, v]) => v)
}

/** Stops mail apps from turning "acme.com" into a link (a zero-width joiner after each dot). */
const unlinked = (domain: string) => escapeHtml(domain).replace(/\./g, '.&#8205;')

export function renderFreeLeadsProfileEmail({ to, domain, icp }: ProfileEmail) {
  const cta = `${APP_URL}/start?site=${encodeURIComponent(domain)}`
  const subject = `Who buys from ${domain}`
  const preheader = `The buyers we found on ${escapeHtml(domain)}, and 25 of them free when you want them.`
  // Stacked label-over-value rows: two columns squeezed values to one word per line on phones.
  const fields = rows(icp)
    .map(
      ([k, v], i) => `
      <tr>
        <td style="padding:14px 18px;${i ? `border-top:1px solid ${BORDER};` : ''}">
          <p style="margin:0 0 4px 0;font-family:${FONT};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.02em;color:${MUTED};">${k}</p>
          <p style="margin:0;font-family:${FONT};font-size:15px;line-height:22px;color:${INK};">${escapeHtml(v)}</p>
        </td>
      </tr>`
    )
    .join('')
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(subject)}</title>
<style>
  :root { color-scheme: light; supported-color-schemes: light; }
  body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; }
  @media only screen and (max-width:620px) {
    .outer { padding:16px 10px !important; }
    .card { padding:28px 20px !important; }
    .h1 { font-size:21px !important; line-height:28px !important; }
    .btn-table { width:100% !important; }
    .btn { display:block !important; text-align:center !important; padding:16px 20px !important; }
  }
</style></head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${CANVAS};opacity:0;">${preheader}${'&#8199;&#65279;&#847; '.repeat(30)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}"><tr><td align="center" class="outer" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
  <tr><td style="padding:0 4px 18px 4px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle" style="padding-right:10px;"><img src="${LOGO_URL}" width="28" height="24" alt="Cursive" style="display:block;border:0;width:28px;height:24px;"></td>
    <td valign="middle" style="font-family:${FONT};font-size:17px;font-weight:700;color:${INK};">Cursive</td></tr></table></td></tr>
  <tr><td class="card" bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid ${BORDER};border-radius:14px;padding:36px 36px 32px 36px;">
    <p style="margin:0 0 10px 0;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${MUTED};">Ideal customer profile for ${unlinked(domain)}</p>
    <h1 class="h1" style="margin:0 0 22px 0;font-family:${FONT};font-size:24px;line-height:31px;font-weight:700;letter-spacing:-0.02em;color:${INK};">${escapeHtml(icp.summary)}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BORDER};border-radius:10px;border-collapse:separate;margin:0 0 26px 0;">${fields}</table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-table"><tr><td align="center" bgcolor="${BLUE}" style="background-color:${BLUE};border-radius:10px;">
      <a href="${escapeHtml(cta)}" target="_blank" rel="noopener noreferrer" class="btn" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Get 25 leads like this, free</a>
    </td></tr></table>
    <p style="margin:16px 0 0 0;font-family:${FONT};font-size:14px;line-height:21px;color:${MUTED};">Use a work email on the next step and we send the 25 to your inbox.</p>
  </td></tr>
  <tr><td style="padding:20px 8px 0 8px;"><p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">You are receiving this because ${escapeHtml(to)} asked for this profile on meetcursive.com. Nothing else will be sent unless you ask for your leads.</p></td></tr>
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
