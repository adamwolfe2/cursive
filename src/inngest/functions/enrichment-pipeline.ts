/**
 * Enrichment Pipeline
 * Cursive Platform
 *
 * Advanced enrichment system that orchestrates multiple enrichment providers
 * with AI-powered analysis, priority queue processing, and real-time updates.
 */

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { validateEmail, findBestEmail } from '@/lib/services/enrichment/email-validation.service'
import {
  analyzeCompany,
  qualifyLead,
  researchCompany,
  analyzeIntentSignals,
} from '@/lib/services/ai/claude.service'
import { enrichLeadWithClay, enrichCompanyWithClay } from '@/lib/services/clay.service'

// ============================================================================
// TYPES
// ============================================================================

interface EnrichmentJobData {
  job_id: string
  lead_id: string
  workspace_id: string
  provider: string
  priority: string
}

interface LeadData {
  id: string
  workspace_id: string
  company_data: any
  contact_data: any
  enrichment_status: string
}

// ============================================================================
// MAIN ENRICHMENT PROCESSOR
// ============================================================================

export const processEnrichmentJob = inngest.createFunction(
  {
    id: 'enrichment-pipeline-process',
    name: 'Process Enrichment Job',
    retries: 3,
    concurrency: {
      limit: 10, // Max 10 concurrent enrichment jobs
    },
  },
  { event: 'enrichment/process' },
  async ({ event, step, logger }) => {
    const { job_id, lead_id, workspace_id, provider } = event.data as EnrichmentJobData

    // Step 1: Mark job as in progress and fetch lead
    const { job, lead } = await step.run('fetch-job-and-lead', async () => {
      const supabase = await createClient()

      // Update job status
      await supabase
        .from('enrichment_jobs')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          attempts: supabase.rpc ? 1 : 1, // Increment attempts
        })
        .eq('id', job_id)

      // Fetch lead data
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .eq('workspace_id', workspace_id)
        .single()

      if (leadError || !leadData) {
        throw new Error(`Lead not found: ${lead_id}`)
      }

      // Fetch job data
      const { data: jobData } = await supabase
        .from('enrichment_jobs')
        .select('*')
        .eq('id', job_id)
        .single()

      return { job: jobData, lead: leadData }
    })

    logger.info(`Processing enrichment job ${job_id} for lead ${lead_id} with provider ${provider}`)

    // Step 2: Execute enrichment based on provider
    const enrichmentResult = await step.run(`enrich-with-${provider}`, async () => {
      switch (provider) {
        case 'email_validation':
          return await enrichEmailValidation(lead)

        case 'ai_analysis':
          return await enrichWithAI(lead, workspace_id)

        case 'clay':
          return await enrichWithClay(lead)

        case 'web_scrape':
          return await enrichWithWebScrape(lead)

        default:
          throw new Error(`Unknown enrichment provider: ${provider}`)
      }
    })

    // Step 3: Update lead with enrichment results
    await step.run('update-lead', async () => {
      const supabase = await createClient()

      if (enrichmentResult.success && enrichmentResult.data) {
        const updatePayload: Record<string, any> = {
          ...enrichmentResult.data,
          enrichment_status: 'enriched',
          enriched_at: new Date().toISOString(),
        }

        await supabase
          .from('leads')
          .update(updatePayload)
          .eq('id', lead_id)

        // Log the enrichment activity
        await supabase.from('lead_activities').insert({
          lead_id,
          workspace_id,
          activity_type: 'enriched',
          description: `Enriched with ${provider}`,
          metadata: {
            provider,
            fields_updated: Object.keys(enrichmentResult.data),
          },
        })
      }

      // Update job status
      await supabase
        .from('enrichment_jobs')
        .update({
          status: enrichmentResult.success ? 'completed' : 'failed',
          result: enrichmentResult.data,
          error: enrichmentResult.error,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job_id)

      // Log to enrichment_logs
      await supabase.from('enrichment_logs').insert({
        lead_id,
        workspace_id,
        provider,
        request_data: { lead_id, provider },
        response_data: enrichmentResult.data,
        status: enrichmentResult.success ? 'success' : 'failed',
        error_message: enrichmentResult.error,
        credits_used: enrichmentResult.creditsUsed || 0,
      })
    })

    // Step 4: Trigger next enrichment or delivery if this was the last one
    await step.run('check-completion', async () => {
      const supabase = await createClient()

      // Check if there are more pending jobs for this lead
      const { data: pendingJobs } = await supabase
        .from('enrichment_jobs')
        .select('id')
        .eq('lead_id', lead_id)
        .in('status', ['pending', 'in_progress'])

      if (!pendingJobs || pendingJobs.length === 0) {
        // All enrichment complete, trigger delivery
        await inngest.send({
          name: 'lead/deliver',
          data: {
            lead_id,
            workspace_id,
            delivery_channels: ['email'], // Default channel
          },
        })

        logger.info(`All enrichment complete for lead ${lead_id}, triggering delivery`)
      }
    })

    return {
      success: enrichmentResult.success,
      job_id,
      lead_id,
      provider,
      data: enrichmentResult.data,
    }
  }
)

// ============================================================================
// PROVIDER-SPECIFIC ENRICHMENT FUNCTIONS
// ============================================================================

/**
 * Email validation enrichment
 */
async function enrichEmailValidation(lead: LeadData): Promise<{
  success: boolean
  data?: Record<string, any>
  error?: string
  creditsUsed?: number
}> {
  const contactData = lead.contact_data as any
  const companyData = lead.company_data as any

  // Get primary email
  const primaryEmail = contactData?.contacts?.[0]?.email || contactData?.primary_contact?.email

  if (!primaryEmail) {
    // Try to guess email if we have name and domain
    const firstName = contactData?.contacts?.[0]?.first_name
    const lastName = contactData?.contacts?.[0]?.last_name
    const domain = companyData?.domain

    if (firstName && lastName && domain) {
      const guessedEmail = await findBestEmail(firstName, lastName, domain)

      if (guessedEmail) {
        const validation = await validateEmail(guessedEmail.email)

        return {
          success: true,
          data: {
            contact_data: {
              ...contactData,
              contacts: [
                {
                  ...(contactData?.contacts?.[0] || {}),
                  email: guessedEmail.email,
                  email_guessed: true,
                  email_pattern: guessedEmail.pattern,
                  email_confidence: guessedEmail.confidence,
                },
                ...(contactData?.contacts?.slice(1) || []),
              ],
            },
            email_verified: validation.isValid && validation.isDeliverable === 'yes',
          },
          creditsUsed: 0,
        }
      }
    }

    return {
      success: false,
      error: 'No email to validate and cannot guess email',
    }
  }

  // Validate existing email
  const validation = await validateEmail(primaryEmail)

  return {
    success: true,
    data: {
      email_verified: validation.isValid && validation.isDeliverable === 'yes',
      contact_data: {
        ...contactData,
        email_validation: {
          is_valid: validation.isValid,
          is_deliverable: validation.isDeliverable,
          is_disposable: validation.validationDetails.isDisposable,
          is_role_based: validation.validationDetails.isRoleBased,
          confidence: validation.confidence,
        },
      },
    },
    creditsUsed: 0,
  }
}

/**
 * AI-powered enrichment using Claude
 */
async function enrichWithAI(
  lead: LeadData,
  workspaceId: string
): Promise<{
  success: boolean
  data?: Record<string, any>
  error?: string
  creditsUsed?: number
}> {
  const companyData = lead.company_data as any
  const contactData = lead.contact_data as any

  if (!companyData?.name && !companyData?.domain) {
    return {
      success: false,
      error: 'No company data available for AI analysis',
    }
  }

  try {
    // Fetch workspace ICP for qualification
    const supabase = await createClient()
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('industry_vertical, allowed_industries, allowed_regions')
      .eq('id', workspaceId)
      .single()

    // Run AI analysis
    const [companyAnalysis, qualification] = await Promise.all([
      analyzeCompany({
        name: companyData.name,
        domain: companyData.domain,
        description: companyData.description,
        industry: companyData.industry,
      }),
      qualifyLead(
        {
          companyName: companyData.name,
          companyDomain: companyData.domain,
          industry: companyData.industry,
          companySize: companyData.size,
          contactName: contactData?.contacts?.[0]?.full_name,
          contactTitle: contactData?.contacts?.[0]?.title,
          contactEmail: contactData?.contacts?.[0]?.email,
          location: companyData.location?.state || companyData.location?.country,
          technologies: companyData.technologies,
          intentSignals: companyData.intent_signals?.map((s: any) => s.signal_type),
        },
        {
          targetIndustries: workspace?.allowed_industries || [workspace?.industry_vertical || 'Any'],
          targetCompanySize: ['small', 'medium', 'large'],
          targetTitles: ['CEO', 'CTO', 'VP', 'Director', 'Manager', 'Owner'],
          targetLocations: workspace?.allowed_regions || ['US'],
        }
      ),
    ])

    return {
      success: true,
      data: {
        ai_analysis: {
          company: companyAnalysis,
          qualification,
          analyzed_at: new Date().toISOString(),
        },
        qualification_score: qualification.score,
        qualification_tier: qualification.tier,
        next_action: qualification.nextBestAction,
        company_data: {
          ...companyData,
          industry: companyAnalysis.industry || companyData.industry,
          keywords: companyAnalysis.keywords,
          pain_points: companyAnalysis.painPoints,
          buying_signals: companyAnalysis.buyingSignals,
        },
      },
      creditsUsed: 2, // AI analysis costs credits
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'AI analysis failed',
    }
  }
}

/**
 * Clay enrichment
 */
async function enrichWithClay(lead: LeadData): Promise<{
  success: boolean
  data?: Record<string, any>
  error?: string
  creditsUsed?: number
}> {
  const companyData = lead.company_data as any
  const contactData = lead.contact_data as any

  if (!companyData?.domain) {
    return {
      success: false,
      error: 'No company domain for Clay enrichment',
    }
  }

  try {
    // Get company info
    const companyResult = await enrichCompanyWithClay(companyData.domain)

    if (!companyResult.success) {
      return {
        success: false,
        error: companyResult.error,
      }
    }

    // Get contact info if we have a person
    let personResult = null
    if (contactData?.contacts?.[0]) {
      const contact = contactData.contacts[0]
      personResult = await enrichLeadWithClay({
        email: contact.email,
        first_name: contact.first_name,
        last_name: contact.last_name,
        company_name: companyData.name,
        company_domain: companyData.domain,
        linkedin_url: contact.linkedin_url,
      })
    }

    const enrichedData: Record<string, any> = {
      company_data: {
        ...companyData,
        size: companyResult.data?.company_size || companyData.size,
        revenue: companyResult.data?.company_revenue,
        founded: companyResult.data?.company_founded,
        linkedin: companyResult.data?.company_linkedin,
        description: companyResult.data?.company_description || companyData.description,
      },
      company_size: companyResult.data?.company_size,
      company_revenue: companyResult.data?.company_revenue,
      company_founded: companyResult.data?.company_founded,
      company_linkedin: companyResult.data?.company_linkedin,
      company_description: companyResult.data?.company_description,
    }

    if (personResult?.success && personResult.data) {
      enrichedData.contact_data = {
        ...contactData,
        contacts: contactData?.contacts?.map((c: any, i: number) => {
          if (i === 0) {
            return {
              ...c,
              title: personResult!.data!.job_title || c.title,
              seniority: personResult!.data!.job_seniority,
              linkedin_url: personResult!.data!.linkedin_url || c.linkedin_url,
              linkedin_headline: personResult!.data!.linkedin_headline,
              phone: personResult!.data!.phone || c.phone,
              phone_verified: personResult!.data!.phone_verified,
            }
          }
          return c
        }),
      }
      enrichedData.job_title = personResult.data.job_title
      enrichedData.job_seniority = personResult.data.job_seniority
      enrichedData.linkedin_url = personResult.data.linkedin_url
      enrichedData.linkedin_headline = personResult.data.linkedin_headline
      enrichedData.phone_verified = personResult.data.phone_verified
    }

    return {
      success: true,
      data: enrichedData,
      creditsUsed: (companyResult.credits_used || 0) + (personResult?.credits_used || 0),
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Clay enrichment failed',
    }
  }
}

/**
 * Web scraping enrichment
 */
async function enrichWithWebScrape(lead: LeadData): Promise<{
  success: boolean
  data?: Record<string, any>
  error?: string
  creditsUsed?: number
}> {
  const companyData = lead.company_data as any

  if (!companyData?.domain) {
    return {
      success: false,
      error: 'No domain for web scraping',
    }
  }

  try {
    // Use AI to research the company
    const research = await researchCompany(companyData.domain)

    return {
      success: true,
      data: {
        company_data: {
          ...companyData,
          name: research.companyName || companyData.name,
          description: research.description || companyData.description,
          industry: research.industry || companyData.industry,
          products: research.products,
          services: research.services,
          target_customers: research.targetCustomers,
          tech_stack: research.techStack,
          social_profiles: research.socialProfiles,
        },
        company_description: research.description,
      },
      creditsUsed: 1,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Web scrape failed',
    }
  }
}

// ============================================================================
// BATCH ENRICHMENT
// ============================================================================

export const batchEnrichLeads = inngest.createFunction(
  {
    id: 'enrichment-batch-process',
    name: 'Batch Enrich Leads',
    retries: 2,
  },
  { event: 'enrichment/batch' },
  async ({ event, step, logger }) => {
    const { workspace_id, lead_ids, providers, priority } = event.data as {
      workspace_id: string
      lead_ids: string[]
      providers: string[]
      priority: string
    }

    logger.info(`Starting batch enrichment for ${lead_ids.length} leads`)

    // Queue enrichment jobs for each lead
    const jobIds = await step.run('queue-jobs', async () => {
      const supabase = await createClient()
      const jobs: string[] = []

      for (const leadId of lead_ids) {
        for (const provider of providers) {
          const { data: job, error } = await supabase
            .from('enrichment_jobs')
            .insert({
              lead_id: leadId,
              workspace_id,
              provider,
              priority,
              status: 'pending',
              attempts: 0,
              max_attempts: 3,
            })
            .select('id')
            .single()

          if (!error && job) {
            jobs.push(job.id)

            // Trigger processing
            await inngest.send({
              name: 'enrichment/process',
              data: {
                job_id: job.id,
                lead_id: leadId,
                workspace_id,
                provider,
                priority,
              },
            })
          }
        }
      }

      return jobs
    })

    return {
      success: true,
      jobs_queued: jobIds.length,
      leads_count: lead_ids.length,
      providers,
    }
  }
)

// ============================================================================
// REAL-TIME ENRICHMENT ON LEAD CREATION
// ============================================================================

export const enrichNewLead = inngest.createFunction(
  {
    id: 'enrichment-new-lead',
    name: 'Enrich New Lead',
    retries: 2,
  },
  { event: 'lead/created' },
  async ({ event, step, logger }) => {
    const { lead_id, workspace_id } = event.data as {
      lead_id: string
      workspace_id: string
    }

    logger.info(`Auto-enriching new lead: ${lead_id}`)

    // Check workspace settings
    const autoEnrich = await step.run('check-settings', async () => {
      const supabase = await createClient()
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('auto_enrich_leads, enrichment_provider')
        .eq('id', workspace_id)
        .single()

      return workspace?.auto_enrich_leads !== false
    })

    if (!autoEnrich) {
      logger.info('Auto-enrichment disabled for workspace')
      return { success: true, skipped: true, reason: 'Auto-enrich disabled' }
    }

    // Queue default enrichment providers
    const defaultProviders = ['email_validation', 'ai_analysis', 'clay']

    await step.run('queue-enrichment', async () => {
      await inngest.send({
        name: 'enrichment/batch',
        data: {
          workspace_id,
          lead_ids: [lead_id],
          providers: defaultProviders,
          priority: 'normal',
        },
      })
    })

    return {
      success: true,
      lead_id,
      providers_queued: defaultProviders,
    }
  }
)
