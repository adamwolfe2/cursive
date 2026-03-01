/**
 * First Leads Arrived Email Template
 *
 * Sent when a workspace receives its first batch of leads after onboarding.
 * Milestone moment — celebrate it and drive the user to act immediately.
 */

import { emailLayout, ctaButton, footnote, escapeHtml, BRAND, URLS } from './layout'

// ============================================
// TYPES
// ============================================

export interface FirstLeadsArrivedData {
  /** Recipient's first name */
  userName: string
  /** Total leads in the first batch */
  leadCount: number
  /** Their industry segment (e.g. "HVAC", "Roofing") */
  industry?: string | null
  /** Their location segment (e.g. "Florida") */
  location?: string | null
}

// ============================================
// TEMPLATE
// ============================================

export function firstLeadsArrivedEmail(data: FirstLeadsArrivedData): {
  html: string
  text: string
  subject: string
} {
  const { userName, leadCount, industry, location } = data

  const subject = `Your first ${leadCount} lead${leadCount === 1 ? '' : 's'} just arrived`

  const targeting =
    industry || location
      ? [industry, location].filter((v): v is string => Boolean(v)).map(escapeHtml).join(' · ')
      : null

  const content = `
    <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: ${BRAND.text}; line-height: 1.3;">
      Your leads are here 🎉
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.6;">
      Hi ${escapeHtml(userName)}, your first batch of verified leads just landed in your Cursive dashboard.
    </p>

    <!-- Lead count card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background: linear-gradient(135deg, ${BRAND.primary} 0%, #0056CC 100%); border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 28px; text-align: center;">
          <div style="font-size: 56px; font-weight: 800; color: #ffffff; line-height: 1; margin-bottom: 8px;">
            ${leadCount}
          </div>
          <div style="font-size: 14px; color: rgba(255,255,255,0.85); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em;">
            Verified Lead${leadCount === 1 ? '' : 's'} Delivered
          </div>
          ${targeting ? `<div style="margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.65);">${targeting}</div>` : ''}
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px; font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.6;">
      Each lead has been matched to your industry and location. You can view their contact info,
      enrich with phone numbers and LinkedIn, and export to CSV anytime.
    </p>

    <!-- What to do next -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background-color: ${BRAND.backgroundMuted}; border: 1px solid ${BRAND.border}; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: ${BRAND.text}; text-transform: uppercase; letter-spacing: 0.04em;">
            What to do next
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: ${BRAND.textSecondary};">
                <span style="color: ${BRAND.primary}; font-weight: 700; margin-right: 8px;">1.</span>
                View your leads and identify the best matches
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: ${BRAND.textSecondary};">
                <span style="color: ${BRAND.primary}; font-weight: 700; margin-right: 8px;">2.</span>
                Click <strong>Enrich</strong> to unlock phone numbers and LinkedIn profiles
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: ${BRAND.textSecondary};">
                <span style="color: ${BRAND.primary}; font-weight: 700; margin-right: 8px;">3.</span>
                Export to CSV or connect your CRM to start outreach
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('View My Leads', URLS.myLeads)}

    ${footnote(
      'New leads arrive every morning at 8am CT. Update your targeting preferences anytime at <a href="' +
        URLS.preferences +
        '" style="color: ' +
        BRAND.textMuted +
        '; text-decoration: underline;">Preferences</a>.'
    )}
  `

  const text = [
    `Your leads are here!`,
    '',
    `Hi ${userName},`,
    '',
    `Your first ${leadCount} verified lead${leadCount === 1 ? '' : 's'} just landed in your Cursive dashboard.`,
    targeting ? `Targeting: ${targeting}` : null,
    '',
    `What to do next:`,
    `1. View your leads and identify the best matches`,
    `2. Click Enrich to unlock phone numbers and LinkedIn profiles`,
    `3. Export to CSV or connect your CRM to start outreach`,
    '',
    `View your leads: ${URLS.myLeads}`,
    '',
    `New leads arrive every morning at 8am CT.`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  return {
    html: emailLayout({ preheader: subject, content }),
    text,
    subject,
  }
}
