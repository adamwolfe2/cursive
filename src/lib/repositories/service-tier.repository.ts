import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'

type ServiceTier = Database['public']['Tables']['service_tiers']['Row']
type ServiceTierInsert = Database['public']['Tables']['service_tiers']['Insert']
type ServiceSubscription = Database['public']['Tables']['service_subscriptions']['Row']
type ServiceSubscriptionInsert = Database['public']['Tables']['service_subscriptions']['Insert']
type ServiceSubscriptionUpdate = Database['public']['Tables']['service_subscriptions']['Update']
type ServiceDelivery = Database['public']['Tables']['service_deliveries']['Row']
type ServiceDeliveryInsert = Database['public']['Tables']['service_deliveries']['Insert']

export class ServiceTierRepository {
  /**
   * Get all public service tiers (for marketplace display)
   */
  async getAllPublicTiers(): Promise<ServiceTier[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_tiers')
      .select('*')
      .eq('is_public', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[ServiceTierRepo] Error fetching public tiers:', error)
      throw new Error(`Failed to fetch service tiers: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all tiers including private ones (admin only)
   */
  async getAllTiers(): Promise<ServiceTier[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_tiers')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[ServiceTierRepo] Error fetching all tiers:', error)
      throw new Error(`Failed to fetch service tiers: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a specific tier by slug
   */
  async getTierBySlug(slug: string): Promise<ServiceTier | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_tiers')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[ServiceTierRepo] Error fetching tier by slug:', error)
      throw new Error(`Failed to fetch service tier: ${error.message}`)
    }

    return data
  }

  /**
   * Get a specific tier by ID
   */
  async getTierById(id: string): Promise<ServiceTier | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_tiers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[ServiceTierRepo] Error fetching tier by ID:', error)
      throw new Error(`Failed to fetch service tier: ${error.message}`)
    }

    return data
  }

  /**
   * Get workspace's active service subscription
   */
  async getWorkspaceActiveSubscription(workspaceId: string): Promise<ServiceSubscription | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[ServiceTierRepo] Error fetching active subscription:', error)
      throw new Error(`Failed to fetch subscription: ${error.message}`)
    }

    return data
  }

  /**
   * Get all subscriptions for a workspace (all statuses)
   */
  async getWorkspaceSubscriptions(workspaceId: string): Promise<ServiceSubscription[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ServiceTierRepo] Error fetching workspace subscriptions:', error)
      throw new Error(`Failed to fetch subscriptions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get subscription with tier details
   */
  async getSubscriptionWithTier(subscriptionId: string): Promise<(ServiceSubscription & { service_tier: ServiceTier }) | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_subscriptions')
      .select('*, service_tier:service_tiers(*)')
      .eq('id', subscriptionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[ServiceTierRepo] Error fetching subscription with tier:', error)
      throw new Error(`Failed to fetch subscription: ${error.message}`)
    }

    return data as any
  }

  /**
   * Create a new service subscription
   */
  async createSubscription(data: ServiceSubscriptionInsert): Promise<ServiceSubscription> {
    const adminSupabase = createAdminClient()

    const { data: subscription, error } = await adminSupabase
      .from('service_subscriptions')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('[ServiceTierRepo] Error creating subscription:', error)
      throw new Error(`Failed to create subscription: ${error.message}`)
    }

    return subscription
  }

  /**
   * Update subscription status
   */
  async updateSubscription(id: string, updates: ServiceSubscriptionUpdate): Promise<ServiceSubscription> {
    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from('service_subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[ServiceTierRepo] Error updating subscription:', error)
      throw new Error(`Failed to update subscription: ${error.message}`)
    }

    return data
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<ServiceSubscription | null> {
    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from('service_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[ServiceTierRepo] Error fetching subscription by Stripe ID:', error)
      throw new Error(`Failed to fetch subscription: ${error.message}`)
    }

    return data
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscriptionAtPeriodEnd(id: string): Promise<ServiceSubscription> {
    return this.updateSubscription(id, {
      cancel_at_period_end: true,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Create service delivery
   */
  async createDelivery(data: ServiceDeliveryInsert): Promise<ServiceDelivery> {
    const adminSupabase = createAdminClient()

    const { data: delivery, error } = await adminSupabase
      .from('service_deliveries')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('[ServiceTierRepo] Error creating delivery:', error)
      throw new Error(`Failed to create delivery: ${error.message}`)
    }

    return delivery
  }

  /**
   * Get deliveries for a subscription
   */
  async getSubscriptionDeliveries(subscriptionId: string): Promise<ServiceDelivery[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('service_deliveries')
      .select('*')
      .eq('service_subscription_id', subscriptionId)
      .order('delivery_period_start', { ascending: false })

    if (error) {
      console.error('[ServiceTierRepo] Error fetching deliveries:', error)
      throw new Error(`Failed to fetch deliveries: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update delivery status
   */
  async updateDelivery(id: string, updates: Partial<ServiceDelivery>): Promise<ServiceDelivery> {
    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from('service_deliveries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[ServiceTierRepo] Error updating delivery:', error)
      throw new Error(`Failed to update delivery: ${error.message}`)
    }

    return data
  }

  /**
   * Get pending deliveries (for admin dashboard)
   */
  async getPendingDeliveries(): Promise<ServiceDelivery[]> {
    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from('service_deliveries')
      .select('*')
      .in('status', ['scheduled', 'in_progress'])
      .order('delivery_period_start', { ascending: true })

    if (error) {
      console.error('[ServiceTierRepo] Error fetching pending deliveries:', error)
      throw new Error(`Failed to fetch pending deliveries: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all active subscriptions (for admin dashboard)
   */
  async getAllActiveSubscriptions(): Promise<ServiceSubscription[]> {
    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from('service_subscriptions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ServiceTierRepo] Error fetching active subscriptions:', error)
      throw new Error(`Failed to fetch active subscriptions: ${error.message}`)
    }

    return data || []
  }
}

export const serviceTierRepository = new ServiceTierRepository()
