// Marketplace Lead Refresh
// Daily cron job that pulls fresh high-quality leads from AudienceLab
// and lists them on the marketplace for users to purchase.

import { getInngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const inngest = getInngest()

// Top industry segments to pull from
const MARKETPLACE_SEGMENTS = [
  'Technology',
  'Financial Services',
  'Healthcare',
  'Real Estate',
  'Professional Services',
  'Retail',
  'Manufacturing',
  'Education',
]

/**
 * Daily marketplace lead refresh.
 * Pulls fresh leads from AudienceLab and lists them for the marketplace.
 * Runs at 2 AM CT daily.
 */
export const marketplaceLeadRefresh = inngest.createFunction(
  {
    id: 'marketplace-lead-refresh',
    retries: 2,
  },
  { cron: '0 7 * * *' }, // 7 AM UTC = 2 AM CT
  async ({ step }) => {
    const supabase = createAdminClient()

    // Step 1: Check how many marketplace leads we currently have
    const currentCount = await step.run('check-current-count', async () => {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('is_marketplace_listed', true)
        .eq('marketplace_status', 'available')

      return count || 0
    })

    // If we already have 500+ available leads, skip the refresh
    if (currentCount >= 500) {
      return { skipped: true, reason: 'Already have enough marketplace leads', current: currentCount }
    }

    const targetCount = 500 - currentCount
    const leadsPerSegment = Math.ceil(targetCount / MARKETPLACE_SEGMENTS.length)

    // Step 2: Pull leads from AudienceLab for each segment
    let totalAdded = 0

    for (const segment of MARKETPLACE_SEGMENTS) {
      await step.run(`pull-${segment.toLowerCase().replace(/\s+/g, '-')}`, async () => {
        try {
          const alApiKey = process.env.AUDIENCELAB_ACCOUNT_API_KEY
          if (!alApiKey) {
            safeLog(`[MarketplaceRefresh] Skipping ${segment} — no API key`)
            return
          }

          // Find the segment ID for this industry
          const { data: segmentRow } = await supabase
            .from('audience_lab_segments')
            .select('segment_id')
            .ilike('industry', `%${segment}%`)
            .limit(1)
            .maybeSingle()

          if (!segmentRow) {
            safeLog(`[MarketplaceRefresh] No segment found for ${segment}`)
            return
          }

          // Fetch leads from AudienceLab
          const { fetchLeadsFromSegment } = await import('@/lib/services/audiencelab.service')
          const leads = await fetchLeadsFromSegment(segmentRow.segment_id, {
            page: 1,
            pageSize: leadsPerSegment,
          })

          if (!leads || leads.length === 0) return

          // Transform and insert as marketplace leads
          const leadsToInsert = (leads as any[])
            .filter((lead) => {
              const email = lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL
              return email && typeof email === 'string' && email.includes('@')
            })
            .slice(0, leadsPerSegment)
            .map((lead) => ({
              first_name: lead.FIRST_NAME || '',
              last_name: lead.LAST_NAME || '',
              full_name: `${lead.FIRST_NAME || ''} ${lead.LAST_NAME || ''}`.trim() || 'Unknown',
              email: lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL || null,
              phone: lead.MOBILE_PHONE || lead.DIRECT_NUMBER || null,
              company_name: lead.COMPANY_NAME || '',
              job_title: lead.JOB_TITLE || lead.HEADLINE || '',
              source: 'audiencelab_marketplace',
              status: 'new',
              is_marketplace_listed: true,
              marketplace_status: 'available',
              marketplace_price: 0.60, // Base price
              verification_status: 'valid',
              intent_score: Math.floor(Math.random() * 40) + 40, // 40-80
              freshness_score: 90, // Fresh from today
              delivered_at: new Date().toISOString(),
              metadata: {
                city: lead.COMPANY_CITY || lead.PERSONAL_CITY,
                state: lead.COMPANY_STATE || lead.PERSONAL_STATE,
                domain: lead.COMPANY_DOMAIN,
                industry: lead.COMPANY_INDUSTRY || segment,
                employee_count: lead.COMPANY_EMPLOYEE_COUNT,
                revenue: lead.COMPANY_REVENUE,
                linkedin: lead.LINKEDIN_URL,
                uuid: lead.UUID,
                segment_source: segment,
              },
            }))

          if (leadsToInsert.length === 0) return

          // Deduplicate against existing marketplace leads by email
          const emails = leadsToInsert.map((l: any) => l.email).filter(Boolean)
          const { data: existingEmails } = await supabase
            .from('leads')
            .select('email')
            .in('email', emails)
            .eq('is_marketplace_listed', true)

          const existingSet = new Set((existingEmails || []).map((e: any) => e.email))
          const uniqueLeads = leadsToInsert.filter((l: any) => !existingSet.has(l.email))

          if (uniqueLeads.length === 0) return

          // Use the default workspace for marketplace leads
          // Marketplace leads don't belong to a specific workspace
          const { error } = await supabase
            .from('leads')
            .insert(uniqueLeads)

          if (error) {
            safeError(`[MarketplaceRefresh] Failed to insert ${segment} leads:`, error.message)
          } else {
            totalAdded += uniqueLeads.length
            safeLog(`[MarketplaceRefresh] Added ${uniqueLeads.length} leads from ${segment}`)
          }
        } catch (e) {
          safeError(`[MarketplaceRefresh] Error pulling ${segment}:`, e instanceof Error ? e.message : 'Unknown')
        }
      })
    }

    return { success: true, added: totalAdded, previousCount: currentCount }
  }
)
