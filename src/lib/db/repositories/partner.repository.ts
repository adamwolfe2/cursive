/**
 * Partner Repository
 * Database access layer for partner attribution and credits
 */

import { createClient } from '@/lib/supabase/server'
import type {
  PartnerAnalytics,
  PartnerCredit,
  PartnerCreditTransaction,
  LeadPurchase,
} from '@/types/database.types'
import { safeError } from '@/lib/utils/log-sanitizer'

export class PartnerRepository {
  /**
   * Get partner analytics (dashboard metrics)
   */
  async getPartnerAnalytics(partnerId: string): Promise<PartnerAnalytics | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('partner_analytics')
      .select('*')
      .eq('partner_id', partnerId)
      .maybeSingle()

    if (error) {
      safeError('[PartnerRepository] Failed to get analytics:', error)
      return null
    }

    return data
  }

  /**
   * Get all leads uploaded by a partner (paginated)
   */
  async getPartnerUploadedLeads(
    partnerId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const supabase = await createClient()

    const { data, error, count } = await supabase
      .from('leads')
      .select(
        `
        id,
        business_name,
        industry,
        status,
        upload_date,
        sold_at,
        lead_purchases!left(partner_commission)
      `,
        { count: 'exact' }
      )
      .eq('uploaded_by_partner_id', partnerId)
      .order('upload_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      safeError('[PartnerRepository] Failed to get uploaded leads:', error)
      throw new Error('Failed to fetch uploaded leads')
    }

    // Transform to flat structure
    const transformedLeads = (data || []).map((lead: any) => ({
      id: lead.id,
      business_name: lead.business_name,
      industry: lead.industry,
      status: lead.status,
      upload_date: lead.upload_date,
      sold_at: lead.sold_at,
      partner_commission: lead.lead_purchases?.[0]?.partner_commission || null,
    }))

    return {
      leads: transformedLeads,
      total: count || 0,
      limit,
      offset,
    }
  }

  /**
   * Get partner's sold leads (leads that were purchased)
   */
  async getPartnerSoldLeads(
    partnerId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const supabase = await createClient()

    const { data, error, count } = await supabase
      .from('lead_purchases')
      .select(`
        *,
        leads:lead_id (
          id,
          business_name,
          contact_name,
          email,
          phone,
          state,
          industry
        )
      `, { count: 'exact' })
      .eq('partner_id', partnerId)
      .order('purchased_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      safeError('[PartnerRepository] Failed to get sold leads:', error)
      throw new Error('Failed to fetch sold leads')
    }

    return {
      purchases: data || [],
      total: count || 0,
      limit,
      offset,
    }
  }

  /**
   * Get partner's credit balance
   */
  async getPartnerCredits(partnerId: string): Promise<PartnerCredit | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('partner_credits')
      .select('*')
      .eq('partner_id', partnerId)
      .maybeSingle()

    if (error) {
      // If no record exists, return zero balance
      if (error.code === 'PGRST116') {
        return {
          partner_id: partnerId,
          balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      safeError('[PartnerRepository] Failed to get credits:', error)
      return null
    }

    return data
  }

  /**
   * Get partner's credit transaction history (paginated)
   */
  async getPartnerTransactions(
    partnerId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const supabase = await createClient()

    const { data, error, count } = await supabase
      .from('partner_credit_transactions')
      .select('*', { count: 'exact' })
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      safeError('[PartnerRepository] Failed to get transactions:', error)
      throw new Error('Failed to fetch transactions')
    }

    return {
      transactions: data || [],
      total: count || 0,
      limit,
      offset,
    }
  }

  /**
   * Credit partner for a lead sale
   * This should be called from Stripe webhook or purchase API
   */
  async creditPartnerForSale(
    leadPurchaseId: string,
    partnerId: string,
    commissionAmount: number
  ): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.rpc('credit_partner_for_sale', {
      p_lead_purchase_id: leadPurchaseId,
      p_partner_id: partnerId,
      p_commission_amount: commissionAmount,
    })

    if (error) {
      safeError('[PartnerRepository] Failed to credit partner:', error)
      throw new Error('Failed to credit partner for sale')
    }

  }

  /**
   * Record a lead purchase (called from Stripe webhook)
   */
  async recordLeadPurchase(purchase: {
    lead_id: string
    buyer_user_id: string
    partner_id: string | null
    purchase_price: number
    partner_commission: number
    platform_fee: number
    stripe_payment_intent_id: string | null
  }): Promise<LeadPurchase> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_purchases')
      .insert({
        lead_id: purchase.lead_id,
        buyer_user_id: purchase.buyer_user_id,
        partner_id: purchase.partner_id,
        purchase_price: purchase.purchase_price,
        partner_commission: purchase.partner_commission,
        platform_fee: purchase.platform_fee,
        stripe_payment_intent_id: purchase.stripe_payment_intent_id,
      })
      .select()
      .maybeSingle()

    if (error) {
      safeError('[PartnerRepository] Failed to record purchase:', error)
      throw new Error('Failed to record lead purchase')
    }

    // If there's a partner, credit them
    if (purchase.partner_id && purchase.partner_commission > 0) {
      await this.creditPartnerForSale(
        data.id,
        purchase.partner_id,
        purchase.partner_commission
      )
    }

    return data
  }

  /**
   * Get total platform revenue and partner payouts
   * Admin analytics
   */
  async getPlatformRevenue() {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_purchases')
      .select('purchase_price, partner_commission, platform_fee')

    if (error) {
      safeError('[PartnerRepository] Failed to get platform revenue:', error)
      return {
        total_revenue: 0,
        partner_payouts: 0,
        platform_fees: 0,
        total_purchases: 0,
      }
    }

    const stats = data.reduce(
      (acc, purchase) => ({
        total_revenue: acc.total_revenue + Number(purchase.purchase_price),
        partner_payouts: acc.partner_payouts + Number(purchase.partner_commission),
        platform_fees: acc.platform_fees + Number(purchase.platform_fee),
        total_purchases: acc.total_purchases + 1,
      }),
      { total_revenue: 0, partner_payouts: 0, platform_fees: 0, total_purchases: 0 }
    )

    return stats
  }
}
