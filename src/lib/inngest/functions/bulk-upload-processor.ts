/**
 * Inngest Functions for Bulk Upload Processing
 *
 * Handles background processing of bulk lead uploads, enrichment, and routing.
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { LeadRoutingService } from '@/lib/services/lead-routing.service'
import { clay } from '@/lib/integrations/clay'
import crypto from 'crypto'

/**
 * Process bulk upload job in background
 */
export const processBulkUpload = inngest.createFunction(
  {
    id: 'bulk-upload-process',
    name: 'Process Bulk Upload Job',
    retries: 2,
    timeout: 600000, // 10 minutes - bulk uploads can be large
  },
  { event: 'bulk-upload/process' },
  async ({ event, step }) => {
    const { jobId, workspaceId, userId, rows, source } = event.data
    const supabase = createAdminClient()

    // Update job status
    await step.run('update-job-status', async () => {
      await supabase
        .from('bulk_upload_jobs')
        .update({ status: 'processing' })
        .eq('id', jobId)
    })

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
      routingSummary: {} as Record<string, number>
    }

    // Process rows in batches of 10
    const batchSize = 10
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, Math.min(i + batchSize, rows.length))

      await step.run(`process-batch-${Math.floor(i / batchSize)}`, async () => {
        for (const row of batch) {
          try {
            // Build lead data
            const leadData = {
              workspace_id: workspaceId,
              user_id: userId,
              bulk_upload_job_id: jobId,
              source,
              first_name: row.first_name || row.full_name?.split(' ')[0],
              last_name: row.last_name || row.full_name?.split(' ').slice(1).join(' '),
              full_name: row.full_name,
              email: row.email,
              phone: row.phone,
              linkedin_url: row.linkedin_url,
              job_title: row.job_title,
              seniority_level: row.seniority_level || row.seniority,
              company_name: row.company_name,
              company_domain: row.company_domain,
              company_size: row.company_size,
              company_revenue: row.company_revenue,
              company_industry: row.company_industry || row.industry,
              company_location: {
                city: row.company_location_city || row.location?.city,
                state: row.company_location_state || row.location?.state,
                country: row.company_location_country || row.location?.country || 'US'
              },
              topic_name: row.topic_name,
              intent_score: row.intent_score || 50,
              external_ids: {
                datashopper_id: row.datashopper_id,
                clay_id: row.clay_id,
                audience_labs_id: row.audience_labs_id || row.id
              },
              enrichment_status: 'pending',
              delivery_status: 'pending'
            }

            // Generate fingerprint for deduplication
            const fingerprint = crypto
              .createHash('md5')
              .update(`${row.email}:${row.company_domain || row.company_name}`)
              .digest('hex')

            // Check duplicate in source workspace
            const { data: existing } = await supabase
              .from('leads')
              .select('id')
              .eq('fingerprint', fingerprint)
              .eq('workspace_id', workspaceId)
              .single()

            if (existing) {
              results.failed++
              results.errors.push({ row: i + batch.indexOf(row), error: 'Duplicate lead' })
              continue
            }

            // Insert lead in pending routing status
            const { data: insertedLead, error: insertError } = await supabase
              .from('leads')
              .insert({
                ...leadData,
                workspace_id: workspaceId, // Initial workspace (will be updated by routing)
                fingerprint,
                routing_status: 'pending', // Pending routing
              })
              .select('id')
              .single()

            if (insertError || !insertedLead) {
              results.failed++
              results.errors.push({ row: i + batch.indexOf(row), error: insertError?.message || 'Failed to insert lead' })
              continue
            }

            // Route lead atomically (updates workspace_id and routing_status)
            const routingResult = await LeadRoutingService.routeLead({
              leadId: insertedLead.id,
              sourceWorkspaceId: workspaceId,
              userId,
              maxRetries: 3
            })

            if (routingResult.success) {
              results.successful++
              const destId = routingResult.destinationWorkspaceId!
              results.routingSummary[destId] = (results.routingSummary[destId] || 0) + 1
            } else {
              // Routing failed - lead is queued for retry
              results.failed++
              results.errors.push({
                row: i + batch.indexOf(row),
                error: `Routing failed: ${routingResult.error}`
              })
            }

          } catch (error: any) {
            results.failed++
            results.errors.push({ row: i + batch.indexOf(row), error: error.message })
          }
        }

        // Update progress
        await supabase
          .from('bulk_upload_jobs')
          .update({
            processed_records: Math.min(i + batchSize, rows.length),
            successful_records: results.successful,
            failed_records: results.failed
          })
          .eq('id', jobId)
      })
    }

    // Update final status
    await step.run('finalize-job', async () => {
      await supabase
        .from('bulk_upload_jobs')
        .update({
          status: 'completed',
          processed_records: rows.length,
          successful_records: results.successful,
          failed_records: results.failed,
          error_log: results.errors.length > 0 ? results.errors.slice(0, 100) : null,
          routing_summary: {
            routed_workspaces: results.routingSummary,
            unrouted_count: results.routingSummary[workspaceId] || 0
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
    })

    return results
  }
)

/**
 * Enrich lead from DataShopper and route to workspace
 */
export const enrichLeadFromDataShopper = inngest.createFunction(
  {
    id: 'lead-enrich-from-datashopper',
    name: 'Enrich Lead from DataShopper',
    retries: 3,
    timeout: 300000, // 5 minutes
  },
  { event: 'lead/enrich-from-datashopper' },
  async ({ event, step }) => {
    const { jobId, workspaceId, lead } = event.data
    const supabase = createAdminClient()

    // Enrich with Clay
    const enrichedData = await step.run('clay-enrich', async () => {
      try {
        return await clay.enrichPerson({
          email: lead.email,
          linkedinUrl: lead.linkedin_url,
          companyDomain: lead.company_domain
        })
      } catch (error) {
        // Clay enrichment failed - return null to continue with unenriched data
        return null
      }
    })

    // Build lead data
    const leadData = await step.run('build-lead-data', async () => {
      return {
        workspace_id: workspaceId,
        user_id: workspaceId,
        bulk_upload_job_id: jobId,
        source: 'datashopper',
        first_name: lead.first_name,
        last_name: lead.last_name,
        full_name: lead.first_name + ' ' + lead.last_name,
        email: lead.email,
        phone: enrichedData?.phone || lead.phone,
        linkedin_url: enrichedData?.linkedin_url || lead.linkedin_url,
        job_title: lead.job_title,
        seniority_level: lead.seniority_level,
        company_name: lead.company_name,
        company_domain: lead.company_domain,
        company_size: lead.company_size,
        company_revenue: lead.company_revenue,
        company_industry: lead.company_industry,
        company_location: lead.company_location,
        topic_id: lead.topic_id,
        topic_name: lead.topic_name,
        intent_score: lead.intent_score,
        intent_signals: lead.intent_signals || {},
        enrichment_data: enrichedData || {},
        enrichment_status: enrichedData ? 'completed' : 'failed',
        enriched_at: enrichedData ? new Date().toISOString() : null,
        external_ids: {
          datashopper_id: lead.datashopper_id,
          clay_id: enrichedData?.clay_id
        },
        delivery_status: 'pending'
      }
    })

    // Generate fingerprint for deduplication
    const fingerprint = crypto
      .createHash('md5')
      .update(`${lead.email}:${lead.company_domain}`)
      .digest('hex')

    // Check duplicate in source workspace
    const existing = await step.run('check-duplicate', async () => {
      const { data } = await supabase
        .from('leads')
        .select('id')
        .eq('fingerprint', fingerprint)
        .eq('workspace_id', workspaceId)
        .single()
      return data
    })

    if (existing) {
      // Duplicate lead found - skip
      return { skipped: true, reason: 'duplicate' }
    }

    // Insert lead in pending routing status
    const savedLead = await step.run('save-lead', async () => {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          workspace_id: workspaceId, // Initial workspace
          fingerprint,
          routing_status: 'pending', // Pending routing
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    // Route lead atomically
    const routingResult = await step.run('route-lead', async () => {
      return await LeadRoutingService.routeLead({
        leadId: savedLead.id,
        sourceWorkspaceId: workspaceId,
        userId: workspaceId,
        maxRetries: 3
      })
    })

    if (!routingResult.success) {
      // Lead routing failed - lead is queued for retry
      // Lead is queued for retry - continue processing
    }

    return {
      leadId: savedLead.id,
      routed: routingResult.success,
      destinationWorkspaceId: routingResult.destinationWorkspaceId
    }
  }
)

/**
 * Import lead from Audience Labs and route to workspace
 */
export const importLeadFromAudienceLabs = inngest.createFunction(
  {
    id: 'lead-import-from-audience-labs',
    name: 'Import Lead from Audience Labs',
    retries: 3,
    timeout: 300000, // 5 minutes
  },
  { event: 'lead/import-from-audience-labs' },
  async ({ event, step }) => {
    const { jobId, workspaceId, lead } = event.data
    const supabase = createAdminClient()

    // Build lead data
    const leadData = {
      workspace_id: workspaceId,
      user_id: workspaceId,
      bulk_upload_job_id: jobId,
      source: 'audience_labs',
      first_name: lead.first_name,
      last_name: lead.last_name,
      full_name: `${lead.first_name} ${lead.last_name}`,
      email: lead.email,
      phone: lead.phone,
      linkedin_url: lead.linkedin_url,
      job_title: lead.job_title,
      seniority_level: lead.seniority,
      company_name: lead.company_name,
      company_domain: lead.company_domain,
      company_size: lead.company_size,
      company_revenue: lead.company_revenue,
      company_industry: lead.industry,
      company_location: lead.location,
      intent_score: lead.intent_score || 50,
      external_ids: {
        audience_labs_id: lead.audience_labs_id || lead.id
      },
      enrichment_status: 'pending',
      delivery_status: 'pending'
    }

    // Route lead
    const routingResult = await step.run('route-lead', async () => {
      return await LeadRoutingService.routeLead({
        leadData: leadData as any,
        sourceWorkspaceId: workspaceId,
        userId: workspaceId
      })
    })

    leadData.workspace_id = routingResult.destinationWorkspaceId

    // Generate fingerprint
    const fingerprint = crypto
      .createHash('md5')
      .update(`${lead.email}:${lead.company_domain || lead.company_name}`)
      .digest('hex')

    // Check duplicate
    const existing = await step.run('check-duplicate', async () => {
      const { data } = await supabase
        .from('leads')
        .select('id')
        .eq('fingerprint', fingerprint)
        .eq('workspace_id', leadData.workspace_id)
        .single()
      return data
    })

    if (existing) {
      // Duplicate lead found - skip
      return { skipped: true, reason: 'duplicate' }
    }

    // Insert lead
    const savedLead = await step.run('save-lead', async () => {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          fingerprint,
          routing_rule_id: routingResult.matchedRuleId,
          routing_metadata: {
            matched_rules: routingResult.matchedRuleId ? [routingResult.matchedRuleId] : [],
            routing_timestamp: new Date().toISOString(),
            original_workspace_id: workspaceId,
            routing_reason: routingResult.routingReason
          }
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    // Update job stats
    await step.run('update-job-stats', async () => {
      const { data: job } = await supabase
        .from('bulk_upload_jobs')
        .select('successful_records')
        .eq('id', jobId)
        .single()

      if (job) {
        await supabase
          .from('bulk_upload_jobs')
          .update({
            successful_records: (job.successful_records || 0) + 1
          })
          .eq('id', jobId)
      }
    })

    return { leadId: savedLead.id }
  }
)
