/**
 * Tavily Service
 * Cursive Platform
 *
 * Fallback service for company research when Firecrawl fails.
 */

export interface CompanyResearchResult {
  company_name: string | null
  description: string | null
  logo_url: string | null
  industry: string | null
  keywords: string[]
}

export class TavilyService {
  private apiKey: string
  private baseUrl = 'https://api.tavily.com'

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || ''
    if (!this.apiKey) {
      console.warn('TAVILY_API_KEY not set')
    }
  }

  async searchCompany(companyName: string, domain: string): Promise<CompanyResearchResult> {
    if (!this.apiKey) {
      throw new Error('Tavily API key not configured')
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          query: `${companyName} company ${domain}`,
          search_depth: 'advanced',
          include_images: true,
          include_answer: true,
          max_results: 5,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Tavily API error: ${error}`)
      }

      const data = await response.json()
      return this.extractCompanyInfo(data, companyName)
    } catch (error) {
      console.error('Tavily search error:', error)
      throw error
    }
  }

  private extractCompanyInfo(data: any, companyName: string): CompanyResearchResult {
    const answer = data.answer || ''
    const results = data.results || []
    const images = data.images || []

    // Find logo from images
    let logo_url: string | null = null
    for (const image of images) {
      const imageLower = image.toLowerCase()
      if (imageLower.includes('logo') || imageLower.includes(companyName.toLowerCase())) {
        logo_url = image
        break
      }
    }

    // Extract description from answer or first result
    const description = answer || results[0]?.content?.slice(0, 500) || null

    // Try to identify industry from content
    const industry = this.identifyIndustry(answer + ' ' + results.map((r: any) => r.content).join(' '))

    // Extract keywords
    const keywords = this.extractKeywords(answer + ' ' + results.map((r: any) => r.content).join(' '))

    return {
      company_name: companyName,
      description,
      logo_url,
      industry,
      keywords,
    }
  }

  private identifyIndustry(content: string): string | null {
    const contentLower = content.toLowerCase()

    const industryMap: Record<string, string[]> = {
      'HVAC': ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace'],
      'Roofing': ['roofing', 'roof repair', 'roof installation', 'shingles'],
      'Plumbing': ['plumbing', 'plumber', 'pipe', 'drain', 'water heater'],
      'Electrical': ['electrical', 'electrician', 'wiring', 'circuit'],
      'Solar': ['solar', 'photovoltaic', 'solar panel', 'renewable energy'],
      'Real Estate': ['real estate', 'realtor', 'property', 'home sale', 'listing'],
      'Insurance': ['insurance', 'policy', 'coverage', 'claims'],
      'Landscaping': ['landscaping', 'lawn care', 'garden', 'irrigation'],
      'Pest Control': ['pest control', 'exterminator', 'termite', 'rodent'],
      'Home Services': ['home services', 'handyman', 'home repair'],
    }

    for (const [industry, keywords] of Object.entries(industryMap)) {
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) {
          return industry
        }
      }
    }

    return null
  }

  private extractKeywords(content: string): string[] {
    const keywords: Set<string> = new Set()
    const contentLower = content.toLowerCase()

    const relevantTerms = [
      'service', 'professional', 'quality', 'licensed', 'insured',
      'residential', 'commercial', 'repair', 'installation', 'maintenance',
      'emergency', '24/7', 'free estimate', 'affordable', 'reliable',
    ]

    for (const term of relevantTerms) {
      if (contentLower.includes(term)) {
        keywords.add(term)
      }
    }

    return Array.from(keywords).slice(0, 10)
  }
}

export const tavilyService = new TavilyService()
