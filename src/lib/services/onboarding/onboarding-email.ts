// Onboarding Confirmation Email
// Sends a professional confirmation email to the client after form submission

import { sendEmail, createEmailTemplate } from '@/lib/email/resend-client'
import { PACKAGES } from '@/types/onboarding'
import type { OnboardingClient, PackageSlug } from '@/types/onboarding'

function buildPackageListHtml(packages: PackageSlug[]): string {
  return packages
    .map((slug) => {
      const pkg = PACKAGES[slug]
      if (!pkg) return ''
      return `<li style="margin-bottom: 8px;"><strong>${pkg.label}</strong> — ${pkg.description}</li>`
    })
    .filter(Boolean)
    .join('\n')
}

/**
 * Send the onboarding confirmation email to the primary contact.
 * Uses the existing Resend email infrastructure.
 */
export async function sendOnboardingConfirmation(client: OnboardingClient): Promise<void> {
  const packageListHtml = buildPackageListHtml(client.packages_selected)

  const content = `
    <h1 class="email-title">Welcome to Cursive, ${client.primary_contact_name.split(' ')[0]}!</h1>

    <p class="email-text">
      Thank you for completing your onboarding form for <strong>${client.company_name}</strong>.
      We have everything we need to get started.
    </p>

    <p class="email-text">
      <strong>Your selected packages:</strong>
    </p>
    <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #000000; font-size: 16px; line-height: 24px;">
      ${packageListHtml}
    </ul>

    <p class="email-text">
      <strong>What happens next:</strong>
    </p>
    <ol style="margin: 0 0 16px 0; padding-left: 20px; color: #000000; font-size: 16px; line-height: 24px;">
      <li style="margin-bottom: 8px;">Our team will review your intake within the next <strong>24-48 hours</strong>.</li>
      <li style="margin-bottom: 8px;">We will enrich your ICP profile and prepare your audience strategy.</li>
      <li style="margin-bottom: 8px;">You will receive draft email sequences (if applicable) for your review and approval.</li>
      <li style="margin-bottom: 8px;">Setup and activation will begin once all approvals are in place.</li>
    </ol>

    <p class="email-text">
      If you have any questions in the meantime, reply to this email or reach out to your account manager directly.
    </p>

    <div class="email-signature">
      <p style="margin: 0 0 4px 0;"><strong>The Cursive Team</strong></p>
      <p style="margin: 0; color: #71717a;">Demand Generation, Simplified</p>
    </div>
  `

  const html = createEmailTemplate({
    preheader: `Welcome aboard! Setup for ${client.company_name} begins within 24-48 hours.`,
    title: `Welcome to Cursive — ${client.company_name}`,
    content,
  })

  const result = await sendEmail({
    to: client.primary_contact_email,
    from: 'Cursive Onboarding <onboarding@meetcursive.com>',
    subject: `Welcome to Cursive — setup begins for ${client.company_name}`,
    html,
  })

  if (!result.success) {
    throw new Error(`Failed to send onboarding confirmation email: ${JSON.stringify(result.error)}`)
  }
}
