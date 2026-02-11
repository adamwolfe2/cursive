/**
 * Service Request Confirmation Email Template
 *
 * Sent after a user submits a service request (DFY, AI Audit, etc.).
 * Confirms what was requested and sets expectations.
 */

import { emailLayout, ctaButton, footnote, escapeHtml, BRAND, URLS } from './layout'

// ============================================
// TYPES
// ============================================

export interface ServiceRequestConfirmationData {
  /** Recipient's first name */
  userName: string
  /** Name of the service requested, e.g. "AI Sales Audit", "DFY Lead Gen" */
  serviceName: string
  /** Brief description of what was requested (optional) */
  requestDetails?: string | null
  /** Request/reference ID for tracking (optional) */
  requestId?: string | null
}

// ============================================
// TEMPLATE
// ============================================

export function serviceRequestConfirmationEmail(
  data: ServiceRequestConfirmationData
): { html: string; text: string; subject: string } {
  const { userName, serviceName, requestDetails, requestId } = data

  const subject = `Request received: ${serviceName}`

  const content = `
    <h1 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: ${BRAND.text}; line-height: 1.3;">We got your request</h1>

    <p style="margin: 0 0 20px; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.5;">
      Hi ${escapeHtml(userName)}, thanks for submitting a request for <strong style="color: ${BRAND.text};">${escapeHtml(serviceName)}</strong>. We're on it.
    </p>

    <!-- Confirmation card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${BRAND.backgroundMuted}; border: 1px solid ${BRAND.border}; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.textMuted}; width: 100px; vertical-align: top;">Service</td>
              <td style="padding: 6px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 500;">${escapeHtml(serviceName)}</td>
            </tr>
            ${requestId ? `<tr>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.textMuted}; width: 100px; vertical-align: top;">Reference</td>
              <td style="padding: 6px 0; font-size: 14px; color: ${BRAND.textSecondary}; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace; font-size: 13px;">${escapeHtml(requestId)}</td>
            </tr>` : ''}
            ${requestDetails ? `<tr>
              <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.textMuted}; width: 100px; vertical-align: top;">Details</td>
              <td style="padding: 6px 0; font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.5;">${escapeHtml(requestDetails)}</td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>

    <!-- What to expect -->
    <h2 style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: ${BRAND.text};">What happens next</h2>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.5;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                <div style="width: 20px; height: 20px; border-radius: 50%; background-color: ${BRAND.primary}; color: #ffffff; font-size: 11px; font-weight: 600; text-align: center; line-height: 20px;">1</div>
              </td>
              <td style="font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.5; padding-bottom: 12px;">
                <strong style="color: ${BRAND.text};">We'll review your request</strong> and reach out within 24 hours to discuss next steps.
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                <div style="width: 20px; height: 20px; border-radius: 50%; background-color: ${BRAND.primary}; color: #ffffff; font-size: 11px; font-weight: 600; text-align: center; line-height: 20px;">2</div>
              </td>
              <td style="font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.5; padding-bottom: 12px;">
                <strong style="color: ${BRAND.text};">We'll schedule a kickoff call</strong> to align on goals, targeting, and timeline.
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                <div style="width: 20px; height: 20px; border-radius: 50%; background-color: ${BRAND.primary}; color: #ffffff; font-size: 11px; font-weight: 600; text-align: center; line-height: 20px;">3</div>
              </td>
              <td style="font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.5;">
                <strong style="color: ${BRAND.text};">Work begins.</strong> You'll get progress updates along the way.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px; font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.5;">
      Don't want to wait? Book a call now and we'll get started faster.
    </p>

    ${ctaButton('Book a Call', URLS.bookCall)}

    <p style="margin: 0 0 0; font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.5;">
      Questions in the meantime? Just reply to this email &mdash; it goes straight to Adam.
    </p>

    ${footnote('You can view your active services anytime at <a href="' + URLS.services + '" style="color: ' + BRAND.textMuted + '; text-decoration: underline;">Services</a>.')}
  `

  const text = [
    `Request received: ${serviceName}`,
    '',
    `Hi ${userName},`,
    '',
    `Thanks for submitting a request for ${serviceName}. We're on it.`,
    '',
    requestId ? `Reference: ${requestId}` : null,
    requestDetails ? `Details: ${requestDetails}` : null,
    '',
    `What happens next:`,
    `1. We'll review your request and reach out within 24 hours.`,
    `2. We'll schedule a kickoff call to align on goals.`,
    `3. Work begins, with progress updates along the way.`,
    '',
    `Don't want to wait? Book a call: ${URLS.bookCall}`,
    '',
    `Questions? Reply to this email -- it goes straight to Adam.`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  return { html: emailLayout({ preheader: `We got your request for ${serviceName}`, content }), text, subject }
}
