import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/monitoring/logger'

// These tables are not yet in the generated database types, so we define them manually
interface ServiceTier {
  id: string
  name: string
  slug: string
  description: string | null
  is_public: boolean
  display_order: number
  monthly_price: number | null
  annual_price: number | null
  features: Record<string, unknown> | null
  stripe_monthly_price_id: string | null
  stripe_annual_price_id: string | null
  created_at: string
  updated_at: string
}

type ServiceTierInsert = Omit<ServiceTier, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

interface ServiceSubscription {
  id: string
  workspace_id: string
  service_tier_id: string
  stripe_subscription_id: string | null
  status: string
  cancel_at_period_end: boolean
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

type ServiceSubscriptionInsert = Omit<ServiceSubscription, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

type ServiceSubscriptionUpdate = Partial<ServiceSubscription>

interface ServiceDelivery {
  id: string
  service_subscription_id: string
  status: string
  delivery_period_start: string
  delivery_period_end: string | null
  delivered_count: number
  notes: string | null
  created_at: string
  updated_at: string
}

type ServiceDeliveryInsert = Omit<ServiceDelivery, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export class ServiceTierRepository {
  /**
   * Get all public service tiers (for marketplace display)
   */
  async getAllPublicTiers(): Promise<ServiceTier[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('service_tiers')
      .select('*')
      .eq('is_public', true)
      .order('display_order', { ascending: true })

    if (error) {
      logger.error('[ServiceTierRepo] Error fetching public tiers:', error)
      throw new Error(`Failed to fetch service tiers: ${(error as any).message}`)
    }

    return (data as ServiceTier[]) || []
  }

  /**
   * Get all tiers including private ones (admin only)
   */
  async getAllTiers(): Promise<ServiceTier[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('service_tiers')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      logger.error('[ServiceTierRepo] Error fetching all tiers:', error)
      throw new Error(`Failed to fetch service tiers: ${(error as any).message}`)
    }

    return (data as ServiceTier[]) || []
  }

  /**
   * Get a specific tier by slug
   */
  async getTierBySlug(slug: string): Promise<ServiceTier | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('service_tiers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null
      }
      logger.error('[ServiceTierRepo] Error fetching tier by slug:', error)
      throw new Error(`Failed to fetch service tier: ${(error as any).message}`)
    }

    return data as ServiceTier
  }

  /**
   * Get a specific tier by ID
   */
  async getTierById(id: string): Promise<ServiceTier | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('service_tiers')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null
      }
      logger.error('[ServiceTierRepo] Error fetching tier by ID:', error)
      throw new Error(`Failed to fetch service tier: ${(error as any).message}`)
    }

    return data as ServiceTier
  }

  /**
   * Get workspace's active service subscription
   */
  async getWorkspaceActiveSubscription(workspaceId: string): Promise<ServiceSubscription | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('service_subscriptions')
      .select('*, service_tiers(*)')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null
      }
      logger.error('[ServiceTierRepo] Error fetching active subscription:', error)
      throw new Error(`Failed to fetch subscription: ${(error as any).message}`)
    }

    return data as ServiceSubscription
  }

  /**
   * Get all subscriptions for a workspace (all statuses)
   */
  async getWorkspaceSubscriptions(workspaceId: string): Promise<ServiceSubscription[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('service_subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[ServiceTierRepo] Error fetching workspace subscriptions:', error)
      throw new Error(`Failed to fetch subscriptions: ${(error as any).message}`)
    }

    return (data as ServiceSubscription[]) || []
  }

  /**
   * Get subscription with tier details
   */
  async getSubscriptionWithTier(subscriptionId: string): Promise<(ServiceSubscription & { service_tier: ServiceTier }) | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('service_subscriptions')
      .select('*, service_tier:service_tiers(*)')
      .eq('id', subscriptionId)
      .maybeSingle()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null
      }
      logger.error('[ServiceTierRepo] Error fetching subscription with tier:', error)
      throw new Error(`Failed to fetch subscription: ${(error as any).message}`)
    }

    return data as unknown as (ServiceSubscription & { service_tier: ServiceTier })
  }

  /**
   * Create a new service subscription
   */
  async createSubscription(data: ServiceSubscriptionInsert): Promise<ServiceSubscription> {
    const adminSupabase = createAdminClient()

    const { data: subscription, error } = await (adminSupabase as any)
      .from('service_subscriptions')
      .insert(data)
      .select()
      .maybeSingle()

    if (error) {
      logger.error('[ServiceTierRepo] Error creating subscription:', error)
      throw new Error(`Failed to create subscription: ${(error as any).message}`)
    }

    return subscription as ServiceSubscription
  }

  /**
   * Update subscription status
   */
  async updateSubscription(id: string, updates: ServiceSubscriptionUpdate): Promise<ServiceSubscription> {
    const adminSupabase = createAdminClient()

    const { data, error } = await (adminSupabase as any)
      .from('service_subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      logger.error('[ServiceTierRepo] Error updating subscription:', error)
      throw new Error(`Failed to update subscription: ${(error as any).message}`)
    }

    return data as ServiceSubscription
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<ServiceSubscription | null> {
    const adminSupabase = createAdminClient()

    const { data, error } = await (adminSupabase as any)
      .from('service_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null
      }
      logger.error('[ServiceTierRepo] Error fetching subscription by Stripe ID:', error)
      throw new Error(`Failed to fetch subscription: ${(error as any).message}`)
    }

    return data as ServiceSubscription
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

    const { data: delivery, error } = await (adminSupabase as any)
      .from('service_deliveries')
      .insert(data)
      .select()
      .maybeSingle()

    if (error) {
      logger.error('[ServiceTierRepo] Error creating delivery:', error)
      throw new Error(`Failed to create delivery: ${(error as any).message}`)
    }

    return delivery as ServiceDelivery
  }

  /**
   * Get deliveries for a subscription
   */
  async getSubscriptionDeliveries(subscriptionId: string): Promise<ServiceDelivery[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('service_deliveries')
      .select('*')
      .eq('service_subscription_id', subscriptionId)
      .order('delivery_period_start', { ascending: false })

    if (error) {
      logger.error('[ServiceTierRepo] Error fetching deliveries:', error)
      throw new Error(`Failed to fetch deliveries: ${(error as any).message}`)
    }

    return (data as ServiceDelivery[]) || []
  }

  /**
   * Update delivery status
   */
  async updateDelivery(id: string, updates: Partial<ServiceDelivery>): Promise<ServiceDelivery> {
    const adminSupabase = createAdminClient()

    const { data, error } = await (adminSupabase as any)
      .from('service_deliveries')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      logger.error('[ServiceTierRepo] Error updating delivery:', error)
      throw new Error(`Failed to update delivery: ${(error as any).message}`)
    }

    return data as ServiceDelivery
  }

  /**
   * Get pending deliveries (for admin dashboard)
   */
  async getPendingDeliveries(): Promise<ServiceDelivery[]> {
    const adminSupabase = createAdminClient()

    const { data, error } = await (adminSupabase as any)
      .from('service_deliveries')
      .select('*')
      .in('status', ['scheduled', 'in_progress'])
      .order('delivery_period_start', { ascending: true })

    if (error) {
      logger.error('[ServiceTierRepo] Error fetching pending deliveries:', error)
      throw new Error(`Failed to fetch pending deliveries: ${(error as any).message}`)
    }

    return (data as ServiceDelivery[]) || []
  }

  /**
   * Get all active subscriptions (for admin dashboard)
   */
  async getAllActiveSubscriptions(): Promise<ServiceSubscription[]> {
    const adminSupabase = createAdminClient()

    const { data, error } = await (adminSupabase as any)
      .from('service_subscriptions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[ServiceTierRepo] Error fetching active subscriptions:', error)
      throw new Error(`Failed to fetch active subscriptions: ${(error as any).message}`)
    }

    return (data as ServiceSubscription[]) || []
  }
}

export const serviceTierRepository = new ServiceTierRepository()
