/**
 * Email Templates
 * Cursive Platform
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
                          src={`${process.env.NEXT_PUBLIC_APP_URL}/cursive-logo.png`}
                          alt="Cursive"
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
                          &copy; {new Date().getFullYear()} Cursive. All rights reserved.
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
    info: { backgroundColor: '#e5f2ff', borderColor: '#007aff' },
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
    <EmailLayout preview="Welcome to Cursive - Your B2B Lead Intelligence Platform">
      <Heading>Welcome to Cursive!</Heading>
      <Text>Hi {userName},</Text>
      <Text>
        Thank you for signing up for Cursive. We&apos;re excited to help you
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
    <EmailLayout preview="Your Cursive credits are running low">
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
    <EmailLayout preview="Your weekly Cursive summary">
      <Heading>Weekly Summary</Heading>
      <Text>Hi {userName},</Text>
      <Text>Here&apos;s what happened with your Cursive account this week:</Text>

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
    <EmailLayout preview="Reset your Cursive password">
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

interface CampaignCompletedEmailProps {
  userName: string
  campaignName: string
  stats: {
    totalSent: number
    opened: number
    clicked: number
    replied: number
  }
  campaignUrl: string
}

export function CampaignCompletedEmail({
  userName,
  campaignName,
  stats,
  campaignUrl,
}: CampaignCompletedEmailProps) {
  const openRate = stats.totalSent > 0 ? Math.round((stats.opened / stats.totalSent) * 100) : 0
  const clickRate = stats.totalSent > 0 ? Math.round((stats.clicked / stats.totalSent) * 100) : 0

  return (
    <EmailLayout preview={`Your campaign "${campaignName}" has completed`}>
      <Heading>Campaign Completed!</Heading>
      <Text>Hi {userName},</Text>
      <Text>
        Your email campaign <strong>&quot;{campaignName}&quot;</strong> has finished
        sending to all recipients.
      </Text>

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
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center',
                width: '25%',
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#2563eb' }}>
                {stats.totalSent}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Sent</div>
            </td>
            <td style={{ width: '8px' }} />
            <td
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center',
                width: '25%',
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#22c55e' }}>
                {openRate}%
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Open Rate</div>
            </td>
            <td style={{ width: '8px' }} />
            <td
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center',
                width: '25%',
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#f59e0b' }}>
                {clickRate}%
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Click Rate</div>
            </td>
            <td style={{ width: '8px' }} />
            <td
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center',
                width: '25%',
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#8b5cf6' }}>
                {stats.replied}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Replies</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={campaignUrl}>View Campaign Results</Button>
      </div>
    </EmailLayout>
  )
}

interface PaymentFailedEmailProps {
  userName: string
  amount: string
  currency: string
  billingUrl: string
  attemptCount: number
}

export function PaymentFailedEmail({
  userName,
  amount,
  currency,
  billingUrl,
  attemptCount,
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout preview="Payment failed - action required">
      <Heading>Payment Failed</Heading>
      <Text>Hi {userName},</Text>
      <Text>
        We were unable to process your payment of{' '}
        <strong>{currency.toUpperCase()} {amount}</strong>.
      </Text>
      <Callout variant="error">
        <Text style={{ margin: 0 }}>
          {attemptCount === 1
            ? 'This is our first attempt. We will retry automatically, but please update your payment method to avoid service interruption.'
            : `This is attempt ${attemptCount}. Please update your payment method immediately to avoid service interruption.`}
        </Text>
      </Callout>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={billingUrl}>Update Payment Method</Button>
      </div>
      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        If you believe this is an error or need assistance, please contact our support team.
      </Text>
    </EmailLayout>
  )
}

interface NewLeadEmailProps {
  userName: string
  leadName: string
  leadCompany: string | null
  leadTitle: string | null
  leadLocation: string | null
  matchedOn: string | null
  dashboardUrl: string
}

export function NewLeadEmail({
  userName,
  leadName,
  leadCompany,
  leadTitle,
  leadLocation,
  matchedOn,
  dashboardUrl,
}: NewLeadEmailProps) {
  return (
    <EmailLayout preview={`New lead: ${leadName}${leadCompany ? ` at ${leadCompany}` : ''}`}>
      <Heading>New Lead Assigned!</Heading>
      <Text>Hi {userName},</Text>
      <Text>
        Great news! A new lead has been matched to your targeting preferences and assigned to you.
      </Text>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          margin: '16px 0',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                {leadName}
              </div>
              {leadTitle && (
                <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>
                  {leadTitle}
                </div>
              )}
              {leadCompany && (
                <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>
                  <strong>Company:</strong> {leadCompany}
                </div>
              )}
              {leadLocation && (
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {leadLocation}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {matchedOn && (
        <Callout variant="info">
          <Text style={{ margin: 0 }}>
            <strong>Matched on:</strong> {matchedOn}
          </Text>
        </Callout>
      )}

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={dashboardUrl}>View Lead Details</Button>
      </div>

      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        This lead was automatically routed to you based on your industry and location preferences.
        You can update your targeting settings at any time.
      </Text>
    </EmailLayout>
  )
}

// ============================================
// MARKETPLACE EMAIL TEMPLATES
// ============================================

interface PartnerApprovedEmailProps {
  partnerName: string
  companyName: string
  apiKey: string
  dashboardUrl: string
}

export function PartnerApprovedEmail({
  partnerName,
  companyName,
  apiKey,
  dashboardUrl,
}: PartnerApprovedEmailProps) {
  return (
    <EmailLayout preview={`Your partner application for ${companyName} has been approved!`}>
      <Heading>Welcome to the Marketplace!</Heading>

      <Text>Hi {partnerName},</Text>

      <Text>
        Great news! Your partner application for <strong>{companyName}</strong> has been approved.
        You can now start uploading leads to the marketplace and earning commissions.
      </Text>

      <Callout variant="success">
        <Text style={{ margin: 0 }}>
          <strong>Your API Key:</strong>
          <br />
          <code style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'inline-block', marginTop: '8px' }}>
            {apiKey}
          </code>
        </Text>
        <Text style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', marginBottom: 0 }}>
          Save this API key securely. You'll need it to upload leads via CSV or API.
        </Text>
      </Callout>

      <Heading style={{ fontSize: '18px', marginTop: '24px' }}>Next Steps</Heading>

      <ol style={{ paddingLeft: '20px', margin: '0 0 16px' }}>
        <li style={{ marginBottom: '8px', fontSize: '14px', color: '#4b5563' }}>
          Log in to your partner dashboard
        </li>
        <li style={{ marginBottom: '8px', fontSize: '14px', color: '#4b5563' }}>
          Upload your first batch of leads
        </li>
        <li style={{ marginBottom: '8px', fontSize: '14px', color: '#4b5563' }}>
          Connect your Stripe account to receive payouts
        </li>
        <li style={{ marginBottom: '8px', fontSize: '14px', color: '#4b5563' }}>
          Start earning commissions when your leads sell
        </li>
      </ol>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={dashboardUrl}>Go to Partner Dashboard</Button>
      </div>

      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        Questions? Check out our partner documentation or contact our support team at hey@meetcursive.com
      </Text>
    </EmailLayout>
  )
}

interface PartnerRejectedEmailProps {
  partnerName: string
  companyName: string
  reason: string
  supportEmail: string
}

export function PartnerRejectedEmail({
  partnerName,
  companyName,
  reason,
  supportEmail,
}: PartnerRejectedEmailProps) {
  return (
    <EmailLayout preview={`Update on your partner application for ${companyName}`}>
      <Heading>Partner Application Status</Heading>

      <Text>Hi {partnerName},</Text>

      <Text>
        Thank you for your interest in becoming a data partner for <strong>{companyName}</strong>.
        After reviewing your application, we're unable to approve your partnership at this time.
      </Text>

      <Callout variant="warning">
        <Text style={{ margin: 0 }}>
          <strong>Reason:</strong>
          <br />
          {reason}
        </Text>
      </Callout>

      <Text>
        If you'd like to discuss this decision or reapply in the future, please don't hesitate to
        contact our team at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </Text>

      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        We appreciate your understanding and wish you the best in your business endeavors.
      </Text>
    </EmailLayout>
  )
}

interface PurchaseConfirmationEmailProps {
  buyerName: string
  totalLeads: number
  totalPrice: number
  downloadUrl: string
  downloadExpiresAt: string
  purchaseId: string
}

export function PurchaseConfirmationEmail({
  buyerName,
  totalLeads,
  totalPrice,
  downloadUrl,
  downloadExpiresAt,
  purchaseId,
}: PurchaseConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Your purchase of ${totalLeads} leads is complete!`}>
      <Heading>Purchase Confirmed!</Heading>

      <Text>Hi {buyerName},</Text>

      <Text>
        Your purchase is complete! You now have access to <strong>{totalLeads} high-quality leads</strong>.
      </Text>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Leads</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{totalLeads}</div>
            </td>
            <td style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Amount Paid</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>${totalPrice.toFixed(2)}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Purchase ID</div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#4b5563' }}>{purchaseId}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <Callout variant="info">
        <Text style={{ margin: 0 }}>
          <strong>Download Available Until:</strong> {downloadExpiresAt}
          <br />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            You have 90 days to download your leads. After that, you'll need to access them from your purchase history.
          </span>
        </Text>
      </Callout>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={downloadUrl}>Download Leads (CSV)</Button>
      </div>

      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        Your leads include full contact information, company details, and intent scores. Start reaching out today!
      </Text>
    </EmailLayout>
  )
}

interface PayoutCompletedEmailProps {
  partnerName: string
  amount: number
  currency: string
  leadsCount: number
  periodStart: string
  periodEnd: string
  payoutId: string
  dashboardUrl: string
}

export function PayoutCompletedEmail({
  partnerName,
  amount,
  currency,
  leadsCount,
  periodStart,
  periodEnd,
  payoutId,
  dashboardUrl,
}: PayoutCompletedEmailProps) {
  return (
    <EmailLayout preview={`Payout of $${amount.toFixed(2)} processed successfully!`}>
      <Heading>Payout Processed!</Heading>

      <Text>Hi {partnerName},</Text>

      <Text>
        Great news! Your payout has been processed and funds are on their way to your connected Stripe account.
      </Text>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #86efac',
        }}
      >
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '14px', color: '#16a34a', marginBottom: '8px' }}>Payout Amount</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#15803d' }}>
                ${amount.toFixed(2)} {currency.toUpperCase()}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Leads Sold</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{leadsCount}</div>
            </td>
            <td style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Period</div>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>{periodStart} - {periodEnd}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Payout ID</div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#4b5563' }}>{payoutId}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        Funds typically arrive in your account within 2-3 business days. You can track your payout status in your partner dashboard.
      </Text>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={dashboardUrl}>View Payout History</Button>
      </div>
    </EmailLayout>
  )
}

interface CreditPurchaseConfirmationEmailProps {
  buyerName: string
  creditsAmount: number
  totalPrice: number
  packageName: string
  newBalance: number
}

export function CreditPurchaseConfirmationEmail({
  buyerName,
  creditsAmount,
  totalPrice,
  packageName,
  newBalance,
}: CreditPurchaseConfirmationEmailProps) {
  return (
    <EmailLayout preview={`${creditsAmount} credits added to your account!`}>
      <Heading>Credits Purchased!</Heading>

      <Text>Hi {buyerName},</Text>

      <Text>
        Your credit purchase is complete! <strong>{creditsAmount} credits</strong> have been added to your account.
      </Text>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #93c5fd',
        }}
      >
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '14px', color: '#1d4ed8', marginBottom: '8px' }}>New Credit Balance</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e40af' }}>
                {newBalance} credits
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Package</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{packageName}</div>
            </td>
            <td style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Credits Added</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{creditsAmount}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Amount Paid</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>${totalPrice.toFixed(2)}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <Text>
        You can now use your credits to purchase high-quality leads from the marketplace.
        Each lead costs 1 credit, and credits never expire.
      </Text>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/marketplace`}>Browse Marketplace</Button>
      </div>

      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        Need more credits? You can purchase additional credits anytime from your account settings.
      </Text>
    </EmailLayout>
  )
}

interface PayoutFailedEmailProps {
  partnerName: string
  amount: number
  currency: string
  reason: string
  payoutId: string
  dashboardUrl: string
}

export function PayoutFailedEmail({
  partnerName,
  amount,
  currency,
  reason,
  payoutId,
  dashboardUrl,
}: PayoutFailedEmailProps) {
  return (
    <EmailLayout preview={`Payout of $${amount.toFixed(2)} failed`}>
      <Heading>Payout Failed</Heading>

      <Text>Hi {partnerName},</Text>

      <Text>
        We attempted to process a payout to your connected Stripe account, but unfortunately it failed.
      </Text>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #fca5a5',
        }}
      >
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '14px', color: '#dc2626', marginBottom: '8px' }}>Failed Payout Amount</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#991b1b' }}>
                ${amount.toFixed(2)} {currency.toUpperCase()}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Failure Reason</div>
              <div style={{ fontSize: '14px', color: '#dc2626', marginTop: '4px' }}>{reason}</div>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Payout ID</div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#4b5563' }}>{payoutId}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <Text>
        <strong>What happens next:</strong>
      </Text>

      <ul style={{ marginLeft: '20px', marginBottom: '24px' }}>
        <li style={{ marginBottom: '8px' }}>
          Your earnings remain in your available balance - no funds were lost
        </li>
        <li style={{ marginBottom: '8px' }}>
          Please check your Stripe Connect account settings
        </li>
        <li style={{ marginBottom: '8px' }}>
          Ensure your bank account details are correct and up to date
        </li>
        <li style={{ marginBottom: '8px' }}>
          Once fixed, you can request a new payout from your dashboard
        </li>
      </ul>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={dashboardUrl}>View Partner Dashboard</Button>
      </div>

      <Text style={{ color: '#6b7280', fontSize: '12px' }}>
        If you need help resolving this issue, please contact our support team.
      </Text>
    </EmailLayout>
  )
}
