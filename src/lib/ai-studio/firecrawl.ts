/**
 * Firecrawl Integration - Brand DNA Extraction
 * Uses Firecrawl API to scrape websites and extract brand assets
 */

import FirecrawlApp from '@mendable/firecrawl-js'
import { logApiCall } from '@/lib/services/api-logger'
import { safeError } from '@/lib/utils/log-sanitizer'

function getFirecrawlClient() {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY is not set in environment variables')
  }
  return new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  })
}

export interface BrandDNA {
  company_name: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  heading_font: string
  body_font: string
  headline: string
  tagline: string
  value_propositions: string[]
  brand_personality: string[]
  images: string[]
  hero_images: string[]
  product_images: string[]
  team_images: string[]
  icon_urls: string[]
  og_image: string | null
  meta_description: string
}

export interface FirecrawlResult {
  url: string
  markdown: string
  html: string
  links: string[]
  screenshot: string
  brandData: BrandDNA
}

/**
 * Extract brand DNA from a website URL
 */
export async function extractBrandDNA(url: string): Promise<FirecrawlResult> {
  try {
    const firecrawl = getFirecrawlClient()

    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

    // 1. Scrape the website for content and assets
    const scrapeStart = Date.now()
    const scrapeResult: any = await firecrawl.scrape(normalizedUrl, {
      formats: ['markdown', 'html', 'links', 'screenshot'],
      onlyMainContent: true,
      includeTags: ['img', 'link', 'meta', 'style'],
    } as any)
    logApiCall({ service: 'firecrawl', endpoint: 'scrape', durationMs: Date.now() - scrapeStart,
      statusCode: scrapeResult?.success === false ? 500 : 200,
      metadata: { url: normalizedUrl } })

    // 2. Extract comprehensive brand intelligence with LLM
    const extractionSchema = {
      type: 'object',
      properties: {
        company_name: {
          type: 'string',
          description: 'The company or brand name'
        },
        logo_url: {
          type: 'string',
          description: 'URL to the company logo image (typically in header or footer)'
        },
        favicon_url: {
          type: 'string',
          description: 'URL to the favicon icon'
        },
        primary_color: {
          type: 'string',
          description: 'Primary brand color in hex format (most dominant brand color, often used in CTAs and headers)'
        },
        secondary_color: {
          type: 'string',
          description: 'Secondary brand color in hex format (supporting color)'
        },
        accent_color: {
          type: 'string',
          description: 'Accent brand color in hex format (used for highlights and emphasis)'
        },
        background_color: {
          type: 'string',
          description: 'Primary background color in hex format'
        },
        heading_font: {
          type: 'string',
          description: 'Font family used for headings and titles'
        },
        body_font: {
          type: 'string',
          description: 'Font family used for body text and paragraphs'
        },
        headline: {
          type: 'string',
          description: 'Main hero headline or H1 from the homepage'
        },
        tagline: {
          type: 'string',
          description: 'Company tagline or slogan (short memorable phrase)'
        },
        value_propositions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key value propositions and benefits (3-5 main points the company emphasizes)'
        },
        brand_personality: {
          type: 'array',
          items: { type: 'string' },
          description: 'Brand personality traits (e.g., professional, playful, innovative, trustworthy)'
        },
        hero_images: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of hero/banner images from homepage'
        },
        product_images: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of product or service images'
        },
        team_images: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of team or people images'
        },
        icon_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of icons used on the site (feature icons, social icons, etc.)'
        },
        og_image: {
          type: 'string',
          description: 'Open Graph image URL (social media preview image)'
        },
        meta_description: {
          type: 'string',
          description: 'Meta description from the site (concise company description)'
        },
      },
      required: ['company_name', 'primary_color', 'headline', 'tagline', 'meta_description']
    }

    const extractResult: any = await firecrawl.scrape(normalizedUrl, {
      formats: ['extract'],
      extract: {
        schema: extractionSchema,
      }
    } as any)

    // 3. Return combined result with comprehensive brand intelligence
    return {
      url: normalizedUrl,
      markdown: scrapeResult.markdown || '',
      html: scrapeResult.html || '',
      links: scrapeResult.links || [],
      screenshot: scrapeResult.screenshot || '',
      brandData: {
        company_name: extractResult.extract?.company_name || 'Unknown Company',
        logo_url: extractResult.extract?.logo_url || null,
        favicon_url: extractResult.extract?.favicon_url || null,
        primary_color: extractResult.extract?.primary_color || '#0082FB',
        secondary_color: extractResult.extract?.secondary_color || '#4B5563',
        accent_color: extractResult.extract?.accent_color || '#60A5FA',
        background_color: extractResult.extract?.background_color || '#F6F6F8',
        heading_font: extractResult.extract?.heading_font || 'Inter',
        body_font: extractResult.extract?.body_font || 'Inter',
        headline: extractResult.extract?.headline || '',
        tagline: extractResult.extract?.tagline || '',
        value_propositions: extractResult.extract?.value_propositions || [],
        brand_personality: extractResult.extract?.brand_personality || [],
        images: (extractResult.extract?.images || []).slice(0, 10),
        hero_images: extractResult.extract?.hero_images || [],
        product_images: extractResult.extract?.product_images || [],
        team_images: extractResult.extract?.team_images || [],
        icon_urls: extractResult.extract?.icon_urls || [],
        og_image: extractResult.extract?.og_image || null,
        meta_description: extractResult.extract?.meta_description || '',
      }
    }
  } catch (error: any) {
    safeError('[Firecrawl] Error extracting brand DNA:', error)
    throw new Error(`Failed to extract brand DNA: ${error.message}`)
  }
}

/**
 * Validate a URL before extraction
 */
export function isValidUrl(url: string): boolean {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    new URL(normalized)
    return true
  } catch {
    return false
  }
}
