// Campaign Email Composition
// Composes personalized emails for campaign leads

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailComposerService } from '@/lib/services/composition/email-composer.service'
import { assignVariant, getAssignedVariant } from '@/lib/services/campaign/ab-testing.service'
import { generateSalesEmail } from '@/lib/services/ai/claude.service'
import { findGmailAccountForWorkspace } from '@/lib/services/gmail/email-account.service'

export const composeCampaignEmail = inngest.createFunction(
  {
    id: 'campaign-compose-email',
    name: 'Campaign Email Composition',
    retries: 3,
    timeouts: { finish: "5m" },
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
        const supabase = createAdminClient()

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
            .maybeSingle(),
          supabase
            .from('email_campaigns')
            .select('*')
            .eq('id', campaign_id)
            .maybeSingle(),
          supabase.from('leads').select('*').eq('id', lead_id).maybeSingle(),
          supabase
            .from('email_templates')
            .select('*')
            .eq('workspace_id', workspace_id)
            .eq('is_active', true)
            .limit(1000),
          supabase
            .from('workspaces')
            .select('name, sales_co_settings')
            .eq('id', workspace_id)
            .maybeSingle(),
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

    if (!campaignLead || !campaign || !lead) {
      logger.warn(`[campaign-compose] Required data missing — lead:${!!lead} campaign:${!!campaign} campaignLead:${!!campaignLead}`)
      return { success: false, error: 'Required data not found', campaign_lead_id }
    }

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

    // Outbound-agent campaigns intentionally have no templates — they generate
    // each email fresh via Claude using the agent's icp/persona/product/tone.
    // Detect that case and skip the "no templates" failure.
    const isOutboundAgentCampaign = (campaign as { is_outbound_agent?: boolean })?.is_outbound_agent === true

    if (!useVariantTemplates && availableTemplates.length === 0 && !isOutboundAgentCampaign) {
      logger.warn('No templates available for composition')
      return {
        success: false,
        error: 'No templates available',
        campaign_lead_id,
      }
    }

    // Phase 2 safety: outbound-agent drafts must be pinned to a connected
    // Gmail account at compose time. If none exists (e.g. user disconnected
    // mid-run), pause the campaign_lead and exit cleanly — no draft created.
    let outboundEmailAccountId: string | null = null
    if (isOutboundAgentCampaign) {
      outboundEmailAccountId = await step.run('lookup-gmail-account', async () => {
        const gmailAcc = await findGmailAccountForWorkspace(workspace_id)
        return gmailAcc?.id ?? null
      })
      if (!outboundEmailAccountId) {
        await step.run('pause-lead-no-gmail', async () => {
          const supabase = createAdminClient()
          await supabase
            .from('campaign_leads')
            .update({ status: 'paused' })
            .eq('id', campaign_lead_id)
        })
        logger.warn(
          `[outbound] Skipped lead ${lead_id} for campaign ${campaign_id}: no Gmail account connected for workspace ${workspace_id}. Lead paused.`
        )
        return {
          success: false,
          error: 'no_gmail_account_connected',
          campaign_lead_id,
        }
      }
    }

    // Step 4: Select best template (or generate via AI for outbound agent)
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

      // Outbound-agent fallback: synthesize a one-off "template" by calling
      // generateSalesEmail() with the agent's icp/persona/product/tone.
      // The composer step below will then run its variable interpolation against it.
      if (isOutboundAgentCampaign && availableTemplates.length === 0) {
        const supabase = createAdminClient()
        const { data: agent } = await supabase
          .from('agents')
          .select('id, name, tone, icp_text, persona_text, product_text')
          .eq('id', campaign.agent_id)
          .maybeSingle()

        const tone = ((agent?.tone as string) || 'professional') as 'professional' | 'casual' | 'friendly' | 'urgent'
        const icpText = (agent as any)?.icp_text || ''
        const personaText = (agent as any)?.persona_text || ''
        const productText = (agent as any)?.product_text || campaign.description || 'our solution'

        const senderName = (workspace?.sales_co_settings as any)?.default_sender_name || 'Sales Team'
        const senderCompany = workspace?.name || 'Our Company'

        const draft = await generateSalesEmail({
          senderName,
          senderCompany,
          senderProduct: productText,
          recipientName: (lead.full_name as string) || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'there',
          recipientTitle: (lead.job_title as string) || 'Decision Maker',
          recipientCompany: (lead.company_name as string) || 'your company',
          recipientIndustry: (lead.company_industry as string) || undefined,
          valueProposition: personaText
            ? `${productText} — built for ${personaText}.`
            : productText,
          callToAction: 'Open to a quick 15-minute call next week to share more?',
          tone,
        })

        // Provide a synthetic template shape for the composer.
        // Subject/body are pre-rendered by Claude; composer will run variable
        // interpolation on them but they shouldn't contain {{tokens}} so it's a no-op.
        const bodyHtml = draft.body
          .split('\n\n')
          .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('\n')
        return {
          id: `outbound-agent-${campaign.id}`,
          name: `Outbound Agent: ${agent?.name ?? 'Untitled'}`,
          subject: draft.subject,
          body_html: bodyHtml,
          body_text: draft.body,
          is_outbound_agent: true,
          // Phase 2: pin the workspace's connected Gmail account into the
          // email_sends row so sendApprovedEmail knows which inbox to use.
          __pinnedEmailAccountId: outboundEmailAccountId,
        } as any
      }

      // Otherwise use normal template selection
      const _enrichedLead = { ...lead, lead: campaignLead }
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
        template: selectedTemplate as any,
        senderName,
        senderTitle,
        senderCompany,
      })
    })

    // Step 6: Create email_sends record (pending approval)
    // Idempotency: check if an email_send already exists for this campaign_lead + step
    // to prevent duplicates on retry
    const emailSend = await step.run('create-email-send', async () => {
      const supabase = createAdminClient()
      const stepNumber = campaignLead.current_step + 1

      // Check for existing email_send to prevent duplicates on retry
      const { data: existing } = await supabase
        .from('email_sends')
        .select('*')
        .eq('campaign_id', campaign_id)
        .eq('lead_id', lead_id)
        .eq('step_number', stepNumber)
        .in('status', ['pending_approval', 'approved', 'sending', 'sent'])
        .maybeSingle()

      if (existing) {
        return existing
      }

      // For outbound-agent campaigns, pin the workspace's connected Gmail
      // account so the send pipeline knows which inbox to send from.
      //
      // CRITICAL: read this from the OUTER `outboundEmailAccountId` scope
      // (set in the gate check above) instead of from `selectedTemplate.
      // __pinnedEmailAccountId`. The synthetic-template branch was the only
      // one that stamped the property — when the workspace has any real
      // templates in the DB, the normal selectTemplate() path returned a
      // template WITHOUT the pinned account, and the email would fall
      // through to the platform EmailBison sender (sending from the wrong
      // domain). Reading from the outer scope guarantees every outbound
      // draft on every code path gets pinned to the correct account.
      const pinnedEmailAccountId: string | null = isOutboundAgentCampaign
        ? outboundEmailAccountId
        : ((selectedTemplate as any).__pinnedEmailAccountId ?? null)

      const insertData: Record<string, any> = {
        workspace_id,
        campaign_id,
        template_id:
          (selectedTemplate as any).is_variant || (selectedTemplate as any).is_outbound_agent
            ? null
            : selectedTemplate.id,
        lead_id,
        ...(pinnedEmailAccountId && { email_account_id: pinnedEmailAccountId }),
        recipient_email: lead.email,
        recipient_name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        subject: composedEmail.subject,
        body_html: composedEmail.body_html,
        body_text: composedEmail.body_text,
        status: 'pending_approval', // Requires human review
        step_number: stepNumber,
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
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to create email send record: ${error.message}`)
      }

      return data
    })

    // Step 7: Update campaign lead status
    await step.run('update-campaign-lead', async () => {
      const supabase = createAdminClient()

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
    timeouts: { finish: "5m" },
  },
  { event: 'campaign/batch-compose' },
  async ({ event, step, logger }) => {
    const { campaign_id, workspace_id } = event.data

    // Fetch all ready leads
    const readyLeads = await step.run('fetch-ready-leads', async () => {
      const supabase = createAdminClient()

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
