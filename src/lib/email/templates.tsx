/**
 * Email Templates
 * OpenInfo Platform
 *
 * React-based email templates for transactional emails.
 */

import * as React from 'react'

// ============================================
// EMAIL LAYOUT
// ============================================

interface EmailLayoutProps {
  children: React.ReactNode
  preview?: string
}

export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        {preview && <title>{preview}</title>}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background-color: #f9fafb;
              }
              a {
                color: #2563eb;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
            `,
          }}
        />
      </head>
      <body>
        {preview && (
          <div
            style={{
              display: 'none',
              maxHeight: 0,
              overflow: 'hidden',
            }}
          >
            {preview}
          </div>
        )}
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ backgroundColor: '#f9fafb', padding: '40px 20px' }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{
                    maxWidth: '600px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td
                        style={{
                          padding: '32px 40px 24px',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <img
                          src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
                          alt="OpenInfo"
                          width="140"
                          height="32"
                          style={{ display: 'block' }}
                        />
                      </td>
                    </tr>

                    {/* Content */}
                    <tr>
                      <td style={{ padding: '32px 40px' }}>{children}</td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td
                        style={{
                          padding: '24px 40px',
                          borderTop: '1px solid #e5e7eb',
                          backgroundColor: '#f9fafb',
                          borderRadius: '0 0 8px 8px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            textAlign: 'center',
                            margin: 0,
                          }}
                        >
                          &copy; {new Date().getFullYear()} OpenInfo. All rights reserved.
                          <br />
                          <a
                            href={`${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications`}
                            style={{ color: '#6b7280' }}
                          >
                            Manage email preferences
                          </a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

// ============================================
// EMAIL COMPONENTS
// ============================================

interface HeadingProps {
  children: React.ReactNode
}

export function Heading({ children }: HeadingProps) {
  return (
    <h1
      style={{
        fontSize: '24px',
        fontWeight: 600,
        color: '#111827',
        margin: '0 0 16px',
      }}
    >
      {children}
    </h1>
  )
}

interface TextProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Text({ children, style }: TextProps) {
  return (
    <p
      style={{
        fontSize: '14px',
        color: '#4b5563',
        margin: '0 0 16px',
        ...style,
      }}
    >
      {children}
    </p>
  )
}

interface ButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    borderRadius: '6px',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#2563eb',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #e5e7eb',
    },
  }

  return (
    <a href={href} style={{ ...baseStyle, ...variantStyles[variant] }}>
      {children}
    </a>
  )
}

interface DividerProps {
  style?: React.CSSProperties
}

export function Divider({ style }: DividerProps) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid #e5e7eb',
        margin: '24px 0',
        ...style,
      }}
    />
  )
}

interface CalloutProps {
  children: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
}

export function Callout({ children, variant = 'info' }: CalloutProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    info: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
    success: { backgroundColor: '#f0fdf4', borderColor: '#22c55e' },
    warning: { backgroundColor: '#fffbeb', borderColor: '#f59e0b' },
    error: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  }

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '6px',
        borderLeft: '4px solid',
        margin: '16px 0',
        ...variantStyles[variant],
      }}
    >
      {children}
    </div>
  )
}

// ============================================
// EMAIL TEMPLATES
// ============================================

interface WelcomeEmailProps {
  userName: string
  loginUrl: string
}

export function WelcomeEmail({ userName, loginUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Welcome to OpenInfo - Your B2B Lead Intelligence Platform">
      <Heading>Welcome to OpenInfo!</Heading>
      <Text>Hi {userName},</Text>
      <Text>
        Thank you for signing up for OpenInfo. We&apos;re excited to help you
        discover companies actively researching topics relevant to your business.
      </Text>
      <Text>Here&apos;s what you can do to get started:</Text>
      <ul style={{ margin: '0 0 16px', paddingLeft: '20px', color: '#4b5563' }}>
        <li>Create your first query to track a topic</li>
        <li>Set up integrations with your CRM</li>
        <li>Explore trending topics in your industry</li>
      </ul>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={loginUrl}>Get Started</Button>
      </div>
      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        If you have any questions, just reply to this email. We&apos;re here to help!
      </Text>
    </EmailLayout>
  )
}

interface QueryCompletedEmailProps {
  userName: string
  queryName: string
  leadsCount: number
  queryUrl: string
}

export function QueryCompletedEmail({
  userName,
  queryName,
  leadsCount,
  queryUrl,
}: QueryCompletedEmailProps) {
  return (
    <EmailLayout preview={`Your query "${queryName}" has completed`}>
      <Heading>Query Completed!</Heading>
      <Text>Hi {userName},</Text>
      <Text>
        Great news! Your query <strong>&quot;{queryName}&quot;</strong> has finished
        processing.
      </Text>
      <Callout variant="success">
        <Text style={{ margin: 0 }}>
          <strong>{leadsCount}</strong> new leads are ready for review.
        </Text>
      </Callout>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={queryUrl}>View Leads</Button>
      </div>
    </EmailLayout>
  )
}

interface CreditLowEmailProps {
  userName: string
  creditsRemaining: number
  billingUrl: string
}

export function CreditLowEmail({
  userName,
  creditsRemaining,
  billingUrl,
}: CreditLowEmailProps) {
  return (
    <EmailLayout preview="Your OpenInfo credits are running low">
      <Heading>Credits Running Low</Heading>
      <Text>Hi {userName},</Text>
      <Text>
        This is a friendly reminder that you have{' '}
        <strong>{creditsRemaining} credits</strong> remaining in your account.
      </Text>
      <Callout variant="warning">
        <Text style={{ margin: 0 }}>
          When credits run out, your active queries will be paused until credits
          are refilled.
        </Text>
      </Callout>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={billingUrl}>Upgrade Plan</Button>
      </div>
    </EmailLayout>
  )
}

interface ExportReadyEmailProps {
  userName: string
  exportName: string
  downloadUrl: string
  expiresAt: string
}

export function ExportReadyEmail({
  userName,
  exportName,
  downloadUrl,
  expiresAt,
}: ExportReadyEmailProps) {
  return (
    <EmailLayout preview={`Your export "${exportName}" is ready`}>
      <Heading>Export Ready</Heading>
      <Text>Hi {userName},</Text>
      <Text>
        Your export <strong>&quot;{exportName}&quot;</strong> is ready for download.
      </Text>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={downloadUrl}>Download Export</Button>
      </div>
      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        This download link will expire on {expiresAt}. If you need a new link,
        you can regenerate it from your exports page.
      </Text>
    </EmailLayout>
  )
}

interface WeeklyDigestEmailProps {
  userName: string
  stats: {
    newLeads: number
    queriesCompleted: number
    topQueryName: string
    topQueryLeads: number
  }
  dashboardUrl: string
}

export function WeeklyDigestEmail({
  userName,
  stats,
  dashboardUrl,
}: WeeklyDigestEmailProps) {
  return (
    <EmailLayout preview="Your weekly OpenInfo summary">
      <Heading>Weekly Summary</Heading>
      <Text>Hi {userName},</Text>
      <Text>Here&apos;s what happened with your OpenInfo account this week:</Text>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{ margin: '16px 0' }}
      >
        <tbody>
          <tr>
            <td
              style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center',
                width: '50%',
              }}
            >
              <div
                style={{ fontSize: '24px', fontWeight: 600, color: '#2563eb' }}
              >
                {stats.newLeads}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                New Leads
              </div>
            </td>
            <td style={{ width: '16px' }} />
            <td
              style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center',
                width: '50%',
              }}
            >
              <div
                style={{ fontSize: '24px', fontWeight: 600, color: '#22c55e' }}
              >
                {stats.queriesCompleted}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Queries Completed
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {stats.topQueryName && (
        <Text>
          Your top performing query was{' '}
          <strong>&quot;{stats.topQueryName}&quot;</strong> with{' '}
          {stats.topQueryLeads} leads.
        </Text>
      )}

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={dashboardUrl}>View Dashboard</Button>
      </div>
    </EmailLayout>
  )
}

interface PasswordResetEmailProps {
  userName: string
  resetUrl: string
  expiresIn: string
}

export function PasswordResetEmail({
  userName,
  resetUrl,
  expiresIn,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your OpenInfo password">
      <Heading>Reset Your Password</Heading>
      <Text>Hi {userName},</Text>
      <Text>
        We received a request to reset your password. Click the button below to
        create a new password.
      </Text>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={resetUrl}>Reset Password</Button>
      </div>
      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        This link will expire in {expiresIn}. If you didn&apos;t request this,
        you can safely ignore this email.
      </Text>
    </EmailLayout>
  )
}

// ============================================
// TEMPLATE RENDERER
// ============================================

import { renderToStaticMarkup } from 'react-dom/server'

/**
 * Render email template to HTML string
 */
export function renderEmail(component: React.ReactElement): string {
  return '<!DOCTYPE html>' + renderToStaticMarkup(component)
}
