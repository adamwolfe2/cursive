/**
 * Website Scraper Function
 * Cursive Platform
 *
 * Background job to scrape website and extract branding information.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { firecrawlService } from '@/lib/services/firecrawl.service'
import { tavilyService } from '@/lib/services/tavily.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export const scrapeWebsite = inngest.createFunction(
  {
    id: 'scrape-website',
    retries: 2,
    timeouts: { finish: "5m" },
  },
  { event: 'workspace/scrape-website' },
  async ({ event, step }) => {
    const { workspaceId, websiteUrl } = event.data

    if (!workspaceId || !websiteUrl) {
      throw new Error('Missing workspaceId or websiteUrl')
    }

    // Update status to processing
    await step.run('update-status-processing', async () => {
      const supabase = createAdminClient()
      await supabase
        .from('workspaces')
        .update({ scrape_status: 'processing' })
        .eq('id', workspaceId)
    })

    // Try Firecrawl first
    const websiteData = await step.run('scrape-with-firecrawl', async () => {
      try {
        const data = await firecrawlService.scrapeWebsite(websiteUrl)
        return { success: true as const, data }
      } catch (error: any) {
        safeError('Firecrawl failed:', error.message)
        return { success: false as const, data: null, error: error.message }
      }
    })

    // Fallback to Tavily if Firecrawl fails
    let finalData = websiteData.success ? websiteData.data : null

    if (!websiteData.success) {
      const tavilyData = await step.run('fallback-to-tavily', async () => {
        try {
          // Extract domain for company name
          const domain = new URL(websiteUrl).hostname.replace('www.', '')
          const companyName = domain.split('.')[0]

          const data = await tavilyService.searchCompany(companyName, domain)
          return { success: true as const, data }
        } catch (error: any) {
          safeError('Tavily failed:', error.message)
          return { success: false as const, data: null, error: error.message }
        }
      })

      if (tavilyData.success && tavilyData.data) {
        finalData = {
          favicon_url: null,
          logo_url: tavilyData.data.logo_url,
          company_name: tavilyData.data.company_name,
          description: tavilyData.data.description,
          industry_keywords: tavilyData.data.keywords,
          primary_color: null,
        }
      }
    }

    // Update workspace with scraped data
    await step.run('update-workspace', async () => {
      const supabase = createAdminClient()

      if (finalData) {
        await supabase
          .from('workspaces')
          .update({
            company_description: finalData.description,
            industry_keywords: finalData.industry_keywords,
            branding: {
              logo_url: finalData.logo_url,
              favicon_url: finalData.favicon_url,
              primary_color: finalData.primary_color || '#007AFF',
              secondary_color: '#0062cc',
            },
            scrape_status: 'completed',
          })
          .eq('id', workspaceId)
      } else {
        // Mark as failed but don't block
        await supabase
          .from('workspaces')
          .update({
            scrape_status: 'failed',
            branding: {
              logo_url: null,
              primary_color: '#007AFF',
              secondary_color: '#0062cc',
            },
          })
          .eq('id', workspaceId)
      }
    })

    return {
      workspace_id: workspaceId,
      success: !!finalData,
      data: finalData,
    }
  }
)
