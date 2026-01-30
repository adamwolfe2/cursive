// Daily Lead Generation
// Runs every day at 2 AM to discover new companies with intent signals

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { DataShopperClient } from '@/lib/integrations/datashopper'
import type { Query, QueryFilters } from '@/types'

export const dailyLeadGeneration = inngest.createFunction(
  {
    id: 'daily-lead-generation',
    name: 'Daily Lead Generation',
    retries: 3,
    timeout: 300000, // 5 minutes
  },
  { cron: '0 2 * * *' }, // Every day at 2 AM
  async ({ step, logger }) => {
    // Step 1: Fetch all active queries
    const queries = await step.run('fetch-active-queries', async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('queries')
        .select('*, global_topics(topic, category)')
        .eq('status', 'active')

      if (error) {
        logger.error('Failed to fetch queries:', error)
        throw new Error(`Failed to fetch queries: ${error.message}`)
      }

      logger.info(`Found ${data.length} active queries`)
      return data as any[]
    })

    if (queries.length === 0) {
      logger.info('No active queries found, skipping lead generation')
      return { success: true, message: 'No active queries' }
    }

    // Step 2: Process each query
    const results = await Promise.all(
      queries.map(async (query: any) => {
        return await step.run(`process-query-${query.id}`, async () => {
          try {
            logger.info(`Processing query: ${query.id} (${query.global_topics.topic})`)

            // Initialize DataShopper client
            const dataShopperClient = new DataShopperClient()

            // Build search parameters from query filters
            const filters = query.filters as QueryFilters

            const searchParams = {
              topic: query.global_topics.topic,
              location: filters.location || undefined,
              companySize: filters.employee_range || undefined,
              revenue: filters.revenue_range || undefined,
              industry: filters.industry || undefined,
              limit: 50, // Max companies per day per query
            }

            // Search for companies with intent signals
            const response = await dataShopperClient.searchCompanies(searchParams)

            logger.info(
              `Found ${response.results.length} companies for query ${query.id}`
            )

            if (response.results.length === 0) {
              return {
                query_id: query.id,
                leads_created: 0,
                message: 'No companies found',
              }
            }

            // Step 3: Insert leads into database
            const supabase = await createClient()
            const leadsToInsert = response.results.map((company) => {
              const intentScore = dataShopperClient.calculateIntentScore(
                company.intent_signals
              )

              return {
                query_id: query.id,
                workspace_id: query.workspace_id,
                company_data: {
                  name: company.name,
                  domain: company.domain,
                  website: company.website,
                  description: company.description,
                  industry: company.industry,
                  employee_count: company.employee_count,
                  revenue: company.revenue,
                  location: company.location,
                  founded_year: company.founded_year,
                  technologies: company.technologies,
                  social_profiles: company.social_profiles,
                },
                intent_data: {
                  score: intentScore,
                  signals: company.intent_signals || [],
                  last_updated: new Date().toISOString(),
                },
                enrichment_status: 'pending' as const,
                delivery_status: 'pending' as const,
              }
            })

            const { data: insertedLeads, error: insertError } = await supabase
              .from('leads')
              .insert(leadsToInsert)
              .select('id')

            if (insertError) {
              logger.error(`Failed to insert leads for query ${query.id}:`, insertError)
              throw new Error(`Failed to insert leads: ${insertError.message}`)
            }

            logger.info(
              `Created ${insertedLeads.length} leads for query ${query.id}`
            )

            // Step 4: Trigger enrichment for each lead
            await Promise.all(
              insertedLeads.map((lead: any) =>
                inngest.send({
                  name: 'lead/enrich',
                  data: {
                    lead_id: lead.id,
                    workspace_id: query.workspace_id,
                  },
                })
              )
            )

            // Step 5: Update query last_run_at
            await supabase
              .from('queries')
              .update({ last_run_at: new Date().toISOString() })
              .eq('id', query.id)

            return {
              query_id: query.id,
              leads_created: insertedLeads.length,
              message: 'Success',
            }
          } catch (error: any) {
            logger.error(`Error processing query ${query.id}:`, error)
            return {
              query_id: query.id,
              leads_created: 0,
              message: `Error: ${error.message}`,
            }
          }
        })
      })
    )

    // Summary
    const totalLeads = results.reduce((sum, r) => sum + r.leads_created, 0)
    logger.info(`Daily lead generation complete. Total leads created: ${totalLeads}`)

    return {
      success: true,
      queries_processed: queries.length,
      total_leads_created: totalLeads,
      results,
    }
  }
)
