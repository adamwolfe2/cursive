/**
 * Website Scraper Function
 * Cursive Platform
 *
 * Background job to scrape website and extract branding information.
 */

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { firecrawlService } from '@/lib/services/firecrawl.service'
import { tavilyService } from '@/lib/services/tavily.service'

export const scrapeWebsite = inngest.createFunction(
  {
    id: 'scrape-website',
    retries: 2,
  },
  { event: 'workspace/scrape-website' },
  async ({ event, step }) => {
    const { workspace_id, website_url } = event.data

    if (!workspace_id || !website_url) {
      throw new Error('Missing workspace_id or website_url')
    }

    // Update status to processing
    await step.run('update-status-processing', async () => {
      const supabase = await createClient()
      await supabase
        .from('workspaces')
        .update({ scrape_status: 'processing' })
        .eq('id', workspace_id)
    })

    // Try Firecrawl first
    const websiteData = await step.run('scrape-with-firecrawl', async () => {
      try {
        const data = await firecrawlService.scrapeWebsite(website_url)
        return { success: true, data }
      } catch (error: any) {
        console.error('Firecrawl failed:', error.message)
        return { success: false, error: error.message }
      }
    })

    // Fallback to Tavily if Firecrawl fails
    let finalData = websiteData.success ? websiteData.data : null

    if (!websiteData.success) {
      const tavilyData = await step.run('fallback-to-tavily', async () => {
        try {
          // Extract domain for company name
          const domain = new URL(website_url).hostname.replace('www.', '')
          const companyName = domain.split('.')[0]

          const data = await tavilyService.searchCompany(companyName, domain)
          return { success: true, data }
        } catch (error: any) {
          console.error('Tavily failed:', error.message)
          return { success: false, error: error.message }
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
      const supabase = await createClient()

      if (finalData) {
        await supabase
          .from('workspaces')
          .update({
            company_description: finalData.description,
            industry_keywords: finalData.industry_keywords,
            branding: {
              logo_url: finalData.logo_url,
              favicon_url: finalData.favicon_url,
              primary_color: finalData.primary_color || '#7c3aed',
              secondary_color: '#4f46e5',
            },
            scrape_status: 'completed',
          })
          .eq('id', workspace_id)
      } else {
        // Mark as failed but don't block
        await supabase
          .from('workspaces')
          .update({
            scrape_status: 'failed',
            branding: {
              logo_url: null,
              primary_color: '#7c3aed',
              secondary_color: '#4f46e5',
            },
          })
          .eq('id', workspace_id)
      }
    })

    return {
      workspace_id,
      success: !!finalData,
      data: finalData,
    }
  }
)
