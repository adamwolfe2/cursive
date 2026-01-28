// Marketplace Repository
// Data access layer for marketplace operations (lead browsing and purchases)

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  MarketplaceLead,
  MarketplaceLeadPreview,
  MarketplacePurchase,
  MarketplacePurchaseItem,
  MarketplaceFilters,
  WorkspaceCredits,
  CreditPurchase,
  VerificationStatus,
  SeniorityLevel,
} from '@/types/database.types'

export class MarketplaceRepository {
  private adminClient = createAdminClient()

  /**
   * Browse marketplace leads with filters
   * Returns obfuscated lead previews (contact info hidden)
   */
  async browseLeads(
    filters: MarketplaceFilters,
    options: {
      limit?: number
      offset?: number
      orderBy?: 'price' | 'intent_score' | 'freshness_score' | 'created_at'
      orderDirection?: 'asc' | 'desc'
    } = {}
  ): Promise<{ leads: MarketplaceLeadPreview[]; total: number }> {
    const supabase = await createClient()

    // Build query for marketplace-listed leads
    let query = supabase
      .from('leads')
      .select(
        `
        id,
        first_name,
        last_name,
        job_title,
        company_name,
        company_industry,
        company_size,
        city,
        state,
        seniority_level,
        intent_score_calculated,
        freshness_score,
        verification_status,
        phone,
        email,
        marketplace_price
      `,
        { count: 'exact' }
      )
      .eq('is_marketplace_listed', true)
      .in('verification_status', ['valid', 'catch_all'])

    // Apply filters
    if (filters.industries?.length) {
      query = query.in('company_industry', filters.industries)
    }

    if (filters.sicCodes?.length) {
      query = query.overlaps('sic_codes', filters.sicCodes)
    }

    if (filters.states?.length) {
      query = query.in('state_code', filters.states)
    }

    if (filters.cities?.length) {
      query = query.in('city', filters.cities)
    }

    if (filters.companySizes?.length) {
      query = query.in('company_size', filters.companySizes)
    }

    if (filters.seniorityLevels?.length) {
      query = query.in('seniority_level', filters.seniorityLevels)
    }

    if (filters.intentScoreMin !== undefined) {
      query = query.gte('intent_score_calculated', filters.intentScoreMin)
    }

    if (filters.intentScoreMax !== undefined) {
      query = query.lte('intent_score_calculated', filters.intentScoreMax)
    }

    if (filters.freshnessMin !== undefined) {
      query = query.gte('freshness_score', filters.freshnessMin)
    }

    if (filters.hasPhone) {
      query = query.not('phone', 'is', null)
    }

    if (filters.hasVerifiedEmail) {
      query = query.eq('verification_status', 'valid')
    }

    if (filters.verificationStatus?.length) {
      query = query.in('verification_status', filters.verificationStatus)
    }

    if (filters.priceMin !== undefined) {
      query = query.gte('marketplace_price', filters.priceMin)
    }

    if (filters.priceMax !== undefined) {
      query = query.lte('marketplace_price', filters.priceMax)
    }

    // Ordering
    const orderBy = options.orderBy || 'freshness_score'
    const columnMap: Record<string, string> = {
      price: 'marketplace_price',
      intent_score: 'intent_score_calculated',
      freshness_score: 'freshness_score',
      created_at: 'created_at',
    }
    query = query.order(columnMap[orderBy], {
      ascending: options.orderDirection === 'asc',
    })

    // Pagination
    const limit = options.limit || 20
    const offset = options.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw new Error(`Failed to browse leads: ${error.message}`)

    // Transform to obfuscated previews
    const leads: MarketplaceLeadPreview[] = (data || []).map((lead) =>
      this.obfuscateLead(lead)
    )

    return {
      leads,
      total: count || 0,
    }
  }

  /**
   * Get lead by ID (obfuscated unless purchased)
   */
  async getLeadPreview(leadId: string): Promise<MarketplaceLeadPreview | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leads')
      .select(
        `
        id,
        first_name,
        last_name,
        job_title,
        company_name,
        company_industry,
        company_size,
        city,
        state,
        seniority_level,
        intent_score_calculated,
        freshness_score,
        verification_status,
        phone,
        email,
        marketplace_price
      `
      )
      .eq('id', leadId)
      .eq('is_marketplace_listed', true)
      .single()

    if (error || !data) return null

    return this.obfuscateLead(data)
  }

  /**
   * Get full lead details (after purchase)
   */
  async getFullLead(leadId: string): Promise<MarketplaceLead | null> {
    const { data, error } = await this.adminClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (error || !data) return null
    return data as MarketplaceLead
  }

  /**
   * Get multiple leads by IDs
   */
  async getLeadsByIds(leadIds: string[]): Promise<MarketplaceLead[]> {
    const { data, error } = await this.adminClient
      .from('leads')
      .select('*')
      .in('id', leadIds)

    if (error) throw new Error(`Failed to get leads: ${error.message}`)
    return (data || []) as MarketplaceLead[]
  }

  /**
   * Create a marketplace purchase
   */
  async createPurchase(params: {
    buyerWorkspaceId: string
    buyerUserId: string
    leadIds: string[]
    totalPrice: number
    paymentMethod: 'credits' | 'stripe' | 'mixed'
    creditsUsed?: number
    cardAmount?: number
    stripePaymentIntentId?: string
    stripeCheckoutSessionId?: string
    filtersUsed?: MarketplaceFilters
  }): Promise<MarketplacePurchase> {
    const { data, error } = await this.adminClient
      .from('marketplace_purchases')
      .insert({
        buyer_workspace_id: params.buyerWorkspaceId,
        buyer_user_id: params.buyerUserId,
        total_leads: params.leadIds.length,
        total_price: params.totalPrice,
        payment_method: params.paymentMethod,
        credits_used: params.creditsUsed || 0,
        card_amount: params.cardAmount || 0,
        stripe_payment_intent_id: params.stripePaymentIntentId,
        stripe_checkout_session_id: params.stripeCheckoutSessionId,
        filters_used: params.filtersUsed,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create purchase: ${error.message}`)
    return data as MarketplacePurchase
  }

  /**
   * Add items to a purchase
   */
  async addPurchaseItems(
    purchaseId: string,
    items: Array<{
      leadId: string
      priceAtPurchase: number
      intentScoreAtPurchase?: number
      freshnessScoreAtPurchase?: number
      partnerId?: string
      commissionRate?: number
      commissionAmount?: number
      commissionBonuses?: string[]
    }>
  ): Promise<MarketplacePurchaseItem[]> {
    const holdbackDays = 14
    const commissionPayableAt = new Date()
    commissionPayableAt.setDate(commissionPayableAt.getDate() + holdbackDays)

    const insertData = items.map((item) => ({
      purchase_id: purchaseId,
      lead_id: item.leadId,
      price_at_purchase: item.priceAtPurchase,
      intent_score_at_purchase: item.intentScoreAtPurchase,
      freshness_score_at_purchase: item.freshnessScoreAtPurchase,
      partner_id: item.partnerId,
      commission_rate: item.commissionRate,
      commission_amount: item.commissionAmount,
      commission_bonuses: item.commissionBonuses || [],
      commission_status: item.partnerId ? 'pending_holdback' : null,
      commission_payable_at: item.partnerId ? commissionPayableAt.toISOString() : null,
    }))

    const { data, error } = await this.adminClient
      .from('marketplace_purchase_items')
      .insert(insertData)
      .select()

    if (error) throw new Error(`Failed to add purchase items: ${error.message}`)
    return (data || []) as MarketplacePurchaseItem[]
  }

  /**
   * Complete a purchase
   */
  async completePurchase(
    purchaseId: string,
    downloadUrl?: string
  ): Promise<MarketplacePurchase> {
    const downloadExpiresAt = new Date()
    downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 90) // 90 day download window

    const { data, error } = await this.adminClient
      .from('marketplace_purchases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        download_url: downloadUrl,
        download_expires_at: downloadExpiresAt.toISOString(),
      })
      .eq('id', purchaseId)
      .select()
      .single()

    if (error) throw new Error(`Failed to complete purchase: ${error.message}`)
    return data as MarketplacePurchase
  }

  /**
   * Mark leads as sold
   */
  async markLeadsSold(leadIds: string[]): Promise<void> {
    // Update each lead's sold count
    for (const leadId of leadIds) {
      await this.adminClient.rpc('mark_lead_sold', { p_lead_id: leadId })
    }
  }

  /**
   * Get purchase by ID
   */
  async getPurchase(purchaseId: string): Promise<MarketplacePurchase | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('marketplace_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single()

    if (error || !data) return null
    return data as MarketplacePurchase
  }

  /**
   * Get purchase items
   */
  async getPurchaseItems(purchaseId: string): Promise<MarketplacePurchaseItem[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('marketplace_purchase_items')
      .select('*')
      .eq('purchase_id', purchaseId)

    if (error) throw new Error(`Failed to get purchase items: ${error.message}`)
    return (data || []) as MarketplacePurchaseItem[]
  }

  /**
   * Get purchase history for a workspace
   */
  async getPurchaseHistory(
    workspaceId: string,
    options: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ purchases: MarketplacePurchase[]; total: number }> {
    const supabase = await createClient()

    let query = supabase
      .from('marketplace_purchases')
      .select('*', { count: 'exact' })
      .eq('buyer_workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Failed to get purchase history: ${error.message}`)

    return {
      purchases: (data || []) as MarketplacePurchase[],
      total: count || 0,
    }
  }

  /**
   * Get leads purchased in a specific purchase (full details)
   */
  async getPurchasedLeads(purchaseId: string): Promise<MarketplaceLead[]> {
    const supabase = await createClient()

    // First verify the purchase belongs to the user's workspace
    const { data: purchase } = await supabase
      .from('marketplace_purchases')
      .select('id')
      .eq('id', purchaseId)
      .single()

    if (!purchase) {
      throw new Error('Purchase not found')
    }

    // Get the lead IDs from purchase items
    const { data: items } = await supabase
      .from('marketplace_purchase_items')
      .select('lead_id')
      .eq('purchase_id', purchaseId)

    if (!items?.length) return []

    const leadIds = items.map((i) => i.lead_id)

    // Use admin client to get full lead details
    const { data: leads, error } = await this.adminClient
      .from('leads')
      .select('*')
      .in('id', leadIds)

    if (error) throw new Error(`Failed to get purchased leads: ${error.message}`)

    return (leads || []) as MarketplaceLead[]
  }

  // ============================================================================
  // CREDITS OPERATIONS
  // ============================================================================

  /**
   * Get workspace credits
   */
  async getWorkspaceCredits(workspaceId: string): Promise<WorkspaceCredits | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workspace_credits')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single()

    if (error) {
      // If no record exists, return default
      if (error.code === 'PGRST116') {
        return {
          id: '',
          workspace_id: workspaceId,
          balance: 0,
          total_purchased: 0,
          total_used: 0,
          total_earned: 0,
          updated_at: new Date().toISOString(),
        }
      }
      return null
    }

    return data as WorkspaceCredits
  }

  /**
   * Add credits to workspace
   */
  async addCredits(
    workspaceId: string,
    amount: number,
    source: 'purchase' | 'referral' = 'purchase'
  ): Promise<number> {
    const { data, error } = await this.adminClient.rpc('add_workspace_credits', {
      p_workspace_id: workspaceId,
      p_amount: amount,
      p_source: source,
    })

    if (error) throw new Error(`Failed to add credits: ${error.message}`)
    return data as number
  }

  /**
   * Deduct credits from workspace
   */
  async deductCredits(workspaceId: string, amount: number): Promise<number> {
    const { data, error } = await this.adminClient.rpc('deduct_workspace_credits', {
      p_workspace_id: workspaceId,
      p_amount: amount,
    })

    if (error) throw new Error(`Failed to deduct credits: ${error.message}`)
    return data as number
  }

  /**
   * Create credit purchase record
   */
  async createCreditPurchase(params: {
    workspaceId: string
    userId: string
    credits: number
    packageName: string
    amountPaid: number
    pricePerCredit: number
    stripePaymentIntentId?: string
    stripeCheckoutSessionId?: string
  }): Promise<CreditPurchase> {
    const { data, error } = await this.adminClient
      .from('credit_purchases')
      .insert({
        workspace_id: params.workspaceId,
        user_id: params.userId,
        credits: params.credits,
        package_name: params.packageName,
        amount_paid: params.amountPaid,
        price_per_credit: params.pricePerCredit,
        stripe_payment_intent_id: params.stripePaymentIntentId,
        stripe_checkout_session_id: params.stripeCheckoutSessionId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create credit purchase: ${error.message}`)
    return data as CreditPurchase
  }

  /**
   * Complete credit purchase
   */
  async completeCreditPurchase(purchaseId: string): Promise<CreditPurchase> {
    const { data, error } = await this.adminClient
      .from('credit_purchases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', purchaseId)
      .select()
      .single()

    if (error) throw new Error(`Failed to complete credit purchase: ${error.message}`)
    return data as CreditPurchase
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Obfuscate lead contact information for preview
   */
  private obfuscateLead(lead: {
    id: string
    first_name: string | null
    last_name: string | null
    job_title: string | null
    company_name: string
    company_industry: string | null
    company_size: string | null
    city: string | null
    state: string | null
    seniority_level: string | null
    intent_score_calculated: number
    freshness_score: number
    verification_status: string
    phone: string | null
    email: string | null
    marketplace_price: number | null
  }): MarketplaceLeadPreview {
    return {
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      job_title: lead.job_title,
      company_name: lead.company_name,
      company_industry: lead.company_industry,
      company_size: lead.company_size,
      city: lead.city,
      state: lead.state,
      seniority_level: lead.seniority_level as SeniorityLevel | null,
      intent_score: lead.intent_score_calculated,
      freshness_score: lead.freshness_score,
      verification_status: lead.verification_status as VerificationStatus,
      has_phone: !!lead.phone,
      has_email: !!lead.email,
      price: lead.marketplace_price || 0.05,
      // Obfuscated contact info
      email_preview: this.obfuscateEmail(lead.email),
      phone_preview: this.obfuscatePhone(lead.phone),
    }
  }

  /**
   * Obfuscate email (j***@company.com)
   */
  private obfuscateEmail(email: string | null): string | null {
    if (!email) return null

    const [local, domain] = email.split('@')
    if (!local || !domain) return null

    const maskedLocal = local.charAt(0) + '***'
    return `${maskedLocal}@${domain}`
  }

  /**
   * Obfuscate phone (+1 (555) ***-**89)
   */
  private obfuscatePhone(phone: string | null): string | null {
    if (!phone) return null

    // Get last 2 digits
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 4) return '***-****'

    const lastTwo = cleaned.slice(-2)
    return `***-**${lastTwo}`
  }

  /**
   * Get aggregate stats for marketplace
   */
  async getMarketplaceStats(): Promise<{
    totalLeads: number
    totalByIndustry: Record<string, number>
    avgPrice: number
    avgIntentScore: number
    totalSoldLast30Days: number
  }> {
    // Total leads count
    const { count: totalLeads } = await this.adminClient
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('is_marketplace_listed', true)

    // By industry (simplified - would need more complex query for full breakdown)
    const { data: industryData } = await this.adminClient
      .from('leads')
      .select('company_industry')
      .eq('is_marketplace_listed', true)

    const totalByIndustry: Record<string, number> = {}
    industryData?.forEach((lead) => {
      const industry = lead.company_industry || 'Unknown'
      totalByIndustry[industry] = (totalByIndustry[industry] || 0) + 1
    })

    // Average price and intent score
    const { data: avgData } = await this.adminClient
      .from('leads')
      .select('marketplace_price, intent_score_calculated')
      .eq('is_marketplace_listed', true)
      .limit(10000) // Sample for performance

    let avgPrice = 0.05
    let avgIntentScore = 50
    if (avgData?.length) {
      avgPrice =
        avgData.reduce((sum, l) => sum + (l.marketplace_price || 0.05), 0) / avgData.length
      avgIntentScore =
        avgData.reduce((sum, l) => sum + (l.intent_score_calculated || 50), 0) / avgData.length
    }

    // Sold last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: totalSoldLast30Days } = await this.adminClient
      .from('marketplace_purchase_items')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    return {
      totalLeads: totalLeads || 0,
      totalByIndustry,
      avgPrice,
      avgIntentScore,
      totalSoldLast30Days: totalSoldLast30Days || 0,
    }
  }
}
