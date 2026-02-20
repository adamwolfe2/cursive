/**
 * Inngest Functions for Bulk Upload Processing
 *
 * Handles background processing of bulk lead uploads, enrichment, and routing.
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { LeadRoutingService } from '@/lib/services/lead-routing.service'
import { ClayClient } from '@/lib/integrations/clay'
const clay = new ClayClient()
import crypto from 'crypto'

/**
 * Process bulk upload job in background
 */
export const processBulkUpload = inngest.createFunction(
  {
    id: 'bulk-upload-process',
    name: 'Process Bulk Upload Job',
    retries: 2,
    timeouts: { finish: "10m" }, // 10 minutes - bulk uploads can be large
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
              .maybeSingle()

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
              .maybeSingle()

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
 * Import lead from Audience Labs and route to workspace
 */
export const importLeadFromAudienceLabs = inngest.createFunction(
  {
    id: 'lead-import-from-audience-labs',
    name: 'Import Lead from Audience Labs',
    retries: 3,
    timeouts: { finish: "5m" },
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
        leadId: '', // Will be assigned after insert
        sourceWorkspaceId: workspaceId,
        userId: workspaceId,
      } as any)
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
        .maybeSingle()
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
        .maybeSingle()

      if (error) throw error
      return data
    })

    // Update job stats
    await step.run('update-job-stats', async () => {
      const { data: job } = await supabase
        .from('bulk_upload_jobs')
        .select('successful_records')
        .eq('id', jobId)
        .maybeSingle()

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
