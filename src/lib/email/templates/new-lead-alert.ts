/**
 * New Lead Alert Email Template
 *
 * Sent when a new lead is assigned to a user.
 * Short and punchy: key lead info + CTA to view.
 */

import { emailLayout, ctaButton, footnote, escapeHtml, BRAND, URLS } from './layout'

// ============================================
// TYPES
// ============================================

export type IntentLevel = 'hot' | 'warm' | 'cold'

export interface NewLeadAlertData {
  /** Recipient's first name */
  userName: string
  /** Lead's full name */
  leadName: string
  /** Company name (optional) */
  company?: string | null
  /** Job title (optional) */
  jobTitle?: string | null
  /** Industry (optional) */
  industry?: string | null
  /** Location, e.g. "Austin, TX" (optional) */
  location?: string | null
  /** Intent level for color-coded badge */
  intentLevel: IntentLevel
  /** Deliverability / intent score (0-100) */
  intentScore: number
  /** What the lead was matched on, e.g. "Industry: SaaS | Location: Texas" */
  matchedOn?: string | null
  /** Lead ID for deep-link */
  leadId: string
}

// ============================================
// HELPERS
// ============================================

function intentBadge(level: IntentLevel, score: number): string {
  const config: Record<IntentLevel, { label: string; color: string; bg: string }> = {
    hot: { label: 'Hot', color: BRAND.hot, bg: BRAND.errorBg },
    warm: { label: 'Warm', color: BRAND.warning, bg: BRAND.warningBg },
    cold: { label: 'Cold', color: BRAND.cold, bg: BRAND.borderLight },
  }
  const c = config[level]
  return `<span style="display: inline-block; padding: 2px 10px; font-size: 12px; font-weight: 600; color: ${c.color}; background-color: ${c.bg}; border-radius: 12px; letter-spacing: 0.025em;">${c.label} (${score})</span>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.textMuted}; width: 90px; vertical-align: top;">${label}</td>
    <td style="padding: 6px 0; font-size: 14px; color: ${BRAND.text};">${escapeHtml(value)}</td>
  </tr>`
}

// ============================================
// TEMPLATE
// ============================================

export function newLeadAlertEmail(data: NewLeadAlertData): { html: string; text: string; subject: string } {
  const {
    userName,
    leadName,
    company,
    jobTitle,
    industry,
    location,
    intentLevel,
    intentScore,
    matchedOn,
    leadId,
  } = data

  const safeName = escapeHtml(leadName)
  const viewUrl = `${URLS.myLeads}?leadId=${leadId}`

  // Build detail rows
  const rows: string[] = []
  if (jobTitle) rows.push(detailRow('Title', jobTitle))
  if (company) rows.push(detailRow('Company', company))
  if (industry) rows.push(detailRow('Industry', industry))
  if (location) rows.push(detailRow('Location', location))

  const content = `
    <p style="margin: 0 0 20px; font-size: 15px; color: ${BRAND.text}; line-height: 1.5;">
      Hi ${escapeHtml(userName)}, a new lead just matched your preferences.
    </p>

    <!-- Lead card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${BRAND.backgroundMuted}; border: 1px solid ${BRAND.border}; border-radius: 8px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px;">
          <!-- Name + badge row -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="font-size: 17px; font-weight: 600; color: ${BRAND.text}; padding-bottom: 12px;">
                ${safeName}
              </td>
              <td align="right" style="padding-bottom: 12px;">
                ${intentBadge(intentLevel, intentScore)}
              </td>
            </tr>
          </table>

          <!-- Detail rows -->
          ${rows.length > 0 ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${rows.join('')}</table>` : ''}

          ${matchedOn ? `<p style="margin: 12px 0 0; font-size: 12px; color: ${BRAND.textMuted}; border-top: 1px solid ${BRAND.border}; padding-top: 12px;">Matched on: ${escapeHtml(matchedOn)}</p>` : ''}
        </td>
      </tr>
    </table>

    ${ctaButton('View Lead', viewUrl)}

    ${footnote('This lead was automatically routed based on your targeting preferences. Update them anytime in <a href="' + URLS.preferences + '" style="color: ' + BRAND.textMuted + '; text-decoration: underline;">Preferences</a>.')}
  `

  const subject = `New lead: ${leadName}${company ? ` at ${company}` : ''}`

  const text = [
    `Hi ${userName},`,
    '',
    `A new lead just matched your preferences.`,
    '',
    `${leadName}`,
    jobTitle ? `Title: ${jobTitle}` : null,
    company ? `Company: ${company}` : null,
    industry ? `Industry: ${industry}` : null,
    location ? `Location: ${location}` : null,
    `Intent: ${intentLevel.charAt(0).toUpperCase() + intentLevel.slice(1)} (${intentScore})`,
    matchedOn ? `Matched on: ${matchedOn}` : null,
    '',
    `View lead: ${viewUrl}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  return {
    html: emailLayout({ preheader: subject, content }),
    text,
    subject,
  }
}
