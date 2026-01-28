// Partner Authentication Helpers
// Handles API key-based authentication for partner endpoints

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Partner, PartnerStatus } from '@/types/database.types'
import { headers } from 'next/headers'

const API_KEY_HEADER = 'x-api-key'
const API_KEY_PREFIX = 'pk_'

export interface PartnerAuthResult {
  partner: Partner | null
  error: string | null
}

/**
 * Authenticate partner from API key in request headers
 */
export async function authenticatePartnerFromRequest(): Promise<PartnerAuthResult> {
  const headersList = await headers()
  const apiKey = headersList.get(API_KEY_HEADER)

  if (!apiKey) {
    return { partner: null, error: 'Missing API key' }
  }

  return authenticatePartnerByApiKey(apiKey)
}

/**
 * Authenticate partner by API key
 */
export async function authenticatePartnerByApiKey(apiKey: string): Promise<PartnerAuthResult> {
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    return { partner: null, error: 'Invalid API key format' }
  }

  // Use admin client to bypass RLS
  const supabase = createAdminClient()

  const { data: partner, error } = await supabase
    .from('partners')
    .select('*')
    .eq('api_key', apiKey)
    .single()

  if (error || !partner) {
    return { partner: null, error: 'Invalid API key' }
  }

  // Check partner status
  if (!partner.is_active) {
    return { partner: null, error: 'Partner account is inactive' }
  }

  if (partner.status === 'suspended') {
    return {
      partner: null,
      error: `Partner account is suspended: ${partner.suspension_reason || 'Contact support'}`,
    }
  }

  if (partner.status === 'terminated') {
    return { partner: null, error: 'Partner account has been terminated' }
  }

  return { partner: partner as Partner, error: null }
}

/**
 * Get partner by ID
 */
export async function getPartnerById(partnerId: string): Promise<Partner | null> {
  const supabase = await createClient()

  const { data } = await supabase.from('partners').select('*').eq('id', partnerId).single()

  return data as Partner | null
}

/**
 * Get partner by email
 */
export async function getPartnerByEmail(email: string): Promise<Partner | null> {
  const supabase = createAdminClient()

  const { data } = await supabase.from('partners').select('*').eq('email', email).single()

  return data as Partner | null
}

/**
 * Create a new partner
 */
export async function createPartner(params: {
  name: string
  email: string
  companyName?: string
  referredByPartnerId?: string
}): Promise<Partner> {
  const supabase = createAdminClient()

  // Generate referral code
  const referralCode = generateReferralCode()

  const { data, error } = await supabase
    .from('partners')
    .insert({
      name: params.name,
      email: params.email,
      company_name: params.companyName,
      referred_by_partner_id: params.referredByPartnerId,
      referral_code: referralCode,
      status: 'pending' as PartnerStatus,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create partner: ${error.message}`)
  }

  return data as Partner
}

/**
 * Update partner status
 */
export async function updatePartnerStatus(
  partnerId: string,
  status: PartnerStatus,
  reason?: string
): Promise<Partner> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'suspended') {
    updateData.suspended_at = new Date().toISOString()
    updateData.suspension_reason = reason
  }

  const { data, error } = await supabase
    .from('partners')
    .update(updateData)
    .eq('id', partnerId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update partner status: ${error.message}`)
  }

  return data as Partner
}

/**
 * Regenerate partner API key
 */
export async function regeneratePartnerApiKey(partnerId: string): Promise<string> {
  const supabase = createAdminClient()

  const newApiKey = generateApiKey()

  const { error } = await supabase
    .from('partners')
    .update({
      api_key: newApiKey,
      updated_at: new Date().toISOString(),
    })
    .eq('id', partnerId)

  if (error) {
    throw new Error(`Failed to regenerate API key: ${error.message}`)
  }

  return newApiKey
}

/**
 * Link a user account to a partner
 */
export async function linkUserToPartner(userId: string, partnerId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('users')
    .update({
      is_partner: true,
      linked_partner_id: partnerId,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to link user to partner: ${error.message}`)
  }
}

/**
 * Unlink a user account from a partner
 */
export async function unlinkUserFromPartner(userId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('users')
    .update({
      is_partner: false,
      linked_partner_id: null,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to unlink user from partner: ${error.message}`)
  }
}

/**
 * Validate partner API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // API key format: pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (pk_ + 32 hex chars)
  return /^pk_[a-f0-9]{32}$/.test(apiKey)
}

/**
 * Generate a new API key
 */
function generateApiKey(): string {
  const chars = 'abcdef0123456789'
  let result = API_KEY_PREFIX
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Get partner dashboard stats
 */
export async function getPartnerDashboardStats(partnerId: string): Promise<{
  totalLeadsUploaded: number
  totalLeadsSold: number
  totalEarnings: number
  pendingBalance: number
  availableBalance: number
  verificationPassRate: number
  duplicateRate: number
  partnerScore: number
  partnerTier: string
  leadsUploadedThisMonth: number
  leadsSoldThisMonth: number
  earningsThisMonth: number
}> {
  const supabase = createAdminClient()

  // Get partner data
  const { data: partner } = await supabase.from('partners').select('*').eq('id', partnerId).single()

  if (!partner) {
    throw new Error('Partner not found')
  }

  // Get this month's stats
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Count leads uploaded this month
  const { count: leadsUploadedThisMonth } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .gte('created_at', startOfMonth.toISOString())

  // Count leads sold this month (from marketplace_purchase_items)
  const { data: salesThisMonth } = await supabase
    .from('marketplace_purchase_items')
    .select('commission_amount')
    .eq('partner_id', partnerId)
    .gte('created_at', startOfMonth.toISOString())

  const leadsSoldThisMonth = salesThisMonth?.length || 0
  const earningsThisMonth = salesThisMonth?.reduce((sum, item) => sum + (item.commission_amount || 0), 0) || 0

  return {
    totalLeadsUploaded: partner.total_leads_uploaded || 0,
    totalLeadsSold: partner.total_leads_sold || 0,
    totalEarnings: partner.total_earnings || 0,
    pendingBalance: partner.pending_balance || 0,
    availableBalance: partner.available_balance || 0,
    verificationPassRate: partner.verification_pass_rate || 0,
    duplicateRate: partner.duplicate_rate || 0,
    partnerScore: partner.partner_score || 70,
    partnerTier: partner.partner_tier || 'standard',
    leadsUploadedThisMonth: leadsUploadedThisMonth || 0,
    leadsSoldThisMonth,
    earningsThisMonth,
  }
}

/**
 * Require partner authentication - throws if not authenticated
 */
export async function requirePartnerAuth(): Promise<Partner> {
  const { partner, error } = await authenticatePartnerFromRequest()

  if (error || !partner) {
    throw new Error(error || 'Partner authentication required')
  }

  return partner
}
