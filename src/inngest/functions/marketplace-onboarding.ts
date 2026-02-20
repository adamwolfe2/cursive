/**
 * Marketplace Onboarding Sequence
 * Multi-step email drip for first-time marketplace buyers
 * Day 0: Welcome, Day 3: Tips, Day 7: Credit check, Day 14: Services upsell
 */

import { inngest } from '../client'
import { sendEmail } from '@/lib/email/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog } from '@/lib/utils/log-sanitizer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
const BOOKING_URL = 'https://cal.com/cursive/30min'

export const marketplaceOnboardingSequence = inngest.createFunction(
  { id: 'marketplace-onboarding-sequence', retries: 2 },
  { event: 'marketplace/first-purchase' },
  async ({ event, step }) => {
    const { workspace_id, user_id, user_email, user_name, credits } = event.data

    // Day 0: Welcome email
    await step.run('send-welcome-email', async () => {
      safeLog(`[Onboarding] Day 0: Welcome email to ${user_email}`)

      await sendEmail({
        to: user_email,
        subject: `Welcome to Cursive, ${user_name.split(' ')[0]}! Here's how to get the most from your leads`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #111827;">Welcome to Cursive</h2>
            <p>Hey ${user_name.split(' ')[0]},</p>
            <p>You just picked up <strong>${credits} credits</strong> &mdash; nice move. Here's how to put them to work:</p>

            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #111827;">Quick Start (2 minutes)</h3>
              <ol style="color: #374151; line-height: 1.8;">
                <li><strong>Browse leads</strong> &mdash; Filter by industry, location, or intent score</li>
                <li><strong>Use intent scores</strong> &mdash; Leads scored 70+ are actively in-market</li>
                <li><strong>Export or sync</strong> &mdash; Download CSV or push directly to your CRM</li>
              </ol>
            </div>

            <p>
              <a href="${APP_URL}/marketplace" style="display: inline-block; background: #111827; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Browse Leads Now
              </a>
            </p>

            <p style="color: #6b7280; font-size: 14px;">Questions? Just reply to this email &mdash; a real person reads every one.</p>
            <p style="color: #6b7280; font-size: 14px;">&mdash; Team Cursive</p>
            <p style="margin:4px 0 0;font-size:12px;"><a href="${APP_URL}/settings/notifications" style="color:#9ca3af;text-decoration:underline;">Manage email preferences</a> &middot; <a href="mailto:hello@meetcursive.com" style="color:#9ca3af;text-decoration:underline;">Contact support</a></p>
          </div>
        `,
        tags: [{ name: 'sequence', value: 'marketplace-onboarding' }, { name: 'step', value: 'welcome' }],
      })
    })

    // Wait 3 days
    await step.sleep('wait-3-days', '3d')

    // Day 3: Tips email
    await step.run('send-tips-email', async () => {
      safeLog(`[Onboarding] Day 3: Tips email to ${user_email}`)

      await sendEmail({
        to: user_email,
        subject: `3 ways to get better results from your Cursive leads`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hey ${user_name.split(' ')[0]},</p>
            <p>Quick tips from teams closing the most deals with Cursive leads:</p>

            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin-top: 0;"><strong>1. Filter by intent score first</strong><br/>
              Leads scored 70+ have shown active buying signals in the last 7 days. These convert 3-5x better than cold outreach.</p>

              <p><strong>2. Reach out within 24 hours</strong><br/>
              Intent data decays fast. The sooner you reach out after a lead shows intent, the higher your response rate.</p>

              <p style="margin-bottom: 0;"><strong>3. Connect your CRM</strong><br/>
              Push leads directly to GoHighLevel, HubSpot, or Salesforce. No CSV downloads, no manual entry.</p>
            </div>

            <p>
              <a href="${APP_URL}/settings/integrations" style="display: inline-block; background: #111827; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Connect Your CRM
              </a>
            </p>

            <p style="color: #6b7280; font-size: 14px;">&mdash; Team Cursive</p>
            <p style="margin:4px 0 0;font-size:12px;"><a href="${APP_URL}/settings/notifications" style="color:#9ca3af;text-decoration:underline;">Manage email preferences</a> &middot; <a href="mailto:hello@meetcursive.com" style="color:#9ca3af;text-decoration:underline;">Contact support</a></p>
          </div>
        `,
        tags: [{ name: 'sequence', value: 'marketplace-onboarding' }, { name: 'step', value: 'tips' }],
      })
    })

    // Wait 4 more days (Day 7 total)
    await step.sleep('wait-4-days', '4d')

    // Day 7: Credit check + upsell
    await step.run('send-credit-upsell', async () => {
      const supabase = createAdminClient()

      const { data: creditsData } = await supabase
        .from('workspace_credits')
        .select('balance')
        .eq('workspace_id', workspace_id)
        .maybeSingle()

      const balance = creditsData?.balance || 0

      safeLog(`[Onboarding] Day 7: Credit check for ${user_email} (balance: ${balance})`)

      if (balance < 50) {
        await sendEmail({
          to: user_email,
          subject: `Your Cursive credits are running low (${balance} remaining)`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <p>Hey ${user_name.split(' ')[0]},</p>
              <p>You have <strong>${balance} credits</strong> remaining. At your current pace, you'll run out soon.</p>

              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin-top: 0;"><strong>Top up options:</strong></p>
                <ul style="color: #374151; line-height: 1.8;">
                  <li>250 credits &mdash; $150 ($0.60/lead)</li>
                  <li>500 credits &mdash; $275 ($0.55/lead)</li>
                  <li>1,000 credits &mdash; $500 ($0.50/lead)</li>
                </ul>
              </div>

              <p>
                <a href="${APP_URL}/marketplace/credits" style="display: inline-block; background: #111827; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                  Buy More Credits
                </a>
              </p>

              <p style="color: #6b7280; font-size: 14px;">&mdash; Team Cursive</p>
            <p style="margin:4px 0 0;font-size:12px;"><a href="${APP_URL}/settings/notifications" style="color:#9ca3af;text-decoration:underline;">Manage email preferences</a> &middot; <a href="mailto:hello@meetcursive.com" style="color:#9ca3af;text-decoration:underline;">Contact support</a></p>
            </div>
          `,
          tags: [{ name: 'sequence', value: 'marketplace-onboarding' }, { name: 'step', value: 'credit-upsell' }],
        })
      }
    })

    // Wait 7 more days (Day 14 total)
    await step.sleep('wait-7-days', '7d')

    // Day 14: Done-for-you upsell
    await step.run('send-services-upsell', async () => {
      safeLog(`[Onboarding] Day 14: Services upsell to ${user_email}`)

      await sendEmail({
        to: user_email,
        subject: `What if we handled your entire lead gen pipeline?`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hey ${user_name.split(' ')[0]},</p>
            <p>You've been using Cursive for 2 weeks now. How's it going?</p>
            <p>Some of our most successful customers have moved to our <strong>Done-For-You service</strong> where we handle everything:</p>

            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Pixel deployed on your site &mdash; we identify your visitors</li>
                <li>AI-powered outreach sequences &mdash; personalized to each lead</li>
                <li>CRM fully configured &mdash; contacts, pipelines, automations</li>
                <li>Weekly lead delivery &mdash; fresh, enriched, ready to close</li>
                <li>Dedicated account manager &mdash; strategy calls included</li>
              </ul>
            </div>

            <p>Starting at $1,000/month. Most teams see ROI within the first 2 weeks.</p>

            <p>
              <a href="${BOOKING_URL}" style="display: inline-block; background: #111827; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Book a Free Strategy Call
              </a>
            </p>

            <p style="color: #6b7280; font-size: 14px;">&mdash; Adam, Founder @ Cursive</p>
            <p style="margin:4px 0 0;font-size:12px;"><a href="${APP_URL}/settings/notifications" style="color:#9ca3af;text-decoration:underline;">Manage email preferences</a> &middot; <a href="mailto:hello@meetcursive.com" style="color:#9ca3af;text-decoration:underline;">Contact support</a></p>
          </div>
        `,
        tags: [{ name: 'sequence', value: 'marketplace-onboarding' }, { name: 'step', value: 'dfy-upsell' }],
      })
    })

    return { completed: true, user_email }
  }
)
