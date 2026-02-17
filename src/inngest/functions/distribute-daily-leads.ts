/**
 * Daily Lead Distribution Job
 *
 * Runs every day at 8am CT to distribute leads from Audience Labs to active users.
 * Sends email notifications and syncs to GHL for users with CRM enabled.
 */

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { fetchLeadsFromSegment, type AudienceLabLead } from '@/lib/services/audiencelab.service'
import { syncLeadsToGHL } from '@/lib/services/ghl.service'

export const distributeDailyLeads = inngest.createFunction(
  {
    id: 'distribute-daily-leads',
    name: 'Distribute Daily Leads',
    retries: 3,
  },
  { cron: '0 13 * * *' }, // 8am Central = 1pm UTC
  async ({ event, step }) => {
    const supabase = await createClient()

    // Step 1: Fetch all active users
    const users = await step.run('fetch-active-users', async () => {
      console.log('[DailyLeads] Fetching active users...')

      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, workspace_id, plan, daily_lead_limit, industry_segment, location_segment, ghl_sub_account_id')
        .eq('is_active', true)
        .not('workspace_id', 'is', null)

      if (error) {
        console.error('[DailyLeads] Failed to fetch users:', error)
        throw new Error(`Failed to fetch users: ${error.message}`)
      }

      console.log('[DailyLeads] Found active users:', data.length)
      return data
    })

    if (!users || users.length === 0) {
      console.log('[DailyLeads] No active users found')
      return { processed: 0, success: 0, failed: 0 }
    }

    // Step 2: Process each user
    let successCount = 0
    let failedCount = 0

    for (const user of users) {
      try {
        await step.run(`distribute-leads-${user.id}`, async () => {
          console.log('[DailyLeads] Processing user:', {
            id: user.id,
            email: user.email,
            plan: user.plan,
          })

          // Skip users without industry/location configured
          if (!user.industry_segment || !user.location_segment) {
            console.warn('[DailyLeads] User missing segment data:', user.id)
            return
          }

          // Determine daily lead limit based on plan
          const dailyLimit = user.daily_lead_limit || (user.plan === 'free' ? 10 : 100)

          // Check if user already received their full daily allocation today
          const today = new Date().toISOString().split('T')[0]
          const { count: todayCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', user.workspace_id)
            .gte('delivered_at', `${today}T00:00:00`)
            .lte('delivered_at', `${today}T23:59:59`)

          if (todayCount && todayCount >= dailyLimit) {
            console.log('[DailyLeads] User already received daily limit today:', {
              userId: user.id,
              todayCount,
              dailyLimit,
            })
            return
          }

          const remainingForToday = dailyLimit - (todayCount || 0)

          // Look up the real audience segment from DB (industry + location → segment_id)
          const { data: segmentMapping, error: mappingError } = await supabase
            .from('audience_lab_segments')
            .select('segment_id, segment_name')
            .eq('industry', user.industry_segment)
            .eq('location', user.location_segment)
            .single()

          if (mappingError || !segmentMapping) {
            console.warn('[DailyLeads] No audience mapping for user:', {
              userId: user.id,
              industry: user.industry_segment,
              location: user.location_segment,
            })
            return
          }

          // Fetch best-quality leads from Audience Labs (auto-sorted by completeness score)
          const leads = await fetchLeadsFromSegment(segmentMapping.segment_id, {
            page: 1,
            pageSize: remainingForToday,
          })

          if (leads.length === 0) {
            console.log('[DailyLeads] No new leads for user:', user.id)
            return
          }

          console.log('[DailyLeads] Fetched leads:', {
            userId: user.id,
            count: leads.length,
          })

          // Save leads to database (map UPPERCASE fields to lowercase)
          const leadsToInsert = leads.map((lead: AudienceLabLead) => ({
            workspace_id: user.workspace_id,
            full_name: `${lead.FIRST_NAME || ''} ${lead.LAST_NAME || ''}`.trim(),
            email: lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL || lead.PERSONAL_VERIFIED_EMAILS?.[0] || '',
            phone: lead.MOBILE_PHONE || lead.DIRECT_NUMBER || lead.PERSONAL_PHONE || lead.COMPANY_PHONE || '',
            company_name: lead.COMPANY_NAME || '',
            job_title: lead.JOB_TITLE || lead.HEADLINE || '',
            source: 'audience_labs_daily',
            status: 'new',
            delivered_at: new Date().toISOString(),
            metadata: {
              city: lead.COMPANY_CITY || lead.PERSONAL_CITY,
              state: lead.COMPANY_STATE || lead.PERSONAL_STATE,
              zip: lead.COMPANY_ZIP || lead.PERSONAL_ZIP,
              domain: lead.COMPANY_DOMAIN,
              industry: lead.COMPANY_INDUSTRY,
              employee_count: lead.COMPANY_EMPLOYEE_COUNT,
              revenue: lead.COMPANY_REVENUE,
              linkedin: lead.LINKEDIN_URL,
              company_linkedin: lead.COMPANY_LINKEDIN_URL,
              uuid: lead.UUID,
            },
          }))

          const { error: insertError } = await supabase
            .from('leads')
            .insert(leadsToInsert)

          if (insertError) {
            console.error('[DailyLeads] Failed to insert leads:', insertError)
            throw new Error(`Failed to insert leads: ${insertError.message}`)
          }

          console.log('[DailyLeads] Leads saved to database:', {
            userId: user.id,
            count: leadsToInsert.length,
          })

          // Send email notification
          await step.run(`send-notification-${user.id}`, async () => {
            // TODO: Implement email sending via Resend or Email Bison
            console.log('[DailyLeads] Would send email notification to:', user.email)
            // Example:
            // await sendEmail({
            //   to: user.email,
            //   subject: `Your ${leads.length} leads are ready!`,
            //   template: 'daily-leads',
            //   data: {
            //     leadCount: leads.length,
            //     userName: user.full_name,
            //     dashboardUrl: 'https://leads.meetcursive.com/leads'
            //   }
            // })
          })

          // Sync to GHL if user has CRM enabled
          if (user.ghl_sub_account_id) {
            await step.run(`sync-to-ghl-${user.id}`, async () => {
              const ghlLeads = leads.map((lead: AudienceLabLead) => ({
                firstName: lead.FIRST_NAME,
                lastName: lead.LAST_NAME,
                email: lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL,
                phone: lead.MOBILE_PHONE || lead.DIRECT_NUMBER,
                companyName: lead.COMPANY_NAME,
                title: lead.JOB_TITLE || lead.HEADLINE,
              }))

              const synced = await syncLeadsToGHL(
                user.ghl_sub_account_id!,
                ghlLeads,
                ['cursive-daily-lead', user.industry_segment]
              )

              console.log('[DailyLeads] Synced to GHL:', {
                userId: user.id,
                synced,
                total: ghlLeads.length,
              })
            })
          }

          successCount++
        })
      } catch (error) {
        console.error('[DailyLeads] Failed to process user:', {
          userId: user.id,
          error,
        })
        failedCount++
      }
    }

    console.log('[DailyLeads] Distribution complete:', {
      total: users.length,
      success: successCount,
      failed: failedCount,
    })

    return {
      processed: users.length,
      success: successCount,
      failed: failedCount,
    }
  }
)
