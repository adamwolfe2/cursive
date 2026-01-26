// Campaign Email Composition
// Composes personalized emails for campaign leads

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { emailComposerService } from '@/lib/services/composition/email-composer.service'
import { assignVariant, getAssignedVariant, type Variant } from '@/lib/services/campaign/ab-testing.service'

export const composeCampaignEmail = inngest.createFunction(
  {
    id: 'campaign-compose-email',
    name: 'Campaign Email Composition',
    retries: 3,
    throttle: {
      limit: 20,
      period: '1m',
    },
  },
  { event: 'campaign/compose-email' },
  async ({ event, step, logger }) => {
    const { campaign_lead_id, campaign_id, lead_id, workspace_id } = event.data
    // Optional: sequence_step and auto_send from sequence processor
    const sequenceStep = (event.data as any).sequence_step
    const autoSend = (event.data as any).auto_send ?? false

    // Step 1: Fetch all required data
    const { campaignLead, campaign, lead, templates, workspace } = await step.run(
      'fetch-data',
      async () => {
        const supabase = await createClient()

        const [
          campaignLeadResult,
          campaignResult,
          leadResult,
          templatesResult,
          workspaceResult,
        ] = await Promise.all([
          supabase
            .from('campaign_leads')
            .select('*')
            .eq('id', campaign_lead_id)
            .single(),
          supabase
            .from('email_campaigns')
            .select('*')
            .eq('id', campaign_id)
            .single(),
          supabase.from('leads').select('*').eq('id', lead_id).single(),
          supabase
            .from('email_templates')
            .select('*')
            .eq('workspace_id', workspace_id)
            .eq('is_active', true),
          supabase
            .from('workspaces')
            .select('name, sales_co_settings')
            .eq('id', workspace_id)
            .single(),
        ])

        if (campaignLeadResult.error) {
          throw new Error(`Failed to fetch campaign lead: ${campaignLeadResult.error.message}`)
        }
        if (campaignResult.error) {
          throw new Error(`Failed to fetch campaign: ${campaignResult.error.message}`)
        }
        if (leadResult.error) {
          throw new Error(`Failed to fetch lead: ${leadResult.error.message}`)
        }

        return {
          campaignLead: campaignLeadResult.data,
          campaign: campaignResult.data,
          lead: leadResult.data,
          templates: templatesResult.data || [],
          workspace: workspaceResult.data,
        }
      }
    )

    logger.info(
      `Composing email for campaign lead ${campaign_lead_id}, step ${campaignLead.current_step + 1}`
    )

    // Step 2: Check for A/B test variants
    const variant = await step.run('check-variant', async () => {
      // First check if already assigned
      let assigned = await getAssignedVariant(campaign_lead_id)

      if (!assigned) {
        // Try to assign a variant if variants exist for this campaign
        assigned = await assignVariant(campaign_lead_id, campaign_id)
      }

      return assigned
    })

    // Step 3: Filter templates based on campaign settings
    const availableTemplates = await step.run('filter-templates', async () => {
      const selectedIds = campaign.selected_template_ids as string[] | null

      if (selectedIds && selectedIds.length > 0) {
        return templates.filter((t: any) => selectedIds.includes(t.id))
      }

      return templates
    })

    // If we have a variant, use its templates; otherwise fall back to regular templates
    const useVariantTemplates = variant !== null

    if (!useVariantTemplates && availableTemplates.length === 0) {
      logger.warn('No templates available for composition')
      return {
        success: false,
        error: 'No templates available',
        campaign_lead_id,
      }
    }

    // Step 4: Select best template (or use variant template)
    const selectedTemplate = await step.run('select-template', async () => {
      // If using a variant, create a pseudo-template from the variant
      if (variant) {
        return {
          id: variant.id,
          name: `${variant.name} (Variant ${variant.variantKey})`,
          subject_template: variant.subjectTemplate,
          body_template: variant.bodyTemplate,
          is_variant: true,
        }
      }

      // Otherwise use normal template selection
      const enrichedLead = { ...lead, lead: campaignLead }
      return emailComposerService.selectTemplate(
        availableTemplates,
        lead,
        campaign,
        campaignLead.current_step + 1
      )
    })

    logger.info(`Selected template: ${selectedTemplate.name}${useVariantTemplates ? ' (A/B variant)' : ''}`)

    // Step 5: Compose the email
    const composedEmail = await step.run('compose-email', async () => {
      // Get sender info from workspace settings
      const settings = workspace?.sales_co_settings as any || {}
      const senderName = settings.default_sender_name || 'Sales Team'
      const senderTitle = settings.default_sender_title
      const senderCompany = workspace?.name

      return emailComposerService.composeEmail({
        campaignLead: { ...campaignLead, lead },
        campaign,
        template: selectedTemplate,
        senderName,
        senderTitle,
        senderCompany,
      })
    })

    // Step 6: Create email_sends record (pending approval)
    const emailSend = await step.run('create-email-send', async () => {
      const supabase = await createClient()

      const insertData: Record<string, any> = {
        workspace_id,
        campaign_id,
        template_id: (selectedTemplate as any).is_variant ? null : selectedTemplate.id,
        lead_id,
        recipient_email: lead.email,
        recipient_name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        subject: composedEmail.subject,
        body_html: composedEmail.body_html,
        body_text: composedEmail.body_text,
        status: 'pending_approval', // Requires human review
        step_number: campaignLead.current_step + 1,
        composition_metadata: {
          ...composedEmail.metadata,
          variant_used: variant ? variant.variantKey : null,
        },
      }

      // Add variant tracking if using A/B test
      if (variant) {
        insertData.variant_id = variant.id
      }

      const { data, error } = await supabase
        .from('email_sends')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create email send record: ${error.message}`)
      }

      return data
    })

    // Step 7: Update campaign lead status
    await step.run('update-campaign-lead', async () => {
      const supabase = await createClient()

      await supabase
        .from('campaign_leads')
        .update({
          status: 'awaiting_approval',
        })
        .eq('id', campaign_lead_id)
    })

    logger.info(
      `Email composed for campaign lead ${campaign_lead_id}, awaiting approval (email_send_id: ${emailSend.id})`
    )

    // Step 7: Emit email-composed event for auto-send handling
    const currentStep = sequenceStep || campaignLead.current_step + 1
    await step.run('emit-composed-event', async () => {
      await inngest.send({
        name: 'campaign/email-composed',
        data: {
          email_send_id: emailSend.id,
          campaign_lead_id,
          campaign_id,
          workspace_id,
          sequence_step: currentStep,
          auto_send: autoSend,
        },
      })
    })

    return {
      success: true,
      campaign_lead_id,
      email_send_id: emailSend.id,
      template_used: selectedTemplate.name,
      subject: composedEmail.subject,
      sequence_step: currentStep,
      auto_send: autoSend,
    }
  }
)

// Batch compose emails for all ready leads
export const batchComposeCampaignEmails = inngest.createFunction(
  {
    id: 'batch-campaign-compose',
    name: 'Batch Campaign Email Composition',
    retries: 2,
  },
  { event: 'campaign/batch-compose' },
  async ({ event, step, logger }) => {
    const { campaign_id, workspace_id } = event.data

    // Fetch all ready leads
    const readyLeads = await step.run('fetch-ready-leads', async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('campaign_leads')
        .select('id, lead_id')
        .eq('campaign_id', campaign_id)
        .eq('status', 'ready')
        .limit(50)

      if (error) {
        throw new Error(`Failed to fetch ready leads: ${error.message}`)
      }

      return data || []
    })

    logger.info(`Found ${readyLeads.length} ready leads for composition`)

    // Send individual composition events
    await step.run('send-compose-events', async () => {
      const events = readyLeads.map((cl) => ({
        name: 'campaign/compose-email' as const,
        data: {
          campaign_lead_id: cl.id,
          campaign_id,
          lead_id: cl.lead_id,
          workspace_id,
        },
      }))

      if (events.length > 0) {
        await inngest.send(events)
      }
    })

    return {
      success: true,
      campaign_id,
      leads_queued: readyLeads.length,
    }
  }
)
