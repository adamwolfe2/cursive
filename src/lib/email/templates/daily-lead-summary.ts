/**
 * Daily Lead Summary Email Template
 *
 * Sent as a daily digest of new leads assigned to the user.
 * Shows count, top 3 leads, credit balance, and CTA.
 */

import { emailLayout, ctaButton, divider, footnote, escapeHtml, BRAND, URLS } from './layout'
import type { IntentLevel } from './new-lead-alert'

// ============================================
// TYPES
// ============================================

export interface LeadSummaryItem {
  name: string
  company?: string | null
  intentLevel: IntentLevel
}

export interface DailyLeadSummaryData {
  /** Recipient's first name */
  userName: string
  /** Total new leads today */
  newLeadCount: number
  /** Top 3 leads to highlight */
  topLeads: LeadSummaryItem[]
  /** Current credit balance */
  creditBalance: number
  /** Date string, e.g. "February 11, 2026" */
  date: string
}

// ============================================
// HELPERS
// ============================================

function intentDot(level: IntentLevel): string {
  const colors: Record<IntentLevel, string> = {
    hot: BRAND.hot,
    warm: BRAND.warning,
    cold: BRAND.cold,
  }
  return `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${colors[level]}; margin-right: 8px; vertical-align: middle;"></span>`
}

function leadRow(lead: LeadSummaryItem): string {
  const name = escapeHtml(lead.name)
  const company = lead.company ? escapeHtml(lead.company) : null
  return `<tr>
    <td style="padding: 10px 0; border-bottom: 1px solid ${BRAND.borderLight};">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="font-size: 14px; color: ${BRAND.text}; line-height: 1.4;">
            ${intentDot(lead.intentLevel)}
            <strong>${name}</strong>${company ? `<span style="color: ${BRAND.textSecondary};"> at ${company}</span>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

function statBox(value: string, label: string, color: string): string {
  return `<td style="padding: 16px; text-align: center; width: 50%;">
    <div style="font-size: 28px; font-weight: 700; color: ${color}; line-height: 1.2;">${value}</div>
    <div style="font-size: 12px; color: ${BRAND.textMuted}; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">${label}</div>
  </td>`
}

// ============================================
// TEMPLATE
// ============================================

export function dailyLeadSummaryEmail(data: DailyLeadSummaryData): { html: string; text: string; subject: string } {
  const { userName, newLeadCount, topLeads, creditBalance, date } = data

  const subject = `${newLeadCount} new lead${newLeadCount === 1 ? '' : 's'} today`

  const leadRows = topLeads.slice(0, 3).map(leadRow).join('')
  const remainingCount = newLeadCount - Math.min(topLeads.length, 3)

  const content = `
    <p style="margin: 0 0 4px; font-size: 12px; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(date)}</p>
    <h1 style="margin: 0 0 24px; font-size: 22px; font-weight: 600; color: ${BRAND.text}; line-height: 1.3;">Your Daily Lead Digest</h1>

    <!-- Stats -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${BRAND.backgroundMuted}; border: 1px solid ${BRAND.border}; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        ${statBox(String(newLeadCount), 'New Leads', BRAND.primary)}
        <td style="width: 1px; background-color: ${BRAND.border};"></td>
        ${statBox(String(creditBalance), 'Credits Left', creditBalance <= 20 ? BRAND.warning : BRAND.textSecondary)}
      </tr>
    </table>

    ${newLeadCount > 0 ? `
    <!-- Top leads -->
    <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 0.05em;">Top Leads</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${leadRows}
    </table>
    ${remainingCount > 0 ? `<p style="margin: 12px 0 0; font-size: 13px; color: ${BRAND.textMuted};">+ ${remainingCount} more lead${remainingCount === 1 ? '' : 's'}</p>` : ''}
    ` : `
    <p style="margin: 0 0 16px; font-size: 14px; color: ${BRAND.textSecondary};">No new leads today. We'll keep looking based on your targeting preferences.</p>
    `}

    ${ctaButton('View All Leads', URLS.myLeads)}

    ${creditBalance <= 20 ? `
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${BRAND.warningBg}; border: 1px solid ${BRAND.warningBorder}; border-radius: 6px;">
      <tr>
        <td style="padding: 12px 16px; font-size: 13px; color: ${BRAND.text}; line-height: 1.5;">
          <strong>Credits running low.</strong> You have ${creditBalance} credit${creditBalance === 1 ? '' : 's'} remaining. <a href="${URLS.billing}" style="color: ${BRAND.primary}; text-decoration: underline; font-weight: 500;">Buy more credits</a>
        </td>
      </tr>
    </table>
    ` : ''}

    ${footnote('You receive this digest daily. Adjust frequency in <a href="' + URLS.emailPreferences + '" style="color: ' + BRAND.textMuted + '; text-decoration: underline;">email preferences</a>.')}
  `

  const text = [
    `Daily Lead Digest - ${date}`,
    '',
    `Hi ${userName},`,
    '',
    `New leads today: ${newLeadCount}`,
    `Credits remaining: ${creditBalance}`,
    '',
    ...topLeads.slice(0, 3).map(
      (l) => `- ${l.name}${l.company ? ` at ${l.company}` : ''} (${l.intentLevel})`
    ),
    remainingCount > 0 ? `+ ${remainingCount} more` : null,
    '',
    `View all leads: ${URLS.myLeads}`,
    creditBalance <= 20 ? `\nCredits running low. Buy more: ${URLS.billing}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  return { html: emailLayout({ preheader: subject, content }), text, subject }
}
