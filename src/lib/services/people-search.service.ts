// People Search Service
// Business logic for searching people using Clay API

import { ClayClient } from '@/lib/integrations/clay'
import { safeWarn, safeError } from '@/lib/utils/log-sanitizer'
import type { PeopleSearchFilters } from '@/lib/repositories/people-search.repository'

export interface PersonResult {
  first_name: string
  last_name: string
  full_name: string
  email: string
  email_revealed: boolean
  phone?: string
  title?: string
  seniority?: string
  department?: string
  company_name?: string
  company_domain?: string
  location?: string
  linkedin_url?: string
}

export class PeopleSearchService {
  private clayClient: ClayClient

  constructor() {
    this.clayClient = new ClayClient()
  }

  /**
   * Search for people based on filters
   */
  async searchPeople(
    filters: PeopleSearchFilters,
    limit: number = 50
  ): Promise<PersonResult[]> {
    try {
      // If domain is provided, use Clay's company enrichment
      if (filters.domain) {
        const clayFilters: any = {}

        if (filters.job_title) {
          clayFilters.job_titles = [filters.job_title]
        }

        if (filters.seniority) {
          clayFilters.seniority_levels = [filters.seniority]
        }

        if (filters.department) {
          clayFilters.departments = [filters.department]
        }

        if (filters.location) {
          clayFilters.locations = [filters.location]
        }

        const contacts = await this.clayClient.findContacts(
          filters.domain,
          clayFilters
        )

        // Transform Clay contacts to our format with emails hidden
        return contacts.map((contact) => ({
          first_name: contact.first_name,
          last_name: contact.last_name,
          full_name: contact.full_name,
          email: contact.email || '',
          email_revealed: false, // Email is hidden by default
          phone: contact.phone,
          title: contact.title,
          seniority: contact.seniority,
          department: contact.department,
          company_name: contact.company_name,
          company_domain: contact.company_domain,
          location: contact.location,
          linkedin_url: contact.linkedin_url,
        }))
      }

      // If company name is provided, search for company first then get contacts
      if (filters.company) {
        // This is a simplified version - in production you'd want to:
        // 1. Search for company by name to get domain
        // 2. Then use domain to find contacts
        // For now, return empty array as we need domain
        safeWarn(
          '[PeopleSearchService] Company name search requires domain lookup'
        )
        return []
      }

      // No valid search criteria
      throw new Error('Please provide either a company domain or company name')
    } catch (error: any) {
      safeError('[PeopleSearchService] Search error:', error)
      throw new Error(`Failed to search people: ${error.message}`)
    }
  }

  /**
   * Verify if email is valid
   */
  async verifyEmail(email: string): Promise<boolean> {
    try {
      const result = await this.clayClient.verifyEmail(email)
      return result.valid
    } catch (error) {
      safeError('[PeopleSearchService] Email verification error:', error)
      return false
    }
  }

  /**
   * Format person data for display
   */
  formatPersonDisplay(person: PersonResult): string {
    const parts = []

    parts.push(person.full_name)

    if (person.title) {
      parts.push(person.title)
    }

    if (person.company_name) {
      parts.push(`at ${person.company_name}`)
    }

    if (person.location) {
      parts.push(`in ${person.location}`)
    }

    return parts.join(' ')
  }

  /**
   * Mask email for display before reveal
   */
  maskEmail(email: string): string {
    if (!email) return '***@***.***'

    const [username, domain] = email.split('@')

    if (!username || !domain) return '***@***.***'

    // Show first 2 chars of username
    const maskedUsername =
      username.length > 2
        ? username.substring(0, 2) + '*'.repeat(username.length - 2)
        : username

    // Show first char of domain
    const [domainName, tld] = domain.split('.')
    const maskedDomain = domainName.charAt(0) + '*'.repeat(domainName.length - 1)

    return `${maskedUsername}@${maskedDomain}.${tld}`
  }

  /**
   * Calculate search cost in credits
   */
  calculateSearchCost(resultsCount: number): number {
    // Each email reveal costs 1 credit
    // The search itself is free, only revealing emails costs credits
    return 0
  }

  /**
   * Calculate export cost in credits
   */
  calculateExportCost(resultsCount: number): number {
    // Export costs 1 credit per result (to reveal all emails)
    return resultsCount
  }
}
