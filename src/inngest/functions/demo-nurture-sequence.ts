/**
 * Demo Nurture Sequence
 * Cursive Platform
 *
 * 6-email automated follow-up sequence for demo requests
 * Handles confirmation, reminders, follow-up, and breakup emails
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
import { sendEmail } from '@/lib/services/outreach/email-sender.service'
import type {
  DemoSequenceTokens,
  DemoSequenceEmailType,
} from '@/lib/types/demo-sequence.types'
import type { LeadContactData, LeadCompanyData } from '@/types'

// ============================================================================
// MAIN SEQUENCE FUNCTION
// ============================================================================

export const demoNurtureSequence = inngest.createFunction(
  {
    id: 'demo-nurture-sequence',
    name: 'Demo Nurture Sequence',
    retries: 3,
    timeouts: { finish: "5m" }, // per step
    cancelOn: [
      {
        event: 'demo/cancelled',
        if: 'event.data.booking_uid != "" && event.data.booking_uid == async.data.booking_uid',
      },
    ],
  },
  { event: 'demo/booked' },
  async ({ event, step, logger }) => {
    const rawData = event.data as Record<string, any>

    // Support both schemas:
    // Prospect/Cal schema: attendee_email, attendee_name, booking_uid, start_time, end_time, owner_name, owner_email, calendar_link
    // Legacy/DB schema:    leadId, demoDate, demoTime, timezone, workspaceId, demoOwner, demoOwnerEmail
    const isProspectMode = !!rawData.attendee_email

    // Unified fields for both modes
    const recipientEmail: string = rawData.attendee_email || ''
    const recipientFirstName: string = rawData.attendee_name
      ? String(rawData.attendee_name).split(' ')[0]
      : 'there'
    const ownerName: string = rawData.owner_name || rawData.demoOwner || 'Darren'
    const ownerEmail: string = rawData.owner_email || rawData.demoOwnerEmail || 'darren@meetcursive.com'
    const calendarLink: string = rawData.calendar_link || 'https://cal.com/gotdarrenhill/30min'

    // Parse demo date from start_time (Cal) or demoDate (legacy)
    const startDate = rawData.start_time
      ? new Date(rawData.start_time)
      : rawData.demoDate
        ? new Date(rawData.demoDate)
        : new Date()

    const demoDateFormatted = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: rawData.timezone || 'America/Chicago',
    })
    const demoTimeFormatted = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: rawData.timezone || 'America/Chicago',
    })

    // Legacy schema fields
    const {
      leadId,
      demoDate,
      demoTime,
      timezone,
      workspaceId,
    } = rawData as {
      leadId?: string
      demoDate?: string
      demoTime?: string
      timezone?: string
      workspaceId?: string
    }

    // In prospect mode we route directly; skip if no email
    if (isProspectMode && !recipientEmail) {
      logger.warn('demo/booked fired in prospect mode but no attendee_email — skipping')
      return { skipped: true, reason: 'no_email' }
    }

    logger.info(`Starting demo sequence — mode=${isProspectMode ? 'prospect' : 'lead'}, recipient=${recipientEmail || leadId}`)

    // ========================================================================
    // STEP 1: CREATE ENROLLMENT (legacy/DB mode only)
    // ========================================================================

    const enrollment = await step.run('create-enrollment', async () => {
      // Prospect mode: no DB enrollment needed
      if (isProspectMode) {
        return { id: `prospect-${rawData.booking_uid || Date.now()}`, is_prospect: true }
      }

      const supabase = createAdminClient()

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('sequence_enrollments')
        .select('id, status')
        .eq('lead_id', leadId!)
        .eq('sequence_id', 'demo-nurture-v1') // Use consistent ID
        .maybeSingle()

      if (existing?.status === 'active') {
        throw new Error('Lead already enrolled in demo sequence')
      }

      // Create enrollment
      const { data, error } = await supabase
        .from('sequence_enrollments')
        .insert({
          lead_id: leadId!,
          sequence_id: 'demo-nurture-v1',
          workspace_id: workspaceId,
          status: 'active',
          current_step: 1,
          metadata: {
            demo_date: demoDate,
            demo_time: demoTime,
            timezone,
            demo_owner: ownerName,
          },
        })
        .select()
        .maybeSingle()

      if (error) throw error

      logger.info(`Created enrollment ${data.id}`)
      return data
    })

    // ========================================================================
    // EMAIL 1: CONFIRMATION (IMMEDIATE)
    // ========================================================================

    await step.run('send-confirmation', async () => {
      if (isProspectMode) {
        await sendProspectEmail({
          to: recipientEmail,
          toName: recipientFirstName,
          ownerName,
          ownerEmail,
          calendarLink,
          subject: `Your call with ${ownerName} is confirmed — ${demoDateFormatted}`,
          bodyLines: [
            `Hi ${recipientFirstName},`,
            ``,
            `Your call with ${ownerName} is confirmed for <strong>${demoDateFormatted} at ${demoTimeFormatted} CT</strong>.`,
            ``,
            `You'll receive a calendar invite shortly. If you need to reschedule, grab a new time here:`,
            `<a href="${calendarLink}" style="color:#007AFF;">${calendarLink}</a>`,
            ``,
            `Looking forward to chatting!`,
          ],
        })
        logger.info(`Sent prospect confirmation email to ${recipientEmail}`)
        return { sent: true }
      }

      const hasResponded = await checkIfLeadResponded(leadId!)
      if (hasResponded) {
        logger.info('Lead responded, skipping confirmation')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId!, demoDate!, demoTime!, timezone!, {
        demoOwner: ownerName,
        demoOwnerEmail: ownerEmail,
      })

      await sendSequenceEmail({
        leadId: leadId!,
        enrollmentId: enrollment.id,
        emailType: 'demo-confirmation',
        tokens,
        stepNumber: 1,
      })

      logger.info('Sent confirmation email')
      return { sent: true }
    })

    // Check for exit conditions (legacy mode only)
    if (!isProspectMode && leadId && await shouldExitSequence(leadId, enrollment.id)) {
      return await exitSequence(enrollment.id, 'lead-responded')
    }

    // ========================================================================
    // EMAIL 2: 1-DAY BEFORE REMINDER
    // ========================================================================

    const demoParsed = startDate
    const oneDayBefore = new Date(demoParsed)
    oneDayBefore.setDate(oneDayBefore.getDate() - 1)
    oneDayBefore.setHours(9, 0, 0, 0) // Send at 9 AM

    const delayUntilOneDayBefore = Math.max(0, oneDayBefore.getTime() - Date.now())

    if (delayUntilOneDayBefore > 0) {
      await step.sleep('wait-for-1day-reminder', delayUntilOneDayBefore)
    }

    await step.run('send-1day-reminder', async () => {
      if (isProspectMode) {
        await sendProspectEmail({
          to: recipientEmail,
          toName: recipientFirstName,
          ownerName,
          ownerEmail,
          calendarLink,
          subject: `Reminder: Your call with ${ownerName} is tomorrow`,
          bodyLines: [
            `Hi ${recipientFirstName},`,
            ``,
            `Just a reminder — your call with ${ownerName} is <strong>tomorrow at ${demoTimeFormatted} CT</strong>.`,
            ``,
            `We'll cover how Cursive identifies your website visitors and turns them into named leads you can act on immediately.`,
            ``,
            `Need to reschedule? No problem: <a href="${calendarLink}" style="color:#007AFF;">${calendarLink}</a>`,
          ],
        })
        logger.info(`Sent prospect 1-day reminder to ${recipientEmail}`)
        return { sent: true }
      }

      const hasResponded = await checkIfLeadResponded(leadId!)
      if (hasResponded) {
        logger.info('Lead responded, skipping 1-day reminder')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId!, demoDate!, demoTime!, timezone!, {
        demoOwner: ownerName,
        demoOwnerEmail: ownerEmail,
        demoOwnerPhone: '(555) 123-4567', // FUTURE: Pull from workspace settings table
      })

      await sendSequenceEmail({
        leadId: leadId!,
        enrollmentId: enrollment.id,
        emailType: 'demo-1day-reminder',
        tokens,
        stepNumber: 2,
      })

      logger.info('Sent 1-day reminder')
      return { sent: true }
    })

    if (!isProspectMode && leadId && await shouldExitSequence(leadId, enrollment.id)) {
      return await exitSequence(enrollment.id, 'lead-responded')
    }

    // ========================================================================
    // EMAIL 3: 2-HOUR BEFORE REMINDER
    // ========================================================================

    const twoHoursBefore = new Date(demoParsed)
    twoHoursBefore.setHours(twoHoursBefore.getHours() - 2)

    const delayUntilTwoHoursBefore = Math.max(0, twoHoursBefore.getTime() - Date.now())

    if (delayUntilTwoHoursBefore > 0) {
      await step.sleep('wait-for-2hour-reminder', delayUntilTwoHoursBefore)
    }

    await step.run('send-2hour-reminder', async () => {
      if (isProspectMode) {
        await sendProspectEmail({
          to: recipientEmail,
          toName: recipientFirstName,
          ownerName,
          ownerEmail,
          calendarLink,
          subject: `Starting in 2 hours — your call with ${ownerName}`,
          bodyLines: [
            `Hi ${recipientFirstName},`,
            ``,
            `Your call with ${ownerName} starts in about <strong>2 hours</strong> at ${demoTimeFormatted} CT.`,
            ``,
            `See you soon! If anything comes up, reply here and we'll make it work.`,
          ],
        })
        logger.info(`Sent prospect 2-hour reminder to ${recipientEmail}`)
        return { sent: true }
      }

      const hasResponded = await checkIfLeadResponded(leadId!)
      if (hasResponded) {
        logger.info('Lead responded, skipping 2-hour reminder')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId!, demoDate!, demoTime!, timezone!, {
        demoOwner: ownerName,
        demoOwnerEmail: ownerEmail,
        demoOwnerPhone: '(555) 123-4567',
        meetingLink: 'https://meet.google.com/demo-link', // FUTURE: Pull from calendar integration
      })

      await sendSequenceEmail({
        leadId: leadId!,
        enrollmentId: enrollment.id,
        emailType: 'demo-2hour-reminder',
        tokens,
        stepNumber: 3,
      })

      logger.info('Sent 2-hour reminder')
      return { sent: true }
    })

    if (!isProspectMode && leadId && await shouldExitSequence(leadId, enrollment.id)) {
      return await exitSequence(enrollment.id, 'lead-responded')
    }

    // ========================================================================
    // WAIT FOR DEMO TO COMPLETE
    // ========================================================================

    const dayAfterDemo = new Date(demoParsed)
    dayAfterDemo.setDate(dayAfterDemo.getDate() + 1)
    dayAfterDemo.setHours(9, 0, 0, 0) // Send at 9 AM

    const delayUntilDayAfter = Math.max(0, dayAfterDemo.getTime() - Date.now())

    if (delayUntilDayAfter > 0) {
      await step.sleep('wait-for-demo-completion', delayUntilDayAfter)
    }

    // ========================================================================
    // EMAIL 4: FOLLOW-UP (1 DAY AFTER DEMO)
    // ========================================================================

    await step.run('send-followup', async () => {
      if (isProspectMode) {
        await sendProspectEmail({
          to: recipientEmail,
          toName: recipientFirstName,
          ownerName,
          ownerEmail,
          calendarLink,
          subject: `Great talking yesterday — here's what's next`,
          bodyLines: [
            `Hi ${recipientFirstName},`,
            ``,
            `Really enjoyed our conversation yesterday. Cursive is already identifying visitors on sites like yours — the pixel takes 60 seconds to install and leads start appearing within minutes.`,
            ``,
            `<strong>Your next step:</strong> Sign up at <a href="${APP_URL}/welcome" style="color:#007AFF;">${APP_URL.replace('https://', '')}/welcome</a>, install the pixel, and your first identified visitors will show up in your dashboard automatically.`,
            ``,
            `Want me to get the pixel set up for you? Reply here and I'll send it over.`,
          ],
        })
        logger.info(`Sent prospect follow-up email to ${recipientEmail}`)
        return { sent: true }
      }

      const hasResponded = await checkIfLeadResponded(leadId!)
      const hasStartedTrial = await checkIfLeadStartedTrial(leadId!)

      if (hasResponded || hasStartedTrial) {
        logger.info('Lead converted, skipping follow-up')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId!, demoDate!, demoTime!, timezone!, {
        demoOwner: ownerName,
        demoOwnerEmail: ownerEmail,
        customFeature: 'AI-Powered Visitor Scoring',
        customFeatureDescription: 'Automatically prioritize high-intent visitors',
        estimatedVisitors: '7,000',
        monthlyTraffic: '10,000',
        estimatedLeads: '350',
        proposalLink: `https://app.meetcursive.com/proposals/${leadId}`,
        caseStudyLink: 'https://meetcursive.com/case-studies/saas-startup',
        similarCompany: 'TechFlow',
        caseStudyResult: '3x demo bookings in 90 days',
        trialLink: 'https://app.meetcursive.com/signup',
        implementationCallLink: 'https://cal.com/gotdarrenhill/30min',
        personalNote: "I loved your idea about targeting visitors by industry—let's make it happen!",
      })

      await sendSequenceEmail({
        leadId: leadId!,
        enrollmentId: enrollment.id,
        emailType: 'demo-followup',
        tokens,
        stepNumber: 4,
      })

      logger.info('Sent follow-up email')
      return { sent: true }
    })

    if (!isProspectMode && leadId && await shouldExitSequence(leadId, enrollment.id)) {
      return await exitSequence(enrollment.id, 'lead-converted')
    }

    // ========================================================================
    // EMAIL 5: CHECK-IN (3 DAYS AFTER EMAIL 4)
    // ========================================================================

    await step.sleep('wait-for-checkin', '3d')

    await step.run('send-checkin', async () => {
      if (isProspectMode) {
        await sendProspectEmail({
          to: recipientEmail,
          toName: recipientFirstName,
          ownerName,
          ownerEmail,
          calendarLink,
          subject: `Quick check-in — did you get a chance to install the pixel?`,
          bodyLines: [
            `Hi ${recipientFirstName},`,
            ``,
            `Just checking in — did you get a chance to try Cursive?`,
            ``,
            `Once the pixel is live, you'll see exactly who's visiting your site — name, email, company, and intent signals — all in real time. Most customers see their first leads within the first few hours of traffic.`,
            ``,
            `Happy to jump on a quick call to get it set up: <a href="${calendarLink}" style="color:#007AFF;">${calendarLink}</a>`,
          ],
        })
        logger.info(`Sent prospect check-in email to ${recipientEmail}`)
        return { sent: true }
      }

      const hasResponded = await checkIfLeadResponded(leadId!)
      const hasStartedTrial = await checkIfLeadStartedTrial(leadId!)

      if (hasResponded || hasStartedTrial) {
        logger.info('Lead converted, skipping check-in')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId!, demoDate!, demoTime!, timezone!, {
        demoOwner: ownerName,
        demoOwnerEmail: ownerEmail,
        caseStudyCompany: 'TechFlow',
        caseStudyLink: 'https://meetcursive.com/case-studies/techflow',
        calendarLink,
      })

      await sendSequenceEmail({
        leadId: leadId!,
        enrollmentId: enrollment.id,
        emailType: 'demo-checkin',
        tokens,
        stepNumber: 5,
      })

      logger.info('Sent check-in email')
      return { sent: true }
    })

    if (!isProspectMode && leadId && await shouldExitSequence(leadId, enrollment.id)) {
      return await exitSequence(enrollment.id, 'lead-re-engaged')
    }

    // ========================================================================
    // EMAIL 6: BREAKUP (4 DAYS AFTER EMAIL 5)
    // ========================================================================

    await step.sleep('wait-for-breakup', '4d')

    await step.run('send-breakup', async () => {
      if (isProspectMode) {
        await sendProspectEmail({
          to: recipientEmail,
          toName: recipientFirstName,
          ownerName,
          ownerEmail,
          calendarLink,
          subject: `Closing the loop — still interested in Cursive?`,
          bodyLines: [
            `Hi ${recipientFirstName},`,
            ``,
            `I don't want to keep filling your inbox, so this will be my last note for now.`,
            ``,
            `If you're ready to see what Cursive can do for your site, you can sign up here anytime: <a href="${APP_URL}/welcome" style="color:#007AFF;">${APP_URL.replace('https://', '')}/welcome</a>`,
            ``,
            `Or grab time with me when the timing is better: <a href="${calendarLink}" style="color:#007AFF;">${calendarLink}</a>`,
            ``,
            `Either way, I hope we get to work together down the road.`,
          ],
        })
        logger.info(`Sent prospect breakup email to ${recipientEmail}`)
        return { sent: true }
      }

      const hasResponded = await checkIfLeadResponded(leadId!)
      const hasStartedTrial = await checkIfLeadStartedTrial(leadId!)

      if (hasResponded || hasStartedTrial) {
        logger.info('Lead converted, skipping breakup')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId!, demoDate!, demoTime!, timezone!, {
        demoOwner: ownerName,
        demoOwnerEmail: ownerEmail,
        calendarLink,
        checkBackLink: `https://app.meetcursive.com/check-back?lead=${leadId}`,
        unsubscribeLink: `https://app.meetcursive.com/unsubscribe?lead=${leadId}`,
      })

      await sendSequenceEmail({
        leadId: leadId!,
        enrollmentId: enrollment.id,
        emailType: 'demo-breakup',
        tokens,
        stepNumber: 6,
      })

      logger.info('Sent breakup email')
      return { sent: true }
    })

    // ========================================================================
    // COMPLETE SEQUENCE
    // ========================================================================

    await step.run('complete-sequence', async () => {
      // Prospect mode: no DB enrollment to update
      if (isProspectMode) {
        logger.info('Prospect sequence completed')
        return { completed: true }
      }

      const supabase = createAdminClient()

      await supabase
        .from('sequence_enrollments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id)

      logger.info('Sequence completed')
    })

    return { success: true, completed: true }
  }
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// ============================================================================
// PROSPECT EMAIL HELPER (Cal booking mode — no DB lead lookup required)
// ============================================================================

/**
 * Send a simple transactional email to a Cal booking prospect.
 * Used in prospect mode where we have an email address but no DB lead record.
 */
async function sendProspectEmail({
  to,
  toName: _toName,
  ownerName,
  ownerEmail,
  calendarLink,
  subject,
  bodyLines,
}: {
  to: string
  toName: string
  ownerName: string
  ownerEmail: string
  calendarLink: string
  subject: string
  bodyLines: string[]
}) {
  const { sendEmail: sendResendEmail } = await import('@/lib/email/resend-client')

  const bodyHtml = bodyLines
    .map(line => line === '' ? '<br/>' : `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#111827;">${line}</p>`)
    .join('\n')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f4f4f5; }
    .wrapper { max-width:600px;margin:0 auto;background:#fff; }
    .body { padding:40px; }
    .sig { margin-top:32px;padding-top:24px;border-top:1px solid #e4e4e7;font-size:14px;color:#374151; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="body">
      ${bodyHtml}
      <div class="sig">
        <p style="margin:0 0 4px;">${ownerName}<br/>
        <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
        <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
          Questions? Reply here or grab time at
          <a href="${calendarLink}" style="color:#007AFF;">${calendarLink}</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = bodyLines.join('\n') + `\n\n— ${ownerName}\nCursive · https://meetcursive.com\n${calendarLink}`

  await sendResendEmail({
    to,
    from: `${ownerName} at Cursive <${ownerEmail}>`,
    subject,
    html,
    text,
  })
}

// ============================================================================
// LEGACY HELPERS (DB-backed lead mode)
// ============================================================================

/**
 * Build personalization tokens for email
 */
async function buildEmailTokens(
  leadId: string,
  demoDate: string,
  demoTime: string,
  timezone: string,
  additional: Partial<DemoSequenceTokens>
): Promise<DemoSequenceTokens> {
  const supabase = createAdminClient()

  const { data: lead } = await supabase
    .from('leads')
    .select('*, contact_data, company_data')
    .eq('id', leadId)
    .maybeSingle()

  if (!lead) throw new Error('Lead not found')

  const contactData = lead.contact_data as LeadContactData | null
  const companyData = lead.company_data as LeadCompanyData | null

  const firstName = contactData?.contacts?.[0]?.first_name || 'there'
  const companyName = companyData?.name || 'your company'

  // Format demo date
  const demoDateObj = new Date(demoDate)
  const demoDateFormatted = demoDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return {
    firstName,
    companyName,
    leadId,
    demoDate: demoDateFormatted,
    demoTime,
    timezone,
    demoDateRaw: demoDateObj,
    demoOwner: additional.demoOwner || 'Your Account Manager',
    demoOwnerTitle: 'Solutions Engineer',
    demoOwnerEmail: additional.demoOwnerEmail || 'demos@meetcursive.com',
    demoOwnerPhone: additional.demoOwnerPhone,
    calendarLink: additional.calendarLink || 'https://cal.com/gotdarrenhill/30min',
    rescheduleLink: additional.rescheduleLink || 'https://cal.com/gotdarrenhill/30min',
    meetingLink: additional.meetingLink || 'https://meet.google.com/demo',
    ...additional,
  }
}

/**
 * Send a sequence email with tracking
 */
async function sendSequenceEmail({
  leadId,
  enrollmentId,
  emailType,
  tokens,
  stepNumber,
}: {
  leadId: string
  enrollmentId: string
  emailType: DemoSequenceEmailType
  tokens: DemoSequenceTokens
  stepNumber: number
}) {
  const supabase = createAdminClient()

  // Get email template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('category', 'demo-sequence')
    .eq('name', emailType)
    .maybeSingle()

  if (!template) {
    throw new Error(`Email template not found: ${emailType}`)
  }

  // Merge tokens into template
  let subject = template.subject
  let bodyHtml = template.body_html
  let bodyText = template.body_text || ''

  for (const [key, value] of Object.entries(tokens)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
    subject = subject.replace(regex, String(value || ''))
    bodyHtml = bodyHtml.replace(regex, String(value || ''))
    bodyText = bodyText.replace(regex, String(value || ''))
  }

  // Get lead email
  const { data: lead } = await supabase
    .from('leads')
    .select('contact_data')
    .eq('id', leadId)
    .maybeSingle()

  const contactData = lead?.contact_data as LeadContactData | null
  const recipientEmail = contactData?.contacts?.[0]?.email || contactData?.email
  const recipientName = contactData?.contacts?.[0]?.full_name || tokens.firstName

  if (!recipientEmail) {
    throw new Error('No email address for lead')
  }

  // Send email
  await sendEmail(
    {
      to: recipientEmail,
      toName: recipientName,
      from: tokens.demoOwnerEmail,
      fromName: tokens.demoOwner,
      subject,
      bodyHtml,
      bodyText,
      trackOpens: true,
      trackClicks: true,
    },
    undefined,
    (lead as any).workspace_id
  )

  // Log action
  await supabase.from('sequence_action_log').insert({
    enrollment_id: enrollmentId,
    step_id: `demo-seq-step-${stepNumber}`,
    action_type: 'email_sent',
    action_result: 'success',
    action_metadata: {
      email_type: emailType,
      recipient: recipientEmail,
      subject,
    },
  })

  // Update enrollment step
  await supabase
    .from('sequence_enrollments')
    .update({ current_step: stepNumber })
    .eq('id', enrollmentId)
}

/**
 * Check if lead has responded
 */
async function checkIfLeadResponded(leadId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('lead_activities')
    .select('id')
    .eq('lead_id', leadId)
    .eq('activity_type', 'email_reply')
    .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1)

  return (data?.length || 0) > 0
}

/**
 * Check if lead has started trial
 */
async function checkIfLeadStartedTrial(leadId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('lead_activities')
    .select('id')
    .eq('lead_id', leadId)
    .eq('activity_type', 'trial_started')
    .limit(1)

  return (data?.length || 0) > 0
}

/**
 * Check if sequence should exit
 */
async function shouldExitSequence(leadId: string, _enrollmentId: string): Promise<boolean> {
  const hasResponded = await checkIfLeadResponded(leadId)
  const hasStartedTrial = await checkIfLeadStartedTrial(leadId)

  return hasResponded || hasStartedTrial
}

/**
 * Exit sequence with reason
 */
async function exitSequence(enrollmentId: string, reason: string) {
  const supabase = createAdminClient()

  await supabase
    .from('sequence_enrollments')
    .update({
      status: 'exited',
      exit_reason: reason,
      exited_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId)

  return { success: true, exited: true, reason }
}
