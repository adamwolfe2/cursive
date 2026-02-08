/**
 * DFY Onboarding Sequence
 *
 * Triggered when a DFY client completes their onboarding form.
 * Sends tier-specific emails and notifies admin to begin manual setup.
 *
 * Flow:
 *   1. Notify admin: client completed onboarding, ready for pixel setup
 *   2. Day 1: "We're setting up your pixel" confirmation email
 *   3. Day 3: Check-in email (has admin marked pixel as live?)
 *   4. Day 7: First week recap + tips
 *   5. Day 14: ROI check-in + upsell if applicable
 */

import { inngest } from '../client'
import { sendEmail, createEmailTemplate } from '@/lib/email/resend-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog } from '@/lib/utils/log-sanitizer'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
const BOOKING_URL = 'https://cal.com/cursive/30min'

export const dfyOnboardingSequence = inngest.createFunction(
  { id: 'dfy-onboarding-sequence', retries: 2 },
  { event: 'dfy/onboarding-completed' },
  async ({ event, step }) => {
    const {
      workspace_id,
      subscription_id,
      user_email,
      user_name,
      company_name,
      website_url,
      industries,
      onboarding_data,
    } = event.data

    const firstName = (user_name || user_email.split('@')[0] || '').split(' ')[0]

    // Step 1: Notify admin — client is ready for pixel setup
    await step.run('notify-admin-ready-for-pixel', async () => {
      safeLog(`[DFY Onboarding] Client completed form: ${company_name} (${user_email})`)

      await sendEmail({
        to: 'adam@meetcursive.com',
        subject: `[READY] ${company_name} completed onboarding — create pixel for ${website_url}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px;">
            <h2 style="color: #16a34a;">Client Ready for Pixel Setup</h2>
            <p><strong>${company_name}</strong> has completed their onboarding form.</p>

            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0;">Action Items:</h3>
              <ol style="line-height: 2;">
                <li>Create pixel in DataShopper/AudienceLab for: <strong>${website_url}</strong></li>
                <li>Configure native GHL integration to route leads to their sub-account</li>
                <li>Build initial EmailBison campaign targeting: ${industries?.join(', ') || 'TBD'}</li>
                <li>Mark as active in admin dashboard when complete</li>
              </ol>
            </div>

            <h3>Client Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; font-weight: bold;">Company:</td><td>${company_name}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Website:</td><td><a href="${website_url}">${website_url}</a></td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td>${user_email}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Industries:</td><td>${industries?.join(', ') || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Target Titles:</td><td>${onboarding_data.target_titles || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">ICP:</td><td>${onboarding_data.ideal_lead_profile || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Use Case:</td><td>${onboarding_data.use_case || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Lead Goal:</td><td>${onboarding_data.monthly_lead_goal || 'Not specified'}/mo</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Value Prop:</td><td>${onboarding_data.value_proposition || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Workspace:</td><td>${workspace_id}</td></tr>
            </table>
          </div>
        `,
      })

      try {
        await sendSlackAlert({
          type: 'dfy_onboarding_complete',
          severity: 'info',
          message: `${company_name} completed onboarding. Website: ${website_url}. Ready for pixel setup.`,
          metadata: { company_name, website_url, user_email, workspace_id },
        })
      } catch {
        // Slack is optional
      }
    })

    // Step 2: Send client confirmation email
    await step.run('send-setup-confirmation', async () => {
      const html = createEmailTemplate({
        preheader: 'We received your details and are setting everything up',
        title: 'Setup in Progress',
        content: `
          <h1 class="email-title">We're Building Your Pipeline</h1>
          <p class="email-text">Hey ${firstName},</p>
          <p class="email-text">Thanks for completing your onboarding. Here's what happens next:</p>

          <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <div style="display: flex; margin-bottom: 16px;">
              <div style="min-width: 32px; height: 32px; background: #16a34a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">✓</div>
              <div>
                <p style="margin: 0; font-weight: 600;">CRM Account Created</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Your GoHighLevel CRM is ready</p>
              </div>
            </div>
            <div style="display: flex; margin-bottom: 16px;">
              <div style="min-width: 32px; height: 32px; background: #16a34a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">✓</div>
              <div>
                <p style="margin: 0; font-weight: 600;">Onboarding Complete</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">We have your business details</p>
              </div>
            </div>
            <div style="display: flex; margin-bottom: 16px;">
              <div style="min-width: 32px; height: 32px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">3</div>
              <div>
                <p style="margin: 0; font-weight: 600;">Pixel Deployment (In Progress)</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">We're installing tracking on ${website_url}</p>
              </div>
            </div>
            <div style="display: flex;">
              <div style="min-width: 32px; height: 32px; background: #e5e7eb; color: #6b7280; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">4</div>
              <div>
                <p style="margin: 0; font-weight: 600;">Campaign Launch</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">AI-powered outreach to your ideal prospects</p>
              </div>
            </div>
          </div>

          <p class="email-text">We'll email you when your pixel is live and leads start flowing in. Most clients see their first leads within 48 hours.</p>

          <a href="${BOOKING_URL}" class="email-button">Book a Strategy Call</a>

          <div class="email-signature">
            <p style="margin: 0;">— Adam, Founder @ Cursive</p>
          </div>
        `,
      })

      await sendEmail({
        to: user_email,
        subject: `We're setting up your pipeline, ${firstName}`,
        html,
      })
    })

    // Emit pipeline lifecycle event — onboarding completed
    await step.run('emit-pipeline-update', async () => {
      try {
        await inngest.send({
          name: 'ghl/pipeline.update',
          data: {
            user_email,
            workspace_id,
            lifecycle_event: 'onboarding_completed',
            metadata: {
              company_name,
              website_url,
              industries,
            },
          },
        })
      } catch {
        // Non-blocking
      }
    })

    // Wait 3 days
    await step.sleep('wait-3-days', '3d')

    // Step 3: Day 3 check-in
    await step.run('send-day3-checkin', async () => {
      safeLog(`[DFY Onboarding] Day 3: Check-in for ${user_email}`)

      // Check if workspace has been marked as active (pixel deployed)
      const supabase = createAdminClient()
      const { data: sub } = await supabase
        .from('service_subscriptions')
        .select('status')
        .eq('id', subscription_id)
        .single()

      const isActive = sub?.status === 'active'

      const html = createEmailTemplate({
        preheader: isActive ? 'Your pixel is live — leads are flowing' : 'Quick update on your setup',
        title: isActive ? 'Your Pixel is Live!' : 'Setup Update',
        content: isActive
          ? `
            <h1 class="email-title">Your Pixel is Live!</h1>
            <p class="email-text">Hey ${firstName},</p>
            <p class="email-text">Great news — your visitor tracking pixel is now active on ${website_url}. Here's what that means:</p>

            <div style="background: #f0fdf4; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <ul style="margin: 0; padding-left: 20px; line-height: 2;">
                <li>We're identifying anonymous visitors on your website</li>
                <li>Enriching them with contact data (name, email, phone, company)</li>
                <li>Routing qualified leads directly to your CRM</li>
                <li>AI outreach campaigns are being configured</li>
              </ul>
            </div>

            <p class="email-text">Log in to your CRM to see incoming leads:</p>
            <a href="https://app.gohighlevel.com/" class="email-button">Open Your CRM</a>

            <div class="email-signature">
              <p style="margin: 0;">— Adam, Founder @ Cursive</p>
            </div>
          `
          : `
            <h1 class="email-title">Quick Update</h1>
            <p class="email-text">Hey ${firstName},</p>
            <p class="email-text">We're still setting up your tracking pixel for ${website_url}. We'll have it live within the next 24-48 hours.</p>
            <p class="email-text">In the meantime, make sure you've logged into your CRM — all your leads will be delivered there automatically.</p>

            <a href="https://app.gohighlevel.com/" class="email-button">Log In to CRM</a>

            <p class="email-text">Questions? Just reply to this email.</p>

            <div class="email-signature">
              <p style="margin: 0;">— Adam, Founder @ Cursive</p>
            </div>
          `,
      })

      await sendEmail({
        to: user_email,
        subject: isActive
          ? `Your tracking pixel is live, ${firstName}!`
          : `Setup update for ${company_name}`,
        html,
      })
    })

    // Wait 4 more days (Day 7)
    await step.sleep('wait-4-days', '4d')

    // Step 4: Day 7 first week recap
    await step.run('send-day7-recap', async () => {
      safeLog(`[DFY Onboarding] Day 7: Recap for ${user_email}`)

      const html = createEmailTemplate({
        preheader: 'Your first week with Cursive — tips to maximize ROI',
        title: 'First Week Tips',
        content: `
          <h1 class="email-title">Your First Week with Cursive</h1>
          <p class="email-text">Hey ${firstName},</p>
          <p class="email-text">You've been on Cursive for a week. Here are 3 things that'll help you get the most out of your investment:</p>

          <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0 0 16px;"><strong>1. Check your CRM daily</strong><br/>
            New leads are being delivered automatically. The faster you follow up, the higher your conversion rate. Aim to respond within 1 hour.</p>

            <p style="margin: 0 0 16px;"><strong>2. Review your email campaigns</strong><br/>
            We're sending AI-powered outreach on your behalf. Reply to any leads that respond — we'll flag the interested ones for you.</p>

            <p style="margin: 0;"><strong>3. Tell us what's working</strong><br/>
            The more feedback you give us on lead quality, the better we can tune your targeting and campaigns.</p>
          </div>

          <p class="email-text">Want to review your pipeline together?</p>
          <a href="${BOOKING_URL}" class="email-button">Book a Review Call</a>

          <div class="email-signature">
            <p style="margin: 0;">— Adam, Founder @ Cursive</p>
          </div>
        `,
      })

      await sendEmail({
        to: user_email,
        subject: `Week 1 tips to maximize your leads, ${firstName}`,
        html,
      })
    })

    // Wait 7 more days (Day 14)
    await step.sleep('wait-7-days', '7d')

    // Step 5: Day 14 ROI check-in
    await step.run('send-day14-roi-checkin', async () => {
      safeLog(`[DFY Onboarding] Day 14: ROI check-in for ${user_email}`)

      const html = createEmailTemplate({
        preheader: 'Two weeks in — how are your leads converting?',
        title: 'Two Week Check-In',
        content: `
          <h1 class="email-title">How's It Going?</h1>
          <p class="email-text">Hey ${firstName},</p>
          <p class="email-text">You've been on Cursive for 2 weeks. I'd love to hear how the leads are converting for ${company_name}.</p>

          <p class="email-text">Quick questions:</p>
          <ul style="line-height: 2; color: #374151;">
            <li>Are you seeing enough leads in your CRM?</li>
            <li>Are the leads matching your ideal customer profile?</li>
            <li>Have any converted to meetings or deals?</li>
          </ul>

          <p class="email-text">Just reply to this email with your feedback — I read every response personally.</p>

          <p class="email-text">If you'd prefer to chat live, grab a time:</p>
          <a href="${BOOKING_URL}" class="email-button">Schedule a Call</a>

          <div class="email-signature">
            <p style="margin: 0;">— Adam, Founder @ Cursive</p>
          </div>
        `,
      })

      await sendEmail({
        to: user_email,
        subject: `How are your Cursive leads converting?`,
        html,
      })
    })

    return { completed: true, user_email, company_name }
  }
)
