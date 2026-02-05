/**
 * Demo Nurture Sequence
 * Cursive Platform
 *
 * 6-email automated follow-up sequence for demo requests
 * Handles confirmation, reminders, follow-up, and breakup emails
 */

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/services/outreach/email-sender.service'
import type {
  DemoSequenceTokens,
  DemoSequenceEmailType,
  DemoSequenceEnrollmentData,
} from '@/lib/types/demo-sequence.types'

// ============================================================================
// MAIN SEQUENCE FUNCTION
// ============================================================================

export const demoNurtureSequence = inngest.createFunction(
  {
    id: 'demo-nurture-sequence',
    name: 'Demo Nurture Sequence',
    retries: 3,
    timeout: 300000, // 5 minutes per step
  },
  { event: 'demo/booked' },
  async ({ event, step, logger }) => {
    const {
      leadId,
      demoDate,
      demoTime,
      timezone,
      workspaceId,
      demoOwner,
      demoOwnerEmail,
    } = event.data as {
      leadId: string
      demoDate: string // ISO format
      demoTime: string
      timezone: string
      workspaceId: string
      demoOwner: string
      demoOwnerEmail: string
    }

    logger.info(`Starting demo sequence for lead ${leadId}`)

    // ========================================================================
    // STEP 1: CREATE ENROLLMENT
    // ========================================================================

    const enrollment = await step.run('create-enrollment', async () => {
      const supabase = await createClient()

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('sequence_enrollments')
        .select('id, status')
        .eq('lead_id', leadId)
        .eq('sequence_id', 'demo-nurture-v1') // Use consistent ID
        .single()

      if (existing?.status === 'active') {
        throw new Error('Lead already enrolled in demo sequence')
      }

      // Create enrollment
      const { data, error } = await supabase
        .from('sequence_enrollments')
        .insert({
          lead_id: leadId,
          sequence_id: 'demo-nurture-v1',
          workspace_id: workspaceId,
          status: 'active',
          current_step: 1,
          metadata: {
            demo_date: demoDate,
            demo_time: demoTime,
            timezone,
            demo_owner: demoOwner,
          },
        })
        .select()
        .single()

      if (error) throw error

      logger.info(`Created enrollment ${data.id}`)
      return data
    })

    // ========================================================================
    // EMAIL 1: CONFIRMATION (IMMEDIATE)
    // ========================================================================

    await step.run('send-confirmation', async () => {
      const hasResponded = await checkIfLeadResponded(leadId)
      if (hasResponded) {
        logger.info('Lead responded, skipping confirmation')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId, demoDate, demoTime, timezone, {
        demoOwner,
        demoOwnerEmail,
      })

      await sendSequenceEmail({
        leadId,
        enrollmentId: enrollment.id,
        emailType: 'demo-confirmation',
        tokens,
        stepNumber: 1,
      })

      logger.info('Sent confirmation email')
      return { sent: true }
    })

    // Check for exit conditions
    if (await shouldExitSequence(leadId, enrollment.id)) {
      return await exitSequence(enrollment.id, 'lead-responded')
    }

    // ========================================================================
    // EMAIL 2: 1-DAY BEFORE REMINDER
    // ========================================================================

    const demoParsed = new Date(demoDate)
    const oneDayBefore = new Date(demoParsed)
    oneDayBefore.setDate(oneDayBefore.getDate() - 1)
    oneDayBefore.setHours(9, 0, 0, 0) // Send at 9 AM

    const delayUntilOneDayBefore = Math.max(0, oneDayBefore.getTime() - Date.now())

    if (delayUntilOneDayBefore > 0) {
      await step.sleep('wait-for-1day-reminder', delayUntilOneDayBefore)
    }

    await step.run('send-1day-reminder', async () => {
      const hasResponded = await checkIfLeadResponded(leadId)
      if (hasResponded) {
        logger.info('Lead responded, skipping 1-day reminder')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId, demoDate, demoTime, timezone, {
        demoOwner,
        demoOwnerEmail,
        demoOwnerPhone: '(555) 123-4567', // TODO: Pull from workspace settings
      })

      await sendSequenceEmail({
        leadId,
        enrollmentId: enrollment.id,
        emailType: 'demo-1day-reminder',
        tokens,
        stepNumber: 2,
      })

      logger.info('Sent 1-day reminder')
      return { sent: true }
    })

    if (await shouldExitSequence(leadId, enrollment.id)) {
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
      const hasResponded = await checkIfLeadResponded(leadId)
      if (hasResponded) {
        logger.info('Lead responded, skipping 2-hour reminder')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId, demoDate, demoTime, timezone, {
        demoOwner,
        demoOwnerEmail,
        demoOwnerPhone: '(555) 123-4567',
        meetingLink: 'https://meet.google.com/demo-link', // TODO: Pull from demo booking
      })

      await sendSequenceEmail({
        leadId,
        enrollmentId: enrollment.id,
        emailType: 'demo-2hour-reminder',
        tokens,
        stepNumber: 3,
      })

      logger.info('Sent 2-hour reminder')
      return { sent: true }
    })

    if (await shouldExitSequence(leadId, enrollment.id)) {
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
      const hasResponded = await checkIfLeadResponded(leadId)
      const hasStartedTrial = await checkIfLeadStartedTrial(leadId)

      if (hasResponded || hasStartedTrial) {
        logger.info('Lead converted, skipping follow-up')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId, demoDate, demoTime, timezone, {
        demoOwner,
        demoOwnerEmail,
        // Email 4 specific tokens
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
        implementationCallLink: 'https://cal.com/adamwolfe/implementation',
        personalNote: "I loved your idea about targeting visitors by industry—let's make it happen!",
      })

      await sendSequenceEmail({
        leadId,
        enrollmentId: enrollment.id,
        emailType: 'demo-followup',
        tokens,
        stepNumber: 4,
      })

      logger.info('Sent follow-up email')
      return { sent: true }
    })

    if (await shouldExitSequence(leadId, enrollment.id)) {
      return await exitSequence(enrollment.id, 'lead-converted')
    }

    // ========================================================================
    // EMAIL 5: CHECK-IN (3 DAYS AFTER EMAIL 4)
    // ========================================================================

    await step.sleep('wait-for-checkin', '3d')

    await step.run('send-checkin', async () => {
      const hasResponded = await checkIfLeadResponded(leadId)
      const hasStartedTrial = await checkIfLeadStartedTrial(leadId)

      if (hasResponded || hasStartedTrial) {
        logger.info('Lead converted, skipping check-in')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId, demoDate, demoTime, timezone, {
        demoOwner,
        demoOwnerEmail,
        caseStudyCompany: 'TechFlow',
        caseStudyLink: 'https://meetcursive.com/case-studies/techflow',
        calendarLink: 'https://cal.com/adamwolfe/quick-call',
      })

      await sendSequenceEmail({
        leadId,
        enrollmentId: enrollment.id,
        emailType: 'demo-checkin',
        tokens,
        stepNumber: 5,
      })

      logger.info('Sent check-in email')
      return { sent: true }
    })

    if (await shouldExitSequence(leadId, enrollment.id)) {
      return await exitSequence(enrollment.id, 'lead-re-engaged')
    }

    // ========================================================================
    // EMAIL 6: BREAKUP (4 DAYS AFTER EMAIL 5)
    // ========================================================================

    await step.sleep('wait-for-breakup', '4d')

    await step.run('send-breakup', async () => {
      const hasResponded = await checkIfLeadResponded(leadId)
      const hasStartedTrial = await checkIfLeadStartedTrial(leadId)

      if (hasResponded || hasStartedTrial) {
        logger.info('Lead converted, skipping breakup')
        return { skipped: true }
      }

      const tokens = await buildEmailTokens(leadId, demoDate, demoTime, timezone, {
        demoOwner,
        demoOwnerEmail,
        calendarLink: 'https://cal.com/adamwolfe/quick-call',
        checkBackLink: `https://app.meetcursive.com/check-back?lead=${leadId}`,
        unsubscribeLink: `https://app.meetcursive.com/unsubscribe?lead=${leadId}`,
      })

      await sendSequenceEmail({
        leadId,
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
      const supabase = await createClient()

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
  const supabase = await createClient()

  const { data: lead } = await supabase
    .from('leads')
    .select('*, contact_data, company_data')
    .eq('id', leadId)
    .single()

  if (!lead) throw new Error('Lead not found')

  const contactData = lead.contact_data as any
  const companyData = lead.company_data as any

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
    calendarLink: additional.calendarLink || 'https://cal.com/cursive/demo',
    rescheduleLink: additional.rescheduleLink || 'https://cal.com/cursive/reschedule',
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
  const supabase = await createClient()

  // Get email template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('category', 'demo-sequence')
    .eq('name', emailType)
    .single()

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
    .single()

  const contactData = lead?.contact_data as any
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
    null,
    lead.workspace_id
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
  const supabase = await createClient()

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
  const supabase = await createClient()

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
async function shouldExitSequence(leadId: string, enrollmentId: string): Promise<boolean> {
  const hasResponded = await checkIfLeadResponded(leadId)
  const hasStartedTrial = await checkIfLeadStartedTrial(leadId)

  return hasResponded || hasStartedTrial
}

/**
 * Exit sequence with reason
 */
async function exitSequence(enrollmentId: string, reason: string) {
  const supabase = await createClient()

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
