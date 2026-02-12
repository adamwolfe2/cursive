/**
 * Lead Data Processor Service
 * Cursive Platform
 *
 * Comprehensive data validation, auto-correction, and normalization
 * for lead imports. This is the main entry point that orchestrates
 * all the data cleaning services.
 */

import { fieldMapper, type FieldMapping, type MappingResult } from './field-mapper.service'
import { addressStandardization, type StandardizedAddress } from './address-standardization.service'
import { geocodingService, type GeocodingResult } from './geocoding.service'

// ============================================
// TYPES
// ============================================

export interface ProcessedLead {
  // Person
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  phone?: string
  phone_formatted?: string
  job_title?: string
  department?: string
  seniority_level?: string
  linkedin_url?: string

  // Company
  company_name?: string
  company_domain?: string
  company_industry?: string
  company_size?: string
  company_revenue?: string

  // Location (normalized)
  address?: string
  address_line_2?: string
  city?: string
  city_normalized?: string
  state?: string
  state_abbrev?: string
  state_full?: string
  region?: string
  postal_code?: string
  country?: string
  country_code?: string

  // Geocoding
  latitude?: number
  longitude?: number
  geocode_accuracy?: string
  geocode_source?: string

  // Meta
  lead_source?: string
  intent_score?: number
  notes?: string
  tags?: string[]

  // Processing metadata
  _raw?: Record<string, string>
  _corrections: string[]
  _warnings: string[]
  _errors: string[]
  _valid: boolean
}

export interface ProcessingOptions {
  /**
   * Whether to auto-correct data issues
   */
  autoCorrect?: boolean

  /**
   * Whether to geocode addresses
   */
  geocode?: boolean

  /**
   * Whether to validate email format
   */
  validateEmail?: boolean

  /**
   * Whether to normalize phone numbers
   */
  normalizePhone?: boolean

  /**
   * Whether to normalize addresses
   */
  normalizeAddress?: boolean

  /**
   * Custom field mappings (override auto-detection)
   */
  fieldMappings?: FieldMapping[]

  /**
   * Default values for missing fields
   */
  defaults?: Partial<ProcessedLead>
}

export interface ProcessingResult {
  /**
   * Successfully processed leads
   */
  leads: ProcessedLead[]

  /**
   * Summary statistics
   */
  summary: {
    total: number
    valid: number
    invalid: number
    corrected: number
    geocoded: number
  }

  /**
   * Field mapping information
   */
  mappings: MappingResult

  /**
   * Aggregated errors
   */
  errors: Array<{
    row: number
    field: string
    message: string
    value?: string
  }>

  /**
   * Processing warnings
   */
  warnings: string[]
}

// ============================================
// DATA PROCESSOR CLASS
// ============================================

export class LeadDataProcessorService {
  private defaultOptions: ProcessingOptions = {
    autoCorrect: true,
    geocode: false, // Disabled by default (requires API calls)
    validateEmail: true,
    normalizePhone: true,
    normalizeAddress: true,
    defaults: {
      country: 'United States',
      country_code: 'US',
    },
  }

  /**
   * Process a CSV file (parsed as array of row objects)
   */
  async processCSV(
    rows: Array<Record<string, string>>,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const opts = { ...this.defaultOptions, ...options }

    // Get headers from first row
    if (rows.length === 0) {
      return {
        leads: [],
        summary: { total: 0, valid: 0, invalid: 0, corrected: 0, geocoded: 0 },
        mappings: { mappings: [], unmappedHeaders: [], missingRequired: [], warnings: [] },
        errors: [],
        warnings: ['No data rows found'],
      }
    }

    const headers = Object.keys(rows[0])

    // Map headers to standard fields
    const mappings = opts.fieldMappings
      ? { mappings: opts.fieldMappings, unmappedHeaders: [], missingRequired: [], warnings: [] }
      : fieldMapper.mapHeaders(headers)

    // Process each row
    const leads: ProcessedLead[] = []
    const errors: ProcessingResult['errors'] = []
    let correctedCount = 0
    let geocodedCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const result = await this.processRow(row, mappings.mappings, opts, i + 1)

      if (result._errors.length > 0) {
        for (const error of result._errors) {
          errors.push({
            row: i + 1,
            field: error.split(':')[0] || 'unknown',
            message: error,
            value: row[error.split(':')[0]] || undefined,
          })
        }
      }

      if (result._corrections.length > 0) {
        correctedCount++
      }

      if (result.latitude && result.longitude) {
        geocodedCount++
      }

      leads.push(result)
    }

    const validLeads = leads.filter((l) => l._valid)
    const invalidLeads = leads.filter((l) => !l._valid)

    return {
      leads,
      summary: {
        total: rows.length,
        valid: validLeads.length,
        invalid: invalidLeads.length,
        corrected: correctedCount,
        geocoded: geocodedCount,
      },
      mappings,
      errors,
      warnings: mappings.warnings,
    }
  }

  /**
   * Process a single row of data
   */
  async processRow(
    row: Record<string, string>,
    mappings: FieldMapping[],
    options: ProcessingOptions,
    rowNumber: number
  ): Promise<ProcessedLead> {
    const corrections: string[] = []
    const warnings: string[] = []
    const errors: string[] = []

    // Transform row using field mappings
    const transformed = fieldMapper.transformRow(row, mappings)

    // Build processed lead
    const lead: ProcessedLead = {
      _raw: row,
      _corrections: corrections,
      _warnings: warnings,
      _errors: errors,
      _valid: true,
    }

    // ============================================
    // PERSON FIELDS
    // ============================================

    // Handle name fields
    if (transformed.full_name) {
      lead.full_name = this.cleanString(transformed.full_name)
      // Try to split into first/last if not provided
      if (!transformed.first_name && !transformed.last_name) {
        const nameParts = lead.full_name!.split(' ')
        if (nameParts.length >= 2) {
          lead.first_name = nameParts[0]
          lead.last_name = nameParts.slice(1).join(' ')
        }
      }
    }

    if (transformed.first_name) {
      lead.first_name = this.cleanString(transformed.first_name)
    }

    if (transformed.last_name) {
      lead.last_name = this.cleanString(transformed.last_name)
    }

    // Build full name if we have parts
    if (!lead.full_name && lead.first_name) {
      lead.full_name = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
    }

    // Email validation
    if (transformed.email) {
      const email = transformed.email.toLowerCase().trim()
      if (options.validateEmail) {
        if (this.isValidEmail(email)) {
          lead.email = email
        } else {
          errors.push(`email: Invalid email format "${transformed.email}"`)
          lead._valid = false
        }
      } else {
        lead.email = email
      }
    } else {
      // Email is required
      errors.push('email: Email is required')
      lead._valid = false
    }

    // Phone normalization
    if (transformed.phone && options.normalizePhone) {
      const phoneResult = addressStandardization.standardizePhone(transformed.phone)
      lead.phone = phoneResult.digits
      lead.phone_formatted = phoneResult.formatted
      if (!phoneResult.is_valid) {
        warnings.push(`phone: Could not validate phone number "${transformed.phone}"`)
      }
    } else if (transformed.phone) {
      lead.phone = transformed.phone
    }

    // Other person fields
    lead.job_title = this.cleanString(transformed.job_title)
    lead.department = this.cleanString(transformed.department)
    lead.seniority_level = this.cleanString(transformed.seniority_level)
    lead.linkedin_url = this.cleanString(transformed.linkedin_url)

    // ============================================
    // COMPANY FIELDS
    // ============================================

    if (transformed.company_name) {
      lead.company_name = this.cleanString(transformed.company_name)
    } else {
      errors.push('company_name: Company name is required')
      lead._valid = false
    }

    lead.company_domain = this.cleanString(transformed.company_domain)
    lead.company_industry = this.normalizeIndustry(transformed.company_industry)
    lead.company_size = this.normalizeCompanySize(transformed.company_size)
    lead.company_revenue = this.normalizeRevenue(transformed.company_revenue)

    // ============================================
    // LOCATION FIELDS
    // ============================================

    if (options.normalizeAddress) {
      const addressResult = addressStandardization.standardizeAddress({
        address: transformed.address,
        address_line_2: transformed.address_line_2,
        city: transformed.city,
        state: transformed.state,
        postal_code: transformed.postal_code,
        country: transformed.country || options.defaults?.country,
      })

      lead.address = addressResult.address
      lead.address_line_2 = addressResult.address_line_2
      lead.city = addressResult.city
      lead.city_normalized = addressResult.city
      lead.state = addressResult.state_abbrev || addressResult.state
      lead.state_abbrev = addressResult.state_abbrev
      lead.state_full = addressResult.state_full
      lead.region = addressResult.region
      lead.postal_code = addressResult.postal_code
      lead.country = addressResult.country
      lead.country_code = addressResult.country_code

      if (addressResult.corrections.length > 0) {
        corrections.push(...addressResult.corrections)
      }
    } else {
      lead.city = this.cleanString(transformed.city)
      lead.state = this.cleanString(transformed.state)
      lead.postal_code = this.cleanString(transformed.postal_code)
      lead.country = this.cleanString(transformed.country) || options.defaults?.country
    }

    // ============================================
    // GEOCODING
    // ============================================

    if (options.geocode && (lead.city || lead.postal_code || lead.address)) {
      try {
        const geocodeResult = await geocodingService.geocode({
          address: lead.address,
          city: lead.city,
          state: lead.state,
          postal_code: lead.postal_code,
          country: lead.country,
        })

        if (geocodeResult) {
          lead.latitude = geocodeResult.latitude
          lead.longitude = geocodeResult.longitude
          lead.geocode_accuracy = geocodeResult.accuracy
          lead.geocode_source = geocodeResult.source

          // Update normalized fields from geocoding if available
          if (geocodeResult.normalized) {
            if (geocodeResult.normalized.city && !lead.city_normalized) {
              lead.city_normalized = geocodeResult.normalized.city
            }
            if (geocodeResult.normalized.state_abbrev && !lead.state_abbrev) {
              lead.state_abbrev = geocodeResult.normalized.state_abbrev
            }
          }
        }
      } catch (error) {
        warnings.push(`geocoding: Failed to geocode address for row ${rowNumber}`)
      }
    }

    // ============================================
    // META FIELDS
    // ============================================

    lead.lead_source = this.cleanString(transformed.lead_source)

    if (transformed.intent_score) {
      const score = parseFloat(transformed.intent_score)
      if (!isNaN(score)) {
        lead.intent_score = Math.min(100, Math.max(0, score))
      }
    }

    lead.notes = this.cleanString(transformed.notes)

    if (transformed.tags) {
      lead.tags = transformed.tags
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter(Boolean)
    }

    return lead
  }

  /**
   * Preview import without saving (for UI preview)
   */
  async previewImport(
    rows: Array<Record<string, string>>,
    options: ProcessingOptions = {}
  ): Promise<{
    mappings: MappingResult
    sampleRows: ProcessedLead[]
    summary: {
      totalRows: number
      sampleSize: number
      estimatedValid: number
      estimatedInvalid: number
    }
  }> {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    const mappings = fieldMapper.mapHeaders(headers)

    // Process a sample of rows (max 10)
    const sampleSize = Math.min(rows.length, 10)
    const sampleRows = rows.slice(0, sampleSize)

    const result = await this.processCSV(sampleRows, {
      ...options,
      geocode: false, // Skip geocoding for preview
    })

    // Estimate totals based on sample
    const validRate = result.summary.valid / result.summary.total
    const estimatedValid = Math.round(rows.length * validRate)
    const estimatedInvalid = rows.length - estimatedValid

    return {
      mappings,
      sampleRows: result.leads,
      summary: {
        totalRows: rows.length,
        sampleSize,
        estimatedValid,
        estimatedInvalid,
      },
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private cleanString(value: string | undefined | null): string | undefined {
    if (!value) return undefined
    const cleaned = value.trim()
    return cleaned.length > 0 ? cleaned : undefined
  }

  private isValidEmail(email: string): boolean {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return false

    // Check for common invalid patterns
    const invalidPatterns = [
      /^test@/i,
      /^example@/i,
      /^sample@/i,
      /@example\./i,
      /@test\./i,
      /@localhost/i,
      /\.invalid$/i,
    ]

    return !invalidPatterns.some((pattern) => pattern.test(email))
  }

  private normalizeIndustry(industry: string | undefined): string | undefined {
    if (!industry) return undefined

    const cleaned = industry.trim()

    // Map common variations to standard names
    const industryMap: Record<string, string> = {
      'tech': 'Technology',
      'software': 'Technology',
      'it': 'Technology',
      'information technology': 'Technology',
      'saas': 'Technology',
      'finance': 'Financial Services',
      'financial': 'Financial Services',
      'banking': 'Financial Services',
      'fintech': 'Financial Services',
      'health': 'Healthcare',
      'medical': 'Healthcare',
      'pharma': 'Healthcare',
      'pharmaceutical': 'Healthcare',
      'retail': 'Retail',
      'ecommerce': 'Retail',
      'e-commerce': 'Retail',
      'manufacturing': 'Manufacturing',
      'education': 'Education',
      'edtech': 'Education',
      'real estate': 'Real Estate',
      'realestate': 'Real Estate',
      'property': 'Real Estate',
      'marketing': 'Marketing & Advertising',
      'advertising': 'Marketing & Advertising',
      'media': 'Media & Entertainment',
      'entertainment': 'Media & Entertainment',
    }

    const normalized = cleaned.toLowerCase()
    return industryMap[normalized] || this.toTitleCase(cleaned)
  }

  private normalizeCompanySize(size: string | undefined): string | undefined {
    if (!size) return undefined

    const cleaned = size.trim().toLowerCase()

    // Extract numbers
    const numbers = cleaned.match(/\d+/g)
    if (!numbers) return size

    const firstNum = parseInt(numbers[0], 10)

    // Categorize into standard ranges
    if (firstNum <= 10) return '1-10'
    if (firstNum <= 50) return '11-50'
    if (firstNum <= 200) return '51-200'
    if (firstNum <= 500) return '201-500'
    if (firstNum <= 1000) return '501-1000'
    if (firstNum <= 5000) return '1001-5000'
    if (firstNum <= 10000) return '5001-10000'
    return '10000+'
  }

  private normalizeRevenue(revenue: string | undefined): string | undefined {
    if (!revenue) return undefined

    const cleaned = revenue.trim().toLowerCase()

    // Try to extract numeric value
    const match = cleaned.match(/[\d,.]+\s*(k|m|b|million|billion|thousand)?/i)
    if (!match) return revenue

    let value = parseFloat(match[0].replace(/[,\s]/g, ''))
    const multiplier = match[1]?.toLowerCase()

    if (multiplier === 'k' || multiplier === 'thousand') value *= 1000
    if (multiplier === 'm' || multiplier === 'million') value *= 1000000
    if (multiplier === 'b' || multiplier === 'billion') value *= 1000000000

    // Categorize into standard ranges
    if (value < 1000000) return '<$1M'
    if (value < 5000000) return '$1M-$5M'
    if (value < 10000000) return '$5M-$10M'
    if (value < 50000000) return '$10M-$50M'
    if (value < 100000000) return '$50M-$100M'
    if (value < 500000000) return '$100M-$500M'
    if (value < 1000000000) return '$500M-$1B'
    return '$1B+'
  }

  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

// Export singleton instance
export const leadDataProcessor = new LeadDataProcessorService()
