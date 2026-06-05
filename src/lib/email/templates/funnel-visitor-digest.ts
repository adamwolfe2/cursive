/**
 * Funnel Weekly Visitor Digest
 *
 * Sent every Friday morning to active funnel buyers whose pixel has fired
 * at least once. Summarizes the last 7 days of identified visitors:
 *   - total count
 *   - top 3 companies by visit count
 *   - top 3 most-recent named visitors
 * Always ends in a portal CTA to drive logins.
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

export interface DigestVisitor {
  full_name: string | null
  email: string | null
  company_name: string | null
  company_domain: string | null
  job_title: string | null
}

export interface DigestCompany {
  name: string
  visits: number
}

export async function sendFunnelVisitorDigestEmail(data: {
  to: string
  customerName: string | null
  weekTotal: number
  topCompanies: DigestCompany[]
  recentVisitors: DigestVisitor[]
  portalUrl: string
}) {
  const firstName = (data.customerName ?? '').trim().split(/\s+/)[0] || 'there'

  // Empty-week variant
  if (data.weekTotal === 0) {
    return sendEmptyWeekDigest({ ...data, firstName })
  }

  const companyList =
    data.topCompanies.length > 0
      ? data.topCompanies
          .map(
            (c) => `
        <tr>
          <td style="padding:5px 0;font-size:14px;color:#111827;">${escapeForEmail(c.name)}</td>
          <td style="padding:5px 0;font-size:14px;text-align:right;color:#6b7280;">${c.visits} visit${c.visits === 1 ? '' : 's'}</td>
        </tr>`
          )
          .join('')
      : `<tr><td style="padding:5px 0;font-size:13px;color:#9ca3af;" colspan="2">No named companies this week.</td></tr>`

  const recentList = data.recentVisitors
    .slice(0, 5)
    .map((v) => {
      const name = v.full_name ?? 'Anonymous visitor'
      const role = [v.job_title, v.company_name].filter(Boolean).join(' at ')
      return `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#111827;">
          <strong>${escapeForEmail(name)}</strong>${role ? ` &mdash; ${escapeForEmail(role)}` : ''}
          ${v.email ? `<br><span style="font-size:11px;color:#6b7280;">${escapeForEmail(v.email)}</span>` : ''}
        </td>
      </tr>`
    })
    .join('')

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hi ${escapeForEmail(firstName)} — your weekly visitor recap.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:18px 22px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#15803d;">
        Last 7 days
      </p>
      <p style="margin:0;font-size:30px;font-weight:700;color:#111827;">
        ${data.weekTotal} identified visitor${data.weekTotal === 1 ? '' : 's'}
      </p>
    </div>

    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;">
      Top companies
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border-collapse:collapse;">
      ${companyList}
    </table>

    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;">
      Recent visitors
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 28px;border-collapse:collapse;">
      ${recentList}
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${data.portalUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            View Full Visitor List &rarr;
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <div class="email-signature">
      <p style="margin:0 0 4px;">Adam Wolfe<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
    </div>
  `

  try {
    return await sendEmail({
      to: data.to,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject: `${data.weekTotal} visitor${data.weekTotal === 1 ? '' : 's'} identified this week`,
      html: createEmailTemplate({
        preheader: `Top companies + recent visitors from your pixel.`,
        title: 'Your weekly visitor recap',
        content,
      }),
      text: [
        `Hi ${firstName} — your weekly visitor recap.`,
        ``,
        `Last 7 days: ${data.weekTotal} identified visitor${data.weekTotal === 1 ? '' : 's'}`,
        ``,
        `Top companies:`,
        ...data.topCompanies.map((c) => `  - ${c.name} (${c.visits} visit${c.visits === 1 ? '' : 's'})`),
        ``,
        `Recent visitors:`,
        ...data.recentVisitors
          .slice(0, 5)
          .map((v) => {
            const role = [v.job_title, v.company_name].filter(Boolean).join(' at ')
            return `  - ${v.full_name ?? 'Anonymous'}${role ? ` — ${role}` : ''}${v.email ? ` <${v.email}>` : ''}`
          }),
        ``,
        `View full list: ${data.portalUrl}`,
        ``,
        `— Adam Wolfe`,
        `Cursive · https://meetcursive.com`,
      ].join('\n'),
    })
  } catch (err) {
    safeError('[funnel-visitor-digest] send failed:', err)
    return { success: false, error: err }
  }
}

async function sendEmptyWeekDigest(data: {
  to: string
  firstName: string
  portalUrl: string
}) {
  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hi ${escapeForEmail(data.firstName)} — quiet week on the pixel.
    </p>
    <p class="email-text">
      No identified visitors yet in the last 7 days. This usually means
      either traffic is low (try driving some ads or social to confirm the
      pixel&rsquo;s firing) or the snippet hasn&rsquo;t fully propagated.
    </p>
    <p class="email-text">
      Your portal has a <strong>&ldquo;Test my install&rdquo;</strong>
      button that confirms the snippet is live on your domain &mdash;
      worth a click.
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${data.portalUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Test My Install &rarr;
          </a>
        </td>
      </tr>
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <div class="email-signature">
      <p style="margin:0 0 4px;">Adam Wolfe<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
    </div>
  `
  try {
    return await sendEmail({
      to: data.to,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject: 'Quiet week — let\'s make sure your pixel is firing',
      html: createEmailTemplate({
        preheader: 'No identified visitors this week — quick check.',
        title: 'Quiet week — let\'s test your install',
        content,
      }),
      text: [
        `Hi ${data.firstName} — quiet week on the pixel.`,
        ``,
        `No identified visitors yet in the last 7 days. Worth running the "Test my install" check in your portal:`,
        data.portalUrl,
        ``,
        `— Adam Wolfe`,
      ].join('\n'),
    })
  } catch (err) {
    safeError('[funnel-visitor-digest empty] send failed:', err)
    return { success: false, error: err }
  }
}

function escapeForEmail(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
