/**
 * Funnel Admin Notification Email
 *
 * Sent to Adam when a buyer submits their ICP form. Contains the raw ICP
 * and a one-click CTA into /audience-builder pre-loaded with the buyer's
 * ICP as a natural-language prompt — so the live copilot returns TRUE
 * verified AL data (segments, taxonomies, titles, intent topics).
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { FunnelOrder } from '@/lib/funnel/order.service'
import { buildAudienceBuilderPrompt } from '@/lib/funnel/al-taxonomy'

const ADMIN_NOTIFICATION_EMAIL =
  process.env.FUNNEL_ADMIN_EMAIL ?? 'adam@meetcursive.com'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com'

const ADMIN_ORDERS_URL = `${SITE_URL}/admin/funnel-orders`

export async function sendFunnelAdminNotificationEmail(order: FunnelOrder) {
  const titlesArr = order.audience_titles ?? []
  const industriesArr = order.audience_industries ?? []
  const locationsArr = order.audience_locations ?? []
  const employeeRange = order.audience_employee_range || 'Any size'

  const titles = titlesArr.join(', ') || '—'
  const industries = industriesArr.join(', ') || '—'
  const locations = locationsArr.join(', ') || '—'

  // Natural-language prompt pre-loaded into /audience-builder via query
  // param. Lets Adam jump from email → copilot in one click.
  const prompt = buildAudienceBuilderPrompt({
    solution: order.audience_solution,
    icp_description: order.audience_icp_description,
    titles: titlesArr,
    industries: industriesArr,
    employee_range: order.audience_employee_range,
    locations: locationsArr,
  })
  const audienceBuilderUrl = `${SITE_URL}/audience-builder?prompt=${encodeURIComponent(prompt)}`

  const content = `
    <p class="email-text" style="font-size:15px;color:#111827;">
      <strong>New funnel order needs audience fulfillment.</strong>
      ${escapeForEmail(order.customer_name ?? order.customer_email)}
      just submitted their ICP for the
      <strong>${escapeForEmail(order.offer_slug)}</strong> plan.
    </p>

    <!-- Primary CTA -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:18px 20px;margin:0 0 20px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#111827;">
        Build this audience with the live copilot
      </p>
      <p style="margin:0 0 14px;font-size:13px;color:#374151;">
        Opens the audience builder with the buyer&rsquo;s ICP pre-filled.
        The copilot returns verified AL segments, taxonomies, and job
        titles &mdash; not regex guesses.
      </p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0;">
        <tr>
          <td style="background-color:#007AFF;border-radius:8px;">
            <a href="${audienceBuilderUrl}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
              Build in Audience Builder &rarr;
            </a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Raw buyer input -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280;">
        Raw buyer input
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;color:#111827;">
        <tr><td style="padding:4px 0;width:140px;color:#6b7280;">What they sell</td><td style="padding:4px 0;">${escapeForEmail(order.audience_solution ?? '—')}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;vertical-align:top;">ICP description</td><td style="padding:4px 0;">${escapeForEmail(order.audience_icp_description ?? '—')}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;vertical-align:top;">Target titles</td><td style="padding:4px 0;">${escapeForEmail(titles)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Industries (raw)</td><td style="padding:4px 0;">${escapeForEmail(industries)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Company size (raw)</td><td style="padding:4px 0;">${escapeForEmail(employeeRange)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Locations (raw)</td><td style="padding:4px 0;">${escapeForEmail(locations)}</td></tr>
      </table>
    </div>

    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#78350f;">
        <strong>Workflow:</strong>
        Build in copilot &rarr; copilot returns verified segments &rarr;
        export to Google Sheet &rarr; paste the Sheet URL into the admin
        page below to fire the delivery email automatically.
      </p>
    </div>

    <p style="font-size:13px;color:#374151;margin:0 0 8px;">
      <a href="${ADMIN_ORDERS_URL}" target="_blank" rel="noopener noreferrer" style="color:#007AFF;">
        Open admin orders page &rarr;
      </a>
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <p style="margin:0;font-size:12px;color:#6b7280;">
      Order ID: <code style="background:#f3f4f6;padding:2px 5px;border-radius:3px;">${escapeForEmail(order.id)}</code><br>
      Buyer email: ${escapeForEmail(order.customer_email)}<br>
      Stripe session: <code style="background:#f3f4f6;padding:2px 5px;border-radius:3px;font-size:11px;">${escapeForEmail(order.stripe_session_id)}</code>
    </p>
  `

  try {
    return await sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      from: 'Cursive Funnel <notifications@meetcursive.com>',
      subject: `[Funnel] New audience to build — ${order.customer_name ?? order.customer_email} (${order.offer_slug})`,
      html: createEmailTemplate({
        preheader: `Build with the live Cursive copilot — ICP pre-filled.`,
        title: 'New funnel order needs audience fulfillment',
        content,
      }),
      text: [
        `New funnel order needs audience fulfillment.`,
        ``,
        `Buyer: ${order.customer_name ?? order.customer_email} (${order.customer_email})`,
        `Plan: ${order.offer_slug}`,
        `Order ID: ${order.id}`,
        ``,
        `=== BUILD WITH THE LIVE COPILOT ===`,
        `${audienceBuilderUrl}`,
        ``,
        `=== RAW BUYER INPUT ===`,
        `What they sell: ${order.audience_solution ?? '—'}`,
        `ICP description: ${order.audience_icp_description ?? '—'}`,
        `Target titles: ${titles}`,
        `Industries: ${industries}`,
        `Company size: ${employeeRange}`,
        `Locations: ${locations}`,
        ``,
        `Workflow:`,
        `1. Build in copilot (link above)`,
        `2. Export verified segments to Google Sheet`,
        `3. Paste Sheet URL: ${ADMIN_ORDERS_URL}`,
        ``,
        `Stripe session: ${order.stripe_session_id}`,
      ].join('\n'),
    })
  } catch (err) {
    safeError('[funnel-admin-notification] send failed:', err)
    return { success: false, error: err }
  }
}

function escapeForEmail(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
