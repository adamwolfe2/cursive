/**
 * Email Sequence Processing
 * Cursive Platform
 *
 * Handles automated email sequence execution:
 * - Enrollment processing
 * - Step execution with delays
 * - Conditional branching
 * - Open/click tracking integration
 */

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, logSentEmail } from '@/lib/services/outreach/email-sender.service'
import { generateSalesEmail } from '@/lib/services/ai/claude.service'

// ============================================================================
// TYPES
// ============================================================================

interface SequenceEnrollmentData {
  enrollment_id: string
  sequence_id: string
  lead_id: string
  workspace_id: string
}

interface SequenceStep {
  id: string
  step_number: number
  step_type: 'email' | 'wait' | 'condition' | 'action'
  subject_template: string | null
  body_template: string | null
  delay_hours: number
  delay_type: string
  condition_config: any
  is_active: boolean
}

// ============================================================================
// ENROLLMENT PROCESSOR
// ============================================================================

export const processSequenceEnrollment = inngest.createFunction(
  {
    id: 'sequence-enrollment-process',
    name: 'Process Sequence Enrollment',
    retries: 3,
  },
  { event: 'sequence/enroll' },
  async ({ event, step, logger }) => {
    const { lead_id, sequence_id, workspace_id } = event.data as {
      lead_id: string
      sequence_id: string
      workspace_id: string
    }

    // Step 1: Create enrollment record
    const enrollment = await step.run('create-enrollment', async () => {
      const supabase = await createClient()

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('email_sequence_enrollments')
        .select('id, status')
        .eq('sequence_id', sequence_id)
        .eq('lead_id', lead_id)
        .single()

      if (existing) {
        if (existing.status === 'active') {
          throw new Error('Lead already enrolled in this sequence')
        }
        // Re-enroll if not active
        const { data, error } = await supabase
          .from('email_sequence_enrollments')
          .update({
            status: 'active',
            current_step: 1,
            enrolled_at: new Date().toISOString(),
            completed_at: null,
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      }

      // Create new enrollment
      const { data, error } = await supabase
        .from('email_sequence_enrollments')
        .insert({
          sequence_id,
          lead_id,
          workspace_id,
          status: 'active',
          current_step: 1,
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    logger.info(`Enrolled lead ${lead_id} in sequence ${sequence_id}`)

    // Step 2: Schedule first step
    await step.run('schedule-first-step', async () => {
      await inngest.send({
        name: 'sequence/process-step',
        data: {
          enrollment_id: enrollment.id,
          sequence_id,
          lead_id,
          workspace_id,
          step_number: 1,
        },
      })
    })

    return { success: true, enrollment_id: enrollment.id }
  }
)

// ============================================================================
// STEP PROCESSOR
// ============================================================================

export const processSequenceStep = inngest.createFunction(
  {
    id: 'sequence-step-process',
    name: 'Process Sequence Step',
    retries: 3,
  },
  { event: 'sequence/process-step' },
  async ({ event, step, logger }) => {
    const { enrollment_id, sequence_id, lead_id, workspace_id, step_number } = event.data as {
      enrollment_id: string
      sequence_id: string
      lead_id: string
      workspace_id: string
      step_number: number
    }

    // Step 1: Check enrollment status
    const { enrollment, sequenceStep, lead } = await step.run('fetch-data', async () => {
      const supabase = await createClient()

      const [enrollmentResult, stepResult, leadResult] = await Promise.all([
        supabase
          .from('email_sequence_enrollments')
          .select('*')
          .eq('id', enrollment_id)
          .single(),
        supabase
          .from('email_sequence_steps')
          .select('*')
          .eq('sequence_id', sequence_id)
          .eq('step_number', step_number)
          .eq('is_active', true)
          .single(),
        supabase
          .from('leads')
          .select('*, contact_data, company_data')
          .eq('id', lead_id)
          .single(),
      ])

      return {
        enrollment: enrollmentResult.data,
        sequenceStep: stepResult.data as SequenceStep | null,
        lead: leadResult.data,
      }
    })

    // Check if enrollment is still active
    if (!enrollment || enrollment.status !== 'active') {
      logger.info(`Enrollment ${enrollment_id} is not active, skipping`)
      return { success: true, skipped: true, reason: 'Enrollment not active' }
    }

    // Check if step exists
    if (!sequenceStep) {
      // No more steps, complete the sequence
      await step.run('complete-sequence', async () => {
        const supabase = await createClient()
        await supabase
          .from('email_sequence_enrollments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', enrollment_id)
      })

      logger.info(`Sequence completed for enrollment ${enrollment_id}`)
      return { success: true, completed: true }
    }

    // Step 2: Execute the step based on type
    const stepResult = await step.run(`execute-step-${sequenceStep.step_type}`, async () => {
      switch (sequenceStep.step_type) {
        case 'email':
          return await executeEmailStep(
            sequenceStep,
            lead,
            workspace_id,
            enrollment_id
          )

        case 'wait':
          return await executeWaitStep(sequenceStep)

        case 'condition':
          return await executeConditionStep(sequenceStep, lead, enrollment)

        case 'action':
          return await executeActionStep(sequenceStep, lead, workspace_id)

        default:
          return { success: false, error: `Unknown step type: ${sequenceStep.step_type}` }
      }
    })

    if (!stepResult.success) {
      logger.error(`Step ${step_number} failed: ${stepResult.error}`)

      // Mark as failed if email bounced
      if (stepResult.bounced) {
        await step.run('mark-bounced', async () => {
          const supabase = await createClient()
          await supabase
            .from('email_sequence_enrollments')
            .update({ status: 'bounced' })
            .eq('id', enrollment_id)
        })
        return { success: false, bounced: true }
      }

      // Otherwise, let retry handle it
      throw new Error(stepResult.error || 'Step execution failed')
    }

    // Step 3: Schedule next step
    await step.run('schedule-next-step', async () => {
      const supabase = await createClient()

      // Update current step
      await supabase
        .from('email_sequence_enrollments')
        .update({ current_step: step_number + 1 })
        .eq('id', enrollment_id)

      // Get next step to check for delay
      const { data: nextStep } = await supabase
        .from('email_sequence_steps')
        .select('delay_hours, delay_type')
        .eq('sequence_id', sequence_id)
        .eq('step_number', step_number + 1)
        .eq('is_active', true)
        .single()

      if (nextStep) {
        const delayMs = (nextStep.delay_hours || 0) * 60 * 60 * 1000
        const nextStepAt = new Date(Date.now() + delayMs)

        // Update next_step_at
        await supabase
          .from('email_sequence_enrollments')
          .update({ next_step_at: nextStepAt.toISOString() })
          .eq('id', enrollment_id)

        // Schedule with delay
        if (delayMs > 0) {
          await inngest.send({
            name: 'sequence/process-step',
            data: {
              enrollment_id,
              sequence_id,
              lead_id,
              workspace_id,
              step_number: step_number + 1,
            },
            // Inngest handles delays
            ts: nextStepAt.getTime(),
          })
        } else {
          // No delay, process immediately
          await inngest.send({
            name: 'sequence/process-step',
            data: {
              enrollment_id,
              sequence_id,
              lead_id,
              workspace_id,
              step_number: step_number + 1,
            },
          })
        }
      }
    })

    return { success: true, step_number, step_type: sequenceStep.step_type }
  }
)

// ============================================================================
// STEP EXECUTORS
// ============================================================================

async function executeEmailStep(
  sequenceStep: SequenceStep,
  lead: any,
  workspaceId: string,
  enrollmentId: string
): Promise<{ success: boolean; error?: string; bounced?: boolean }> {
  const contactData = lead.contact_data as any
  const companyData = lead.company_data as any

  // Get recipient email
  const recipientEmail = contactData?.contacts?.[0]?.email || contactData?.primary_contact?.email
  const recipientName = contactData?.contacts?.[0]?.full_name || contactData?.primary_contact?.full_name

  if (!recipientEmail) {
    return { success: false, error: 'No email address for lead' }
  }

  // Get workspace info for sender
  const supabase = await createClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .single()

  // Get primary email account
  const { data: emailAccount } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_primary', true)
    .single()

  const senderEmail = emailAccount?.email_address || process.env.DEFAULT_FROM_EMAIL || 'noreply@cursive.io'
  const senderName = emailAccount?.display_name || workspace?.name || 'Cursive'

  // Parse template variables
  const variables = {
    first_name: contactData?.contacts?.[0]?.first_name || recipientName?.split(' ')[0] || 'there',
    last_name: contactData?.contacts?.[0]?.last_name || '',
    full_name: recipientName || 'there',
    company: companyData?.name || 'your company',
    title: contactData?.contacts?.[0]?.title || '',
    industry: companyData?.industry || '',
    sender_name: senderName,
    sender_company: workspace?.name || 'Cursive',
  }

  let subject = sequenceStep.subject_template || 'Following up'
  let body = sequenceStep.body_template || ''

  // Replace variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
    subject = subject.replace(regex, value || '')
    body = body.replace(regex, value || '')
  }

  // If body is empty, generate with AI
  if (!body.trim()) {
    try {
      const emailDraft = await generateSalesEmail({
        senderName,
        senderCompany: workspace?.name || 'Cursive',
        senderProduct: 'our services',
        recipientName: variables.full_name,
        recipientTitle: variables.title,
        recipientCompany: variables.company,
        recipientIndustry: variables.industry,
        valueProposition: 'We help businesses like yours grow',
        callToAction: 'Would you be open to a quick call this week?',
        tone: 'professional',
      })

      subject = emailDraft.subject
      body = emailDraft.body
    } catch (error) {
      return { success: false, error: 'Failed to generate email content' }
    }
  }

  // Send the email
  const sendResult = await sendEmail(
    {
      to: recipientEmail,
      toName: recipientName,
      from: senderEmail,
      fromName: senderName,
      subject,
      bodyHtml: body.replace(/\n/g, '<br>'),
      bodyText: body,
      trackOpens: true,
      trackClicks: true,
    },
    emailAccount?.id,
    workspaceId
  )

  // Log the sent email
  await logSentEmail(
    workspaceId,
    lead.id,
    emailAccount?.id || null,
    {
      to: recipientEmail,
      toName: recipientName,
      from: senderEmail,
      fromName: senderName,
      subject,
      bodyHtml: body.replace(/\n/g, '<br>'),
      bodyText: body,
    },
    sendResult,
    enrollmentId
  )

  if (!sendResult.success) {
    // Check if it's a bounce
    if (sendResult.error?.toLowerCase().includes('bounce')) {
      return { success: false, error: sendResult.error, bounced: true }
    }
    return { success: false, error: sendResult.error }
  }

  return { success: true }
}

async function executeWaitStep(
  sequenceStep: SequenceStep
): Promise<{ success: boolean; error?: string }> {
  // Wait steps are handled by scheduling, just return success
  return { success: true }
}

async function executeConditionStep(
  sequenceStep: SequenceStep,
  lead: any,
  enrollment: any
): Promise<{ success: boolean; error?: string; skipToStep?: number }> {
  const config = sequenceStep.condition_config

  if (!config) {
    return { success: true }
  }

  // Evaluate conditions
  // This is a simplified version - production would have more complex logic
  const conditions = config.conditions || []

  for (const condition of conditions) {
    let conditionMet = false

    switch (condition.type) {
      case 'email_opened':
        // Check if any previous email in sequence was opened
        const supabase = await createClient()
        const { data: openedEmails } = await supabase
          .from('sent_emails')
          .select('id')
          .eq('sequence_enrollment_id', enrollment.id)
          .not('opened_at', 'is', null)
          .limit(1)

        conditionMet = (openedEmails?.length || 0) > 0
        break

      case 'email_clicked':
        const { data: clickedEmails } = await (await createClient())
          .from('sent_emails')
          .select('id')
          .eq('sequence_enrollment_id', enrollment.id)
          .not('clicked_at', 'is', null)
          .limit(1)

        conditionMet = (clickedEmails?.length || 0) > 0
        break

      case 'lead_score_above':
        conditionMet = (lead.qualification_score || 0) >= (condition.value || 0)
        break

      default:
        conditionMet = true
    }

    if (conditionMet && condition.then_skip_to) {
      return { success: true, skipToStep: condition.then_skip_to }
    }
  }

  return { success: true }
}

async function executeActionStep(
  sequenceStep: SequenceStep,
  lead: any,
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  const config = sequenceStep.condition_config

  if (!config || !config.action) {
    return { success: true }
  }

  const supabase = await createClient()

  switch (config.action) {
    case 'add_tag':
      if (config.tag_id) {
        await supabase.from('lead_tags').insert({
          lead_id: lead.id,
          tag_id: config.tag_id,
        }).onConflict('lead_id,tag_id').ignore()
      }
      break

    case 'update_status':
      if (config.status) {
        await supabase
          .from('leads')
          .update({ enrichment_status: config.status })
          .eq('id', lead.id)
      }
      break

    case 'notify_team':
      // Send notification (could trigger Slack/email notification)
      await supabase.from('lead_activities').insert({
        lead_id: lead.id,
        workspace_id: workspaceId,
        activity_type: 'note_added',
        description: config.message || 'Sequence action triggered notification',
      })
      break

    case 'update_score':
      if (config.score_adjustment) {
        await supabase
          .from('leads')
          .update({
            qualification_score: Math.max(
              0,
              Math.min(100, (lead.qualification_score || 50) + config.score_adjustment)
            ),
          })
          .eq('id', lead.id)
      }
      break
  }

  return { success: true }
}

// ============================================================================
// BATCH ENROLLMENT
// ============================================================================

export const batchEnrollSequence = inngest.createFunction(
  {
    id: 'sequence-batch-enroll',
    name: 'Batch Enroll in Sequence',
    retries: 2,
  },
  { event: 'sequence/batch-enroll' },
  async ({ event, step, logger }) => {
    const { sequence_id, lead_ids, workspace_id } = event.data as {
      sequence_id: string
      lead_ids: string[]
      workspace_id: string
    }

    logger.info(`Batch enrolling ${lead_ids.length} leads in sequence ${sequence_id}`)

    let enrolled = 0
    let failed = 0

    await step.run('enroll-leads', async () => {
      for (const leadId of lead_ids) {
        try {
          await inngest.send({
            name: 'sequence/enroll',
            data: {
              lead_id: leadId,
              sequence_id,
              workspace_id,
            },
          })
          enrolled++
        } catch (error) {
          failed++
        }
      }
    })

    return { success: true, enrolled, failed, total: lead_ids.length }
  }
)

// ============================================================================
// SCHEDULED STEP PROCESSOR
// ============================================================================

export const processScheduledSteps = inngest.createFunction(
  {
    id: 'sequence-scheduled-processor',
    name: 'Process Scheduled Sequence Steps',
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step, logger }) => {
    const enrollments = await step.run('fetch-due-enrollments', async () => {
      const supabase = await createClient()

      const { data } = await supabase
        .from('email_sequence_enrollments')
        .select('id, sequence_id, lead_id, workspace_id, current_step')
        .eq('status', 'active')
        .lte('next_step_at', new Date().toISOString())
        .limit(100)

      return data || []
    })

    logger.info(`Found ${enrollments.length} enrollments due for processing`)

    let processed = 0

    await step.run('trigger-steps', async () => {
      for (const enrollment of enrollments) {
        await inngest.send({
          name: 'sequence/process-step',
          data: {
            enrollment_id: enrollment.id,
            sequence_id: enrollment.sequence_id,
            lead_id: enrollment.lead_id,
            workspace_id: enrollment.workspace_id,
            step_number: enrollment.current_step,
          },
        })
        processed++
      }
    })

    return { success: true, processed }
  }
)
