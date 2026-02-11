/**
 * Email Templates Index
 *
 * Notification email templates for the Cursive platform.
 * Each template returns { html, text, subject } for use with Resend.
 */

// Shared layout & utilities
export { emailLayout, ctaButton, secondaryButton, divider, footnote, escapeHtml, BRAND, URLS } from './layout'

// Templates
export { newLeadAlertEmail, type NewLeadAlertData, type IntentLevel } from './new-lead-alert'
export { dailyLeadSummaryEmail, type DailyLeadSummaryData, type LeadSummaryItem } from './daily-lead-summary'
export { lowCreditsWarningEmail, type LowCreditsWarningData } from './low-credits-warning'
export { serviceRequestConfirmationEmail, type ServiceRequestConfirmationData } from './service-request-confirmation'
