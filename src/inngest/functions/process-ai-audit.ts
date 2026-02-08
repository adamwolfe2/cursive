/**
 * Process AI Audit Submission
 *
 * When a user submits the AI Readiness Audit form, create or update
 * their contact in Cursive's GHL account, tag them, and open an
 * opportunity in the AI Audit pipeline.
 *
 * Trigger: ai-audit/submitted (emitted from POST /api/ai-audit/submit)
 * Steps:
 *   1. Check if contact already exists in GHL
 *   2. Create new contact or update existing with audit data
 *   3. Tag contact with audit and segment tags
 *   4. Create opportunity in AI Audit pipeline
 */

import { inngest } from '../client'
import {
  createCursiveContact,
  findCursiveContactByEmail,
  updateCursiveContact,
  addCursiveContactTags,
  createCursiveOpportunity,
  GHL_PIPELINES,
  GHL_STAGES,
  GHL_CUSTOM_FIELDS,
} from '@/lib/integrations/ghl-admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const processAiAudit = inngest.createFunction(
  {
    id: 'process-ai-audit',
    name: 'Process AI Audit Submission',
    retries: 3,
  },
  { event: 'ai-audit/submitted' },
  async ({ event, step }) => {
    const {
      name,
      email,
      company_name,
      phone,
      company_size,
      industry,
      ai_maturity,
      budget_range,
      biggest_bottleneck,
      using_ai,
      audit_reason,
      ideal_outcome,
      website_url,
    } = event.data

    safeLog(`[AI Audit] Processing audit submission for ${email}`)

    // Build custom fields array from audit form data
    const customFields: Array<{ id: string; value: string | string[] }> = []
    if (company_size) customFields.push({ id: GHL_CUSTOM_FIELDS.COMPANY_SIZE, value: [company_size] })
    if (industry) customFields.push({ id: GHL_CUSTOM_FIELDS.INDUSTRY, value: industry })
    if (ai_maturity) customFields.push({ id: GHL_CUSTOM_FIELDS.AI_MATURITY, value: [ai_maturity] })
    if (budget_range) customFields.push({ id: GHL_CUSTOM_FIELDS.BUDGET_RANGE, value: [budget_range] })
    if (biggest_bottleneck) customFields.push({ id: GHL_CUSTOM_FIELDS.BIGGEST_BOTTLENECK, value: biggest_bottleneck })
    if (using_ai) customFields.push({ id: GHL_CUSTOM_FIELDS.USING_AI, value: using_ai })
    if (audit_reason) customFields.push({ id: GHL_CUSTOM_FIELDS.AUDIT_REASON, value: audit_reason })
    if (ideal_outcome) customFields.push({ id: GHL_CUSTOM_FIELDS.IDEAL_OUTCOME, value: ideal_outcome })

    // Step 1: Check if contact already exists
    const existingContactId = await step.run('check-existing', async () => {
      const contactId = await findCursiveContactByEmail(email)
      if (contactId) {
        safeLog(`[AI Audit] Found existing contact: ${contactId}`)
      } else {
        safeLog(`[AI Audit] No existing contact found for ${email}`)
      }
      return contactId
    })

    // Step 2: Create new contact or update existing with audit data
    const contactId = await step.run('create-or-update-contact', async () => {
      // Parse name into first/last
      const nameParts = name.split(' ')
      const firstName = nameParts[0] || 'Unknown'
      const lastName = nameParts.slice(1).join(' ') || ''

      if (existingContactId) {
        // Update existing contact with audit data
        const updateResult = await updateCursiveContact(existingContactId, {
          firstName,
          lastName,
          phone: phone || undefined,
          companyName: company_name || undefined,
          customFields,
        })

        if (!updateResult.success) {
          safeError(`[AI Audit] Failed to update contact: ${updateResult.error}`)
        } else {
          safeLog(`[AI Audit] Updated existing contact: ${existingContactId}`)
        }

        return existingContactId
      }

      // Create new contact
      const result = await createCursiveContact({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        companyName: company_name || undefined,
        source: 'AI Audit',
        tags: ['audit_submitted'],
        customFields,
      })

      if (!result.success || !result.contactId) {
        throw new Error(`Failed to create GHL contact: ${result.error}`)
      }

      safeLog(`[AI Audit] Created new contact: ${result.contactId}`)
      return result.contactId
    })

    // Step 3: Tag contact with audit and segment tags
    await step.run('tag-contact', async () => {
      const tags: string[] = ['audit_submitted', 'lm_audit_submitted']

      // Segment based on company size
      if (company_size) {
        const sizeValue = company_size.toLowerCase()
        // Enterprise: 200+ employees or enterprise-level indicators
        const isEnterprise =
          sizeValue.includes('200') ||
          sizeValue.includes('500') ||
          sizeValue.includes('1000') ||
          sizeValue.includes('enterprise') ||
          sizeValue.includes('large')

        tags.push(isEnterprise ? 'lm_enterprise' : 'lm_smb')
      } else {
        tags.push('lm_smb')
      }

      // Add industry tag if available
      if (industry) {
        tags.push(`industry-${industry.toLowerCase().replace(/\s+/g, '-')}`)
      }

      // Add UTM source tag if available
      if (event.data.utm_source) {
        tags.push(`utm-${event.data.utm_source.toLowerCase().replace(/\s+/g, '-')}`)
      }

      await addCursiveContactTags(contactId, tags)
      safeLog(`[AI Audit] Tagged contact with: ${tags.join(', ')}`)
    })

    // Step 4: Create opportunity in AI Audit pipeline
    const opportunityId = await step.run('create-opportunity', async () => {
      const nameParts = name.split(' ')
      const firstName = nameParts[0] || 'Unknown'

      const result = await createCursiveOpportunity({
        name: `AI Audit - ${firstName} (${email})`,
        pipelineId: GHL_PIPELINES.AI_AUDIT,
        stageId: GHL_STAGES.AUDIT_SUBMITTED,
        status: 'open',
        contactId,
      })

      if (!result.success) {
        safeError(`[AI Audit] Failed to create opportunity: ${result.error}`)
        // Don't throw - contact was already created, opportunity is secondary
        return null
      }

      safeLog(`[AI Audit] Created opportunity: ${result.opportunityId}`)
      return result.opportunityId
    })

    return {
      success: true,
      contactId,
      opportunityId,
    }
  }
)
