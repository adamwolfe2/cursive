/**
 * Upload Handler Service
 *
 * Handles manual data imports from CSV, Excel, and JSON files.
 * Features:
 * - Field mapping interface
 * - Data validation and normalization
 * - Deduplication
 * - Batch processing with progress tracking
 */

import { createClient } from '@/lib/supabase/server'
import { DatabaseError, ValidationError } from '@/types'
import { createMatchingEngine } from './matching-engine.service'

// ============================================================================
// TYPES
// ============================================================================

export interface FieldMapping {
  sourceColumn: string
  targetField: string
  transform?: 'lowercase' | 'uppercase' | 'trim' | 'phone_normalize' | 'zip_5digit' | 'state_code' | 'email_normalize'
  required?: boolean
  defaultValue?: string
}

export interface UploadConfig {
  workspaceId: string
  fileName: string
  fileType: 'csv' | 'xlsx' | 'json'
  sourceId?: string
  defaultSourceName?: string
  mappings: FieldMapping[]
  skipInvalidRows: boolean
  dedupeStrategy: 'email' | 'phone' | 'name_address' | 'none'
  dedupeWindowDays: number
  routeLeads: boolean // Whether to auto-route after import
}

export interface UploadPreview {
  columns: string[]
  sampleRows: Record<string, string>[]
  totalRows: number
  suggestedMappings: FieldMapping[]
}

export interface UploadProgress {
  jobId: string
  status: 'pending' | 'mapping' | 'validating' | 'processing' | 'completed' | 'failed' | 'cancelled'
  totalRows: number
  processedRows: number
  validRows: number
  invalidRows: number
  duplicateRows: number
  createdLeads: number
  routedLeads: number
  errors: Array<{ row: number; error: string; data?: Record<string, string> }>
}

// Target field definitions
const TARGET_FIELDS = {
  // Contact
  first_name: { label: 'First Name', aliases: ['firstname', 'first', 'fname', 'given_name'] },
  last_name: { label: 'Last Name', aliases: ['lastname', 'last', 'lname', 'surname', 'family_name'] },
  full_name: { label: 'Full Name', aliases: ['name', 'fullname', 'contact_name'] },
  email: { label: 'Email', aliases: ['email_address', 'emailaddress', 'e-mail', 'e_mail'] },
  phone: { label: 'Phone', aliases: ['phone_number', 'phonenumber', 'telephone', 'mobile', 'cell', 'work_phone'] },
  linkedin_url: { label: 'LinkedIn URL', aliases: ['linkedin', 'linkedin_profile'] },

  // Company
  company_name: { label: 'Company Name', aliases: ['company', 'organization', 'business_name', 'employer'] },
  job_title: { label: 'Job Title', aliases: ['title', 'position', 'role', 'job'] },
  company_domain: { label: 'Company Domain', aliases: ['domain', 'website', 'company_website'] },

  // Location
  address: { label: 'Address', aliases: ['street', 'street_address', 'address1', 'mailing_address'] },
  city: { label: 'City', aliases: ['town', 'locality'] },
  state: { label: 'State', aliases: ['state_code', 'province', 'region'] },
  postal_code: { label: 'Zip Code', aliases: ['zip', 'zipcode', 'zip_code', 'postcode'] },
  country: { label: 'Country', aliases: ['country_code', 'nation'] },

  // Industry
  industry: { label: 'Industry', aliases: ['sector', 'vertical', 'company_industry'] },
  sic_code: { label: 'SIC Code', aliases: ['sic', 'industry_code'] },
}

// ============================================================================
// UPLOAD HANDLER SERVICE
// ============================================================================

export class UploadHandlerService {
  private workspaceId: string

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  /**
   * Create a preview from uploaded file data
   */
  async createPreview(
    data: Record<string, string>[],
    fileName: string,
    fileType: 'csv' | 'xlsx' | 'json'
  ): Promise<UploadPreview> {
    if (!data || data.length === 0) {
      throw new ValidationError('File is empty or could not be parsed')
    }

    const columns = Object.keys(data[0])
    const sampleRows = data.slice(0, 10)
    const suggestedMappings = this.suggestMappings(columns)

    return {
      columns,
      sampleRows,
      totalRows: data.length,
      suggestedMappings,
    }
  }

  /**
   * Suggest field mappings based on column names
   */
  suggestMappings(columns: string[]): FieldMapping[] {
    const mappings: FieldMapping[] = []

    for (const column of columns) {
      const normalizedColumn = column.toLowerCase().replace(/[^a-z0-9]/g, '_')

      for (const [targetField, config] of Object.entries(TARGET_FIELDS)) {
        // Check exact match or alias match
        if (
          normalizedColumn === targetField ||
          config.aliases.some((alias) => normalizedColumn === alias || normalizedColumn.includes(alias))
        ) {
          mappings.push({
            sourceColumn: column,
            targetField,
            transform: this.getDefaultTransform(targetField),
          })
          break
        }
      }
    }

    return mappings
  }

  /**
   * Get default transform for a target field
   */
  private getDefaultTransform(
    targetField: string
  ): 'lowercase' | 'uppercase' | 'trim' | 'phone_normalize' | 'zip_5digit' | 'state_code' | 'email_normalize' | undefined {
    switch (targetField) {
      case 'email':
        return 'email_normalize'
      case 'phone':
        return 'phone_normalize'
      case 'postal_code':
        return 'zip_5digit'
      case 'state':
        return 'state_code'
      default:
        return 'trim'
    }
  }

  /**
   * Create an upload job
   */
  async createUploadJob(config: UploadConfig): Promise<string> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('upload_jobs')
      .insert({
        workspace_id: this.workspaceId,
        file_name: config.fileName,
        file_type: config.fileType,
        field_mappings: config.mappings,
        source_id: config.sourceId,
        default_source_name: config.defaultSourceName || config.fileName,
        skip_invalid_rows: config.skipInvalidRows,
        dedupe_strategy: config.dedupeStrategy,
        dedupe_window_days: config.dedupeWindowDays,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      throw new DatabaseError(`Failed to create upload job: ${error.message}`)
    }

    return data.id
  }

  /**
   * Process an upload job
   */
  async processUpload(
    jobId: string,
    data: Record<string, string>[],
    config: UploadConfig,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadProgress> {
    const supabase = await createClient()

    // Update job status
    await this.updateJobStatus(jobId, 'processing', { total_rows: data.length, started_at: new Date().toISOString() })

    const progress: UploadProgress = {
      jobId,
      status: 'processing',
      totalRows: data.length,
      processedRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      createdLeads: 0,
      routedLeads: 0,
      errors: [],
    }

    const matchingEngine = config.routeLeads ? createMatchingEngine(this.workspaceId) : null

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1

      try {
        // Map and transform the row
        const mappedData = this.mapRow(row, config.mappings)

        // Validate required fields
        const validation = this.validateRow(mappedData, config.mappings)
        if (!validation.valid) {
          if (config.skipInvalidRows) {
            progress.invalidRows++
            progress.errors.push({ row: rowNum, error: validation.error!, data: row })
            continue
          } else {
            throw new ValidationError(validation.error!)
          }
        }

        // Check for duplicates
        if (config.dedupeStrategy !== 'none') {
          const isDupe = await this.checkDuplicate(mappedData, config.dedupeStrategy, config.dedupeWindowDays)
          if (isDupe) {
            progress.duplicateRows++
            continue
          }
        }

        // Create the lead
        const leadId = await this.createLead(mappedData, config)
        progress.createdLeads++

        // Create dedupe key
        await this.createDedupeKey(leadId, mappedData, config.dedupeStrategy)

        // Route the lead if configured
        if (matchingEngine) {
          const result = await matchingEngine.routeLead(leadId)
          if (result.matched) {
            progress.routedLeads++
          }
        }

        progress.validRows++
      } catch (err) {
        progress.errors.push({
          row: rowNum,
          error: err instanceof Error ? err.message : 'Unknown error',
          data: row,
        })
        if (!config.skipInvalidRows) {
          throw err
        }
      }

      progress.processedRows++

      // Report progress every 10 rows
      if (i % 10 === 0 && onProgress) {
        onProgress(progress)
        await this.updateJobProgress(jobId, progress)
      }
    }

    // Final update
    progress.status = 'completed'
    await this.updateJobStatus(jobId, 'completed', {
      processed_rows: progress.processedRows,
      valid_rows: progress.validRows,
      invalid_rows: progress.invalidRows,
      duplicate_rows: progress.duplicateRows,
      created_leads: progress.createdLeads,
      routed_leads: progress.routedLeads,
      error_log: progress.errors,
      completed_at: new Date().toISOString(),
    })

    return progress
  }

  /**
   * Map a row using field mappings
   */
  private mapRow(row: Record<string, string>, mappings: FieldMapping[]): Record<string, string | null> {
    const mapped: Record<string, string | null> = {}

    for (const mapping of mappings) {
      let value = row[mapping.sourceColumn] || mapping.defaultValue || null

      if (value && mapping.transform) {
        value = this.transformValue(value, mapping.transform)
      }

      mapped[mapping.targetField] = value
    }

    return mapped
  }

  /**
   * Transform a value based on transform type
   */
  private transformValue(value: string, transform: FieldMapping['transform']): string {
    switch (transform) {
      case 'lowercase':
        return value.toLowerCase()
      case 'uppercase':
        return value.toUpperCase()
      case 'trim':
        return value.trim()
      case 'phone_normalize':
        // Remove all non-digits
        return value.replace(/\D/g, '').slice(-10)
      case 'zip_5digit':
        // Take first 5 digits
        return value.replace(/\D/g, '').slice(0, 5)
      case 'state_code':
        // Convert state names to codes
        return this.normalizeState(value)
      case 'email_normalize':
        return value.toLowerCase().trim()
      default:
        return value
    }
  }

  /**
   * Normalize state name to 2-letter code
   */
  private normalizeState(state: string): string {
    const stateMap: Record<string, string> = {
      alabama: 'AL',
      alaska: 'AK',
      arizona: 'AZ',
      arkansas: 'AR',
      california: 'CA',
      colorado: 'CO',
      connecticut: 'CT',
      delaware: 'DE',
      florida: 'FL',
      georgia: 'GA',
      hawaii: 'HI',
      idaho: 'ID',
      illinois: 'IL',
      indiana: 'IN',
      iowa: 'IA',
      kansas: 'KS',
      kentucky: 'KY',
      louisiana: 'LA',
      maine: 'ME',
      maryland: 'MD',
      massachusetts: 'MA',
      michigan: 'MI',
      minnesota: 'MN',
      mississippi: 'MS',
      missouri: 'MO',
      montana: 'MT',
      nebraska: 'NE',
      nevada: 'NV',
      'new hampshire': 'NH',
      'new jersey': 'NJ',
      'new mexico': 'NM',
      'new york': 'NY',
      'north carolina': 'NC',
      'north dakota': 'ND',
      ohio: 'OH',
      oklahoma: 'OK',
      oregon: 'OR',
      pennsylvania: 'PA',
      'rhode island': 'RI',
      'south carolina': 'SC',
      'south dakota': 'SD',
      tennessee: 'TN',
      texas: 'TX',
      utah: 'UT',
      vermont: 'VT',
      virginia: 'VA',
      washington: 'WA',
      'west virginia': 'WV',
      wisconsin: 'WI',
      wyoming: 'WY',
    }

    const normalized = state.toLowerCase().trim()

    // Already a 2-letter code
    if (normalized.length === 2) {
      return normalized.toUpperCase()
    }

    return stateMap[normalized] || state.toUpperCase().slice(0, 2)
  }

  /**
   * Validate a mapped row
   */
  private validateRow(
    row: Record<string, string | null>,
    mappings: FieldMapping[]
  ): { valid: boolean; error?: string } {
    // Check required fields
    for (const mapping of mappings) {
      if (mapping.required && !row[mapping.targetField]) {
        return {
          valid: false,
          error: `Missing required field: ${mapping.targetField}`,
        }
      }
    }

    // Must have at least one contact method
    if (!row.email && !row.phone && !row.full_name && !row.first_name) {
      return {
        valid: false,
        error: 'Row must have at least email, phone, or name',
      }
    }

    // Validate email format if present
    if (row.email && !this.isValidEmail(row.email)) {
      return {
        valid: false,
        error: `Invalid email format: ${row.email}`,
      }
    }

    return { valid: true }
  }

  /**
   * Check if email is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Check for duplicate leads
   */
  private async checkDuplicate(
    row: Record<string, string | null>,
    strategy: 'email' | 'phone' | 'name_address',
    windowDays: number
  ): Promise<boolean> {
    const supabase = await createClient()
    const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase.from('lead_dedupe_keys').select('id').eq('workspace_id', this.workspaceId).limit(1)

    switch (strategy) {
      case 'email':
        if (!row.email) return false
        query = query.eq('email_key', row.email.toLowerCase())
        break
      case 'phone':
        if (!row.phone) return false
        query = query.eq('phone_key', row.phone.replace(/\D/g, ''))
        break
      case 'name_address':
        const nameKey = this.createNameAddressKey(row)
        if (!nameKey) return false
        query = query.eq('name_address_key', nameKey)
        break
    }

    const { data } = await query.gte('created_at', cutoffDate)
    return data !== null && data.length > 0
  }

  /**
   * Create a name+address key for deduplication
   */
  private createNameAddressKey(row: Record<string, string | null>): string | null {
    const name = row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim()
    const address = row.address || ''
    const zip = row.postal_code || ''

    if (!name || (!address && !zip)) {
      return null
    }

    // Create normalized key
    return `${name.toLowerCase().replace(/\s+/g, '')}_${address.toLowerCase().replace(/\s+/g, '')}_${zip}`.slice(0, 500)
  }

  /**
   * Create a lead from mapped data
   */
  private async createLead(row: Record<string, string | null>, config: UploadConfig): Promise<string> {
    const supabase = await createClient()

    const leadData = {
      workspace_id: this.workspaceId,
      first_name: row.first_name,
      last_name: row.last_name,
      full_name: row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || null,
      email: row.email,
      phone: row.phone,
      linkedin_url: row.linkedin_url,
      company_name: row.company_name,
      job_title: row.job_title,
      contact_title: row.job_title,
      company_domain: row.company_domain,
      address: row.address,
      city: row.city,
      state: row.state,
      state_code: row.state,
      postal_code: row.postal_code,
      country: row.country || 'US',
      company_industry: row.industry,
      source: 'csv_import',
      enrichment_status: 'pending',
      delivery_status: 'pending',
    }

    const { data, error } = await supabase.from('leads').insert(leadData).select('id').single()

    if (error) {
      throw new DatabaseError(`Failed to create lead: ${error.message}`)
    }

    // Create company association if we have SIC code
    if (row.sic_code && row.company_name) {
      await supabase.from('lead_companies').insert({
        lead_id: data.id,
        workspace_id: this.workspaceId,
        company_name: row.company_name,
        job_title: row.job_title,
        sic_code: row.sic_code,
        is_primary: true,
      })
    }

    return data.id
  }

  /**
   * Create deduplication key for a lead
   */
  private async createDedupeKey(
    leadId: string,
    row: Record<string, string | null>,
    strategy: 'email' | 'phone' | 'name_address' | 'none'
  ): Promise<void> {
    if (strategy === 'none') return

    const supabase = await createClient()

    const dedupeData: Record<string, any> = {
      workspace_id: this.workspaceId,
      lead_id: leadId,
    }

    if (row.email) {
      dedupeData.email_key = row.email.toLowerCase()
    }
    if (row.phone) {
      dedupeData.phone_key = row.phone.replace(/\D/g, '')
    }

    const nameKey = this.createNameAddressKey(row)
    if (nameKey) {
      dedupeData.name_address_key = nameKey
    }

    await supabase.from('lead_dedupe_keys').upsert(dedupeData, { onConflict: 'lead_id' })
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: string, extraData: Record<string, any> = {}): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('upload_jobs')
      .update({ status, ...extraData, updated_at: new Date().toISOString() })
      .eq('id', jobId)
  }

  /**
   * Update job progress
   */
  private async updateJobProgress(jobId: string, progress: UploadProgress): Promise<void> {
    await this.updateJobStatus(jobId, 'processing', {
      processed_rows: progress.processedRows,
      valid_rows: progress.validRows,
      invalid_rows: progress.invalidRows,
      duplicate_rows: progress.duplicateRows,
      created_leads: progress.createdLeads,
      routed_leads: progress.routedLeads,
    })
  }

  /**
   * Get upload job status
   */
  async getJobStatus(jobId: string): Promise<UploadProgress | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('upload_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('workspace_id', this.workspaceId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      jobId: data.id,
      status: data.status,
      totalRows: data.total_rows,
      processedRows: data.processed_rows,
      validRows: data.valid_rows,
      invalidRows: data.invalid_rows,
      duplicateRows: data.duplicate_rows,
      createdLeads: data.created_leads,
      routedLeads: data.routed_leads,
      errors: data.error_log || [],
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createUploadHandler(workspaceId: string): UploadHandlerService {
  return new UploadHandlerService(workspaceId)
}
