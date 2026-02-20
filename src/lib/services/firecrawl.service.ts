/**
 * Firecrawl Service
 * Cursive Platform
 *
 * Service for scraping websites to extract company branding and information.
 */

import { safeWarn, safeError } from '@/lib/utils/log-sanitizer'

export interface WebsiteData {
  favicon_url: string | null
  logo_url: string | null
  company_name: string | null
  description: string | null
  industry_keywords: string[]
  primary_color: string | null
}

export class FirecrawlService {
  private apiKey: string
  private baseUrl = 'https://api.firecrawl.dev/v1'

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY || ''
    if (!this.apiKey) {
      safeWarn('FIRECRAWL_API_KEY not set')
    }
  }

  async scrapeWebsite(url: string): Promise<WebsiteData> {
    if (!this.apiKey) {
      throw new Error('Firecrawl API key not configured')
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: false,
          includeTags: ['meta', 'link', 'title', 'img', 'h1', 'p'],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Firecrawl API error: ${error}`)
      }

      const data = await response.json()
      return this.extractWebsiteData(data, url)
    } catch (error) {
      safeError('Firecrawl scrape error:', error)
      throw error
    }
  }

  private extractWebsiteData(data: any, url: string): WebsiteData {
    const html = data.data?.html || ''
    const markdown = data.data?.markdown || ''
    const metadata = data.data?.metadata || {}

    // Extract favicon
    let favicon_url = this.extractFavicon(html, url)

    // Extract logo from meta tags or common patterns
    let logo_url = this.extractLogo(html, metadata, url)

    // Extract company name
    const company_name = metadata.title?.split('|')[0]?.split('-')[0]?.trim() ||
                         metadata.ogTitle?.split('|')[0]?.split('-')[0]?.trim() ||
                         null

    // Extract description
    const description = metadata.description || metadata.ogDescription || null

    // Extract industry keywords from content
    const industry_keywords = this.extractKeywords(markdown, metadata)

    // Extract primary color from CSS or meta
    const primary_color = this.extractPrimaryColor(html, metadata)

    return {
      favicon_url,
      logo_url: logo_url || favicon_url, // Use favicon as fallback
      company_name,
      description,
      industry_keywords,
      primary_color,
    }
  }

  private extractFavicon(html: string, baseUrl: string): string | null {
    // Common favicon patterns
    const patterns = [
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        return this.resolveUrl(match[1], baseUrl)
      }
    }

    // Try default favicon location
    return `${new URL(baseUrl).origin}/favicon.ico`
  }

  private extractLogo(html: string, metadata: any, baseUrl: string): string | null {
    // Check Open Graph image first
    if (metadata.ogImage) {
      return this.resolveUrl(metadata.ogImage, baseUrl)
    }

    // Look for logo in common patterns
    const patterns = [
      /<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
      /<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*logo[^"']*["']/i,
      /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
      /<img[^>]*src=["']([^"']+logo[^"']+)["']/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        return this.resolveUrl(match[1], baseUrl)
      }
    }

    return null
  }

  private extractKeywords(markdown: string, metadata: any): string[] {
    const keywords: Set<string> = new Set()

    // Add keywords from meta tags
    if (metadata.keywords) {
      metadata.keywords.split(',').forEach((k: string) => {
        const keyword = k.trim().toLowerCase()
        if (keyword.length > 2 && keyword.length < 30) {
          keywords.add(keyword)
        }
      })
    }

    // Extract industry-related keywords from content
    const industryTerms = [
      'hvac', 'roofing', 'plumbing', 'electrical', 'solar',
      'real estate', 'insurance', 'home services', 'landscaping',
      'pest control', 'cleaning', 'auto', 'legal', 'financial', 'healthcare',
      'contractor', 'repair', 'installation', 'maintenance', 'service',
    ]

    const contentLower = markdown.toLowerCase()
    industryTerms.forEach((term) => {
      if (contentLower.includes(term)) {
        keywords.add(term)
      }
    })

    return Array.from(keywords).slice(0, 10)
  }

  private extractPrimaryColor(html: string, metadata: any): string | null {
    // Check theme-color meta tag
    if (metadata.themeColor) {
      return metadata.themeColor
    }

    // Look for theme-color in HTML
    const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)
    if (themeColorMatch?.[1]) {
      return themeColorMatch[1]
    }

    return null
  }

  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    if (url.startsWith('//')) {
      return `https:${url}`
    }
    if (url.startsWith('/')) {
      return `${new URL(baseUrl).origin}${url}`
    }
    return `${new URL(baseUrl).origin}/${url}`
  }
}

export const firecrawlService = new FirecrawlService()
