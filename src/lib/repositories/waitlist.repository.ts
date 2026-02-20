// Waitlist Repository
// Database access layer for waitlist signups (public, no auth required)

import { createAdminClient } from '@/lib/supabase/admin'
import { DatabaseError } from '@/types'
import { safeError } from '@/lib/utils/log-sanitizer'

export interface WaitlistSignup {
  id: string
  email: string
  first_name: string
  last_name: string
  industry: string | null
  linkedin_url: string | null
  source: string
  ip_address: string | null
  user_agent: string | null
  converted_to_user: boolean
  converted_at: string | null
  created_at: string
  updated_at: string
}

export interface WaitlistSignupInsert {
  email: string
  first_name: string
  last_name: string
  industry?: string | null
  linkedin_url?: string | null
  source?: string
  ip_address?: string | null
  user_agent?: string | null
}

export interface WaitlistListResult {
  signups: WaitlistSignup[]
  total: number
  page: number
  per_page: number
}

export class WaitlistRepository {
  /**
   * Create a new waitlist signup
   * Uses admin client to bypass RLS (public signup)
   */
  async create(signup: WaitlistSignupInsert): Promise<WaitlistSignup> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('waitlist_signups')
      .insert(signup)
      .select()
      .maybeSingle()

    if (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        throw new DatabaseError('Email already registered on waitlist')
      }
      safeError('[WaitlistRepository] Create error:', error)
      throw new DatabaseError(`Failed to create waitlist signup: ${error.message}`)
    }

    return data as WaitlistSignup
  }

  /**
   * Find signup by email
   */
  async findByEmail(email: string): Promise<WaitlistSignup | null> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('waitlist_signups')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      safeError('[WaitlistRepository] Find by email error:', error)
      throw new DatabaseError(`Failed to find waitlist signup: ${error.message}`)
    }

    return data as WaitlistSignup
  }

  /**
   * Check if email already exists on waitlist
   */
  async emailExists(email: string): Promise<boolean> {
    const supabase = createAdminClient()

    const { count, error } = await supabase
      .from('waitlist_signups')
      .select('*', { count: 'estimated', head: true })
      .eq('email', email.toLowerCase())

    if (error) {
      safeError('[WaitlistRepository] Email exists check error:', error)
      throw new DatabaseError(`Failed to check email: ${error.message}`)
    }

    return (count || 0) > 0
  }

  /**
   * Get all waitlist signups with pagination (admin only)
   */
  async findAll(page: number = 1, perPage: number = 50): Promise<WaitlistListResult> {
    const supabase = createAdminClient()

    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await supabase
      .from('waitlist_signups')
      .select('*', { count: 'estimated' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeError('[WaitlistRepository] Find all error:', error)
      throw new DatabaseError(`Failed to fetch waitlist signups: ${error.message}`)
    }

    return {
      signups: (data as WaitlistSignup[]) || [],
      total: count || 0,
      page,
      per_page: perPage,
    }
  }

  /**
   * Get waitlist count
   */
  async getCount(): Promise<number> {
    const supabase = createAdminClient()

    const { count, error } = await supabase
      .from('waitlist_signups')
      .select('*', { count: 'estimated', head: true })

    if (error) {
      safeError('[WaitlistRepository] Count error:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Mark signup as converted to user
   */
  async markAsConverted(email: string): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('waitlist_signups')
      .update({
        converted_to_user: true,
        converted_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase())

    if (error) {
      safeError('[WaitlistRepository] Mark as converted error:', error)
      throw new DatabaseError(`Failed to mark signup as converted: ${error.message}`)
    }
  }

  /**
   * Get signups by industry
   */
  async findByIndustry(industry: string): Promise<WaitlistSignup[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('waitlist_signups')
      .select('*')
      .eq('industry', industry)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[WaitlistRepository] Find by industry error:', error)
      throw new DatabaseError(`Failed to fetch signups by industry: ${error.message}`)
    }

    return (data as WaitlistSignup[]) || []
  }
}
