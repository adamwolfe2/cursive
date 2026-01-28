// Partner Repository
// Data access layer for partner operations

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Partner,
  PartnerUploadBatch,
  PartnerStatus,
  PartnerTier,
  UploadBatchStatus,
} from '@/types/database.types'

export class PartnerRepository {
  private adminClient = createAdminClient()

  /**
   * Find partner by ID
   */
  async findById(partnerId: string): Promise<Partner | null> {
    const { data, error } = await this.adminClient
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single()

    if (error) return null
    return data as Partner
  }

  /**
   * Find partner by API key
   */
  async findByApiKey(apiKey: string): Promise<Partner | null> {
    const { data, error } = await this.adminClient
      .from('partners')
      .select('*')
      .eq('api_key', apiKey)
      .single()

    if (error) return null
    return data as Partner
  }

  /**
   * Find partner by email
   */
  async findByEmail(email: string): Promise<Partner | null> {
    const { data, error } = await this.adminClient
      .from('partners')
      .select('*')
      .eq('email', email)
      .single()

    if (error) return null
    return data as Partner
  }

  /**
   * Find partner by referral code
   */
  async findByReferralCode(code: string): Promise<Partner | null> {
    const { data, error } = await this.adminClient
      .from('partners')
      .select('*')
      .eq('referral_code', code)
      .single()

    if (error) return null
    return data as Partner
  }

  /**
   * List all partners with filters
   */
  async list(options: {
    status?: PartnerStatus
    tier?: PartnerTier
    isActive?: boolean
    search?: string
    limit?: number
    offset?: number
    orderBy?: 'created_at' | 'total_leads_uploaded' | 'partner_score' | 'total_earnings'
    orderDirection?: 'asc' | 'desc'
  }): Promise<{ partners: Partner[]; total: number }> {
    let query = this.adminClient.from('partners').select('*', { count: 'exact' })

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.tier) {
      query = query.eq('partner_tier', options.tier)
    }

    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive)
    }

    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%,company_name.ilike.%${options.search}%`)
    }

    // Ordering
    const orderBy = options.orderBy || 'created_at'
    const orderDirection = options.orderDirection || 'desc'
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Failed to list partners: ${error.message}`)

    return {
      partners: data as Partner[],
      total: count || 0,
    }
  }

  /**
   * Create a new partner
   */
  async create(params: {
    name: string
    email: string
    companyName?: string
    referredByPartnerId?: string
    payoutRate?: number
  }): Promise<Partner> {
    const referralCode = this.generateReferralCode()
    const apiKey = this.generateApiKey()

    const { data, error } = await this.adminClient
      .from('partners')
      .insert({
        name: params.name,
        email: params.email,
        company_name: params.companyName,
        referred_by_partner_id: params.referredByPartnerId,
        referral_code: referralCode,
        api_key: apiKey,
        payout_rate: params.payoutRate || 0.30,
        status: 'pending',
        partner_tier: 'standard',
        base_commission_rate: 0.30,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create partner: ${error.message}`)
    return data as Partner
  }

  /**
   * Update partner
   */
  async update(
    partnerId: string,
    updates: Partial<{
      name: string
      email: string
      companyName: string
      payoutRate: number
      status: PartnerStatus
      partnerTier: PartnerTier
      baseCommissionRate: number
      isActive: boolean
      suspensionReason: string
    }>
  ): Promise<Partner> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.companyName !== undefined) updateData.company_name = updates.companyName
    if (updates.payoutRate !== undefined) updateData.payout_rate = updates.payoutRate
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.partnerTier !== undefined) updateData.partner_tier = updates.partnerTier
    if (updates.baseCommissionRate !== undefined) updateData.base_commission_rate = updates.baseCommissionRate
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    if (updates.status === 'suspended') {
      updateData.suspended_at = new Date().toISOString()
      updateData.suspension_reason = updates.suspensionReason
    }

    const { data, error } = await this.adminClient
      .from('partners')
      .update(updateData)
      .eq('id', partnerId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update partner: ${error.message}`)
    return data as Partner
  }

  /**
   * Update partner statistics
   */
  async updateStats(
    partnerId: string,
    stats: Partial<{
      totalLeadsUploaded: number
      totalLeadsSold: number
      totalEarnings: number
      pendingBalance: number
      availableBalance: number
      verificationPassRate: number
      duplicateRate: number
      dataCompletenessRate: number
      partnerScore: number
    }>
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (stats.totalLeadsUploaded !== undefined) updateData.total_leads_uploaded = stats.totalLeadsUploaded
    if (stats.totalLeadsSold !== undefined) updateData.total_leads_sold = stats.totalLeadsSold
    if (stats.totalEarnings !== undefined) updateData.total_earnings = stats.totalEarnings
    if (stats.pendingBalance !== undefined) updateData.pending_balance = stats.pendingBalance
    if (stats.availableBalance !== undefined) updateData.available_balance = stats.availableBalance
    if (stats.verificationPassRate !== undefined) updateData.verification_pass_rate = stats.verificationPassRate
    if (stats.duplicateRate !== undefined) updateData.duplicate_rate = stats.duplicateRate
    if (stats.dataCompletenessRate !== undefined) updateData.data_completeness_rate = stats.dataCompletenessRate
    if (stats.partnerScore !== undefined) updateData.partner_score = stats.partnerScore

    const { error } = await this.adminClient
      .from('partners')
      .update(updateData)
      .eq('id', partnerId)

    if (error) throw new Error(`Failed to update partner stats: ${error.message}`)
  }

  /**
   * Increment partner lead count
   */
  async incrementLeadCount(partnerId: string, count: number = 1): Promise<void> {
    const { error } = await this.adminClient.rpc('increment', {
      table_name: 'partners',
      row_id: partnerId,
      column_name: 'total_leads_uploaded',
      amount: count,
    })

    // If RPC doesn't exist, fallback to manual update
    if (error) {
      const partner = await this.findById(partnerId)
      if (partner) {
        await this.adminClient
          .from('partners')
          .update({
            total_leads_uploaded: partner.total_leads_uploaded + count,
            last_upload_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', partnerId)
      }
    }
  }

  /**
   * Get partner upload batches
   */
  async getUploadBatches(
    partnerId: string,
    options: {
      status?: UploadBatchStatus
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ batches: PartnerUploadBatch[]; total: number }> {
    let query = this.adminClient
      .from('partner_upload_batches')
      .select('*', { count: 'exact' })
      .eq('partner_id', partnerId)

    if (options.status) {
      query = query.eq('status', options.status)
    }

    query = query.order('created_at', { ascending: false })

    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Failed to get upload batches: ${error.message}`)

    return {
      batches: data as PartnerUploadBatch[],
      total: count || 0,
    }
  }

  /**
   * Create upload batch
   */
  async createUploadBatch(params: {
    partnerId: string
    fileName: string
    fileUrl?: string
    fileSizeBytes?: number
    fileType?: string
    fieldMappings: unknown[]
    industryCategoryId?: string
    defaultSicCodes?: string[]
  }): Promise<PartnerUploadBatch> {
    const { data, error } = await this.adminClient
      .from('partner_upload_batches')
      .insert({
        partner_id: params.partnerId,
        file_name: params.fileName,
        file_url: params.fileUrl,
        file_size_bytes: params.fileSizeBytes,
        file_type: params.fileType,
        field_mappings: params.fieldMappings,
        industry_category_id: params.industryCategoryId,
        default_sic_codes: params.defaultSicCodes || [],
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create upload batch: ${error.message}`)
    return data as PartnerUploadBatch
  }

  /**
   * Update upload batch
   */
  async updateUploadBatch(
    batchId: string,
    updates: Partial<{
      status: UploadBatchStatus
      totalRows: number
      processedRows: number
      validRows: number
      invalidRows: number
      duplicateRows: number
      verificationPending: number
      verificationComplete: number
      verificationValid: number
      verificationInvalid: number
      marketplaceListed: number
      previewData: unknown
      detectedColumns: string[]
      errorMessage: string
      errorLog: unknown[]
      rejectedRowsUrl: string
      startedAt: Date
      completedAt: Date
    }>
  ): Promise<PartnerUploadBatch> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.totalRows !== undefined) updateData.total_rows = updates.totalRows
    if (updates.processedRows !== undefined) updateData.processed_rows = updates.processedRows
    if (updates.validRows !== undefined) updateData.valid_rows = updates.validRows
    if (updates.invalidRows !== undefined) updateData.invalid_rows = updates.invalidRows
    if (updates.duplicateRows !== undefined) updateData.duplicate_rows = updates.duplicateRows
    if (updates.verificationPending !== undefined) updateData.verification_pending = updates.verificationPending
    if (updates.verificationComplete !== undefined) updateData.verification_complete = updates.verificationComplete
    if (updates.verificationValid !== undefined) updateData.verification_valid = updates.verificationValid
    if (updates.verificationInvalid !== undefined) updateData.verification_invalid = updates.verificationInvalid
    if (updates.marketplaceListed !== undefined) updateData.marketplace_listed = updates.marketplaceListed
    if (updates.previewData !== undefined) updateData.preview_data = updates.previewData
    if (updates.detectedColumns !== undefined) updateData.detected_columns = updates.detectedColumns
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage
    if (updates.errorLog !== undefined) updateData.error_log = updates.errorLog
    if (updates.rejectedRowsUrl !== undefined) updateData.rejected_rows_url = updates.rejectedRowsUrl
    if (updates.startedAt !== undefined) updateData.started_at = updates.startedAt.toISOString()
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt.toISOString()

    const { data, error } = await this.adminClient
      .from('partner_upload_batches')
      .update(updateData)
      .eq('id', batchId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update upload batch: ${error.message}`)
    return data as PartnerUploadBatch
  }

  /**
   * Get partner earnings history
   */
  async getEarningsHistory(
    partnerId: string,
    options: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<{
    earnings: Array<{
      id: string
      lead_id: string | null
      amount: number
      status: string
      description: string | null
      created_at: string
    }>
    total: number
  }> {
    let query = this.adminClient
      .from('partner_earnings')
      .select('*', { count: 'exact' })
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Failed to get earnings history: ${error.message}`)

    return {
      earnings: data || [],
      total: count || 0,
    }
  }

  /**
   * Get partner payouts
   */
  async getPayouts(
    partnerId: string,
    options: {
      status?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<{
    payouts: Array<{
      id: string
      amount: number
      period_start: string
      period_end: string
      status: string
      stripe_transfer_id: string | null
      leads_count: number
      notes: string | null
      created_at: string
      paid_at: string | null
    }>
    total: number
  }> {
    let query = this.adminClient
      .from('payouts')
      .select('*', { count: 'exact' })
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Failed to get payouts: ${error.message}`)

    return {
      payouts: data || [],
      total: count || 0,
    }
  }

  /**
   * Record partner score history
   */
  async recordScoreHistory(params: {
    partnerId: string
    score: number
    previousScore?: number
    verificationPassRate?: number
    duplicateRate?: number
    dataCompletenessRate?: number
    avgFreshnessAtSale?: number
    tier?: PartnerTier
    previousTier?: PartnerTier
    changeReason?: string
  }): Promise<void> {
    const { error } = await this.adminClient.from('partner_score_history').insert({
      partner_id: params.partnerId,
      score: params.score,
      previous_score: params.previousScore,
      verification_pass_rate: params.verificationPassRate,
      duplicate_rate: params.duplicateRate,
      data_completeness_rate: params.dataCompletenessRate,
      avg_freshness_at_sale: params.avgFreshnessAtSale,
      tier: params.tier,
      previous_tier: params.previousTier,
      change_reason: params.changeReason,
    })

    if (error) throw new Error(`Failed to record score history: ${error.message}`)
  }

  // Helper methods

  private generateApiKey(): string {
    const chars = 'abcdef0123456789'
    let result = 'pk_'
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}
