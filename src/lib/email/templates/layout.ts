/**
 * Shared Email Layout
 *
 * Consistent wrapper for all Cursive notification emails.
 * Clean, minimal design inspired by Linear/Stripe transactional emails.
 *
 * Brand color: #007AFF (Cursive Blue)
 * From: notifications@meetcursive.com
 */

// ============================================
// CONSTANTS
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
const LOGO_URL = `${BASE_URL}/cursive-logo.png`
const CURRENT_YEAR = new Date().getFullYear()

export const BRAND = {
  primary: '#007AFF',
  primaryDark: '#0056CC',
  text: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  background: '#ffffff',
  backgroundMuted: '#f9fafb',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  success: '#22c55e',
  successBg: '#f0fdf4',
  successBorder: '#86efac',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  error: '#ef4444',
  errorBg: '#fef2f2',
  errorBorder: '#fca5a5',
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#6b7280',
} as const

export const URLS = {
  base: BASE_URL,
  myLeads: `${BASE_URL}/my-leads`,
  billing: `${BASE_URL}/billing`,
  preferences: `${BASE_URL}/preferences`,
  dashboard: `${BASE_URL}/dashboard`,
  services: `${BASE_URL}/services`,
  bookCall: 'https://cal.com/gotdarrenhill/30min',
  emailPreferences: `${BASE_URL}/settings/notifications`,
} as const

// ============================================
// HTML ESCAPE
// ============================================

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ============================================
// LAYOUT
// ============================================

interface EmailLayoutOptions {
  preheader?: string
  content: string
}

/**
 * Wrap email content in the standard Cursive layout.
 *
 * Includes:
 * - Cursive logo at top
 * - Responsive container (max 600px)
 * - Footer with email preferences link and company info
 * - Preheader text for inbox preview
 */
export function emailLayout({ preheader, content }: EmailLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Cursive</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }

    /* Base */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${BRAND.text};
      background-color: ${BRAND.backgroundMuted};
    }

    /* Responsive */
    @media only screen and (max-width: 640px) {
      .email-container { width: 100% !important; padding: 0 16px !important; }
      .email-body { padding: 24px 20px !important; }
      .email-header { padding: 20px 20px 16px !important; }
      .email-footer { padding: 20px !important; }
      .cta-button { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.backgroundMuted};">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${escapeHtml(preheader)}</div>` : ''}

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${BRAND.backgroundMuted};">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Email container -->
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: ${BRAND.background}; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td class="email-header" style="padding: 32px 40px 24px; border-bottom: 1px solid ${BRAND.border};">
              <img src="${LOGO_URL}" alt="Cursive" width="120" height="28" style="display: block;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding: 32px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding: 24px 40px; border-top: 1px solid ${BRAND.border}; background-color: ${BRAND.backgroundMuted}; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: ${BRAND.textLight}; text-align: center; line-height: 1.5;">
                &copy; ${CURRENT_YEAR} Cursive. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: ${BRAND.textLight}; text-align: center; line-height: 1.5;">
                <a href="${URLS.emailPreferences}" style="color: ${BRAND.textMuted}; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:adam@meetcursive.com" style="color: ${BRAND.textMuted}; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

// ============================================
// SHARED COMPONENTS (HTML string builders)
// ============================================

/** Primary CTA button */
export function ctaButton(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin: 24px 0;">
  <tr>
    <td class="cta-button" style="background-color: ${BRAND.primary}; border-radius: 6px;">
      <a href="${href}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">${escapeHtml(text)}</a>
    </td>
  </tr>
</table>`
}

/** Secondary/ghost button */
export function secondaryButton(text: string, href: string): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 24px; font-size: 13px; font-weight: 500; color: ${BRAND.primary}; text-decoration: none; border: 1px solid ${BRAND.border}; border-radius: 6px;">${escapeHtml(text)}</a>`
}

/** Horizontal divider */
export function divider(): string {
  return `<hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 24px 0;" />`
}

/** Muted footnote text */
export function footnote(text: string): string {
  return `<p style="margin: 16px 0 0; font-size: 12px; color: ${BRAND.textLight}; line-height: 1.5;">${text}</p>`
}
