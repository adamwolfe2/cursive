/**
 * Funnel Admin Notification Email
 *
 * Sent to Adam when a buyer submits their ICP form. Contains the full ICP,
 * customer identity, and direct links to: the admin order page (to mark
 * delivered) + Audience Labs (to start building the audience). Triggered
 * from /api/funnel/[token]/audience.
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { FunnelOrder } from '@/lib/funnel/order.service'

const ADMIN_NOTIFICATION_EMAIL =
  process.env.FUNNEL_ADMIN_EMAIL ?? 'adam@meetcursive.com'

const ADMIN_ORDERS_URL = `${
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com'
}/admin/funnel-orders`

const AUDIENCELAB_URL = 'https://audiencelab.io'

export async function sendFunnelAdminNotificationEmail(order: FunnelOrder) {
  const titles = (order.audience_titles ?? []).join(', ') || '—'
  const industries = (order.audience_industries ?? []).join(', ') || '—'
  const locations = (order.audience_locations ?? []).join(', ') || '—'
  const employeeRange = order.audience_employee_range || 'Any size'

  const content = `
    <p class="email-text" style="font-size:15px;color:#111827;">
      <strong>New funnel order needs audience fulfillment.</strong>
      ${escapeForEmail(order.customer_name ?? order.customer_email)}
      just submitted their ICP for the
      <strong>${escapeForEmail(order.offer_slug)}</strong> plan.
    </p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280;">
        Submitted ICP
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;color:#111827;">
        <tr><td style="padding:4px 0;width:120px;color:#6b7280;">What they sell</td><td style="padding:4px 0;">${escapeForEmail(order.audience_solution ?? '—')}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;vertical-align:top;">ICP description</td><td style="padding:4px 0;">${escapeForEmail(order.audience_icp_description ?? '—')}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;vertical-align:top;">Target titles</td><td style="padding:4px 0;">${escapeForEmail(titles)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Industries</td><td style="padding:4px 0;">${escapeForEmail(industries)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Company size</td><td style="padding:4px 0;">${escapeForEmail(employeeRange)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Locations</td><td style="padding:4px 0;">${escapeForEmail(locations)}</td></tr>
      </table>
    </div>

    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#78350f;">
        <strong>Workflow:</strong>
        Build the audience in Audience Labs → export to Google Sheet → paste
        the Sheet URL into the admin page below. That fires the
        delivery email to the buyer automatically.
      </p>
    </div>

    <!-- Primary CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 12px;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${ADMIN_ORDERS_URL}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Manage in Admin →
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#374151;margin:0 0 8px;">
      <a href="${AUDIENCELAB_URL}" target="_blank" rel="noopener noreferrer" style="color:#007AFF;">
        Open Audience Labs →
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
        preheader: `New ICP submitted — build the audience in Audience Labs and mark delivered in admin.`,
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
        `=== ICP ===`,
        `What they sell: ${order.audience_solution ?? '—'}`,
        `ICP description: ${order.audience_icp_description ?? '—'}`,
        `Target titles: ${titles}`,
        `Industries: ${industries}`,
        `Company size: ${employeeRange}`,
        `Locations: ${locations}`,
        ``,
        `Workflow:`,
        `1. Build the audience in Audience Labs: ${AUDIENCELAB_URL}`,
        `2. Export to Google Sheet`,
        `3. Paste the Sheet URL into the admin page: ${ADMIN_ORDERS_URL}`,
        `   (that fires the buyer's delivery email automatically)`,
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
