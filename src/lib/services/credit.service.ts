// Credit Service
// Manages user credits and daily limits

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export type CreditAction = 'lead_generation' | 'email_reveal' | 'export' | 'people_search'

interface CreditCost {
  action: CreditAction
  cost: number
}

// Credit costs per action
export const CREDIT_COSTS: Record<CreditAction, number> = {
  lead_generation: 1,
  email_reveal: 1,
  export: 5,
  people_search: 2,
}

// Daily credit limits by plan
export const DAILY_CREDIT_LIMITS = {
  free: 3,
  pro: 1000,
}

export interface CreditCheckResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: Date
  message?: string
}

export class CreditService {
  /**
   * Check if user has enough credits for action
   */
  static async checkCredits(
    userId: string,
    action: CreditAction
  ): Promise<CreditCheckResult> {
    const supabase = await createClient()

    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('plan, daily_credits_used, daily_credits_reset_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      throw new Error('User not found')
    }

    // Check if reset needed
    const resetAt = new Date(user.daily_credits_reset_at || 0)
    const now = new Date()
    const shouldReset = now > resetAt

    let creditsUsed = user.daily_credits_used

    if (shouldReset) {
      // Reset credits
      creditsUsed = 0
      const nextReset = new Date(now)
      nextReset.setHours(24, 0, 0, 0) // Reset at midnight

      await supabase
        .from('users')
        .update({
          daily_credits_used: 0,
          daily_credits_reset_at: nextReset.toISOString(),
        })
        .eq('id', userId)
    }

    // Get limit and cost
    const limit = DAILY_CREDIT_LIMITS[user.plan as keyof typeof DAILY_CREDIT_LIMITS] || DAILY_CREDIT_LIMITS.free
    const cost = CREDIT_COSTS[action]
    const remaining = limit - creditsUsed

    // Check if allowed
    const allowed = remaining >= cost

    return {
      allowed,
      remaining: Math.max(0, remaining - (allowed ? cost : 0)),
      limit,
      resetAt: shouldReset ? new Date(now.setHours(24, 0, 0, 0)) : resetAt,
      message: allowed
        ? undefined
        : `Insufficient credits. You need ${cost} credits but only have ${remaining} remaining. ${user.plan === 'free' ? 'Upgrade to Pro for more credits.' : 'Credits reset daily at midnight.'}`,
    }
  }

  /**
   * Consume credits for action
   */
  static async consumeCredits(
    userId: string,
    workspaceId: string,
    action: CreditAction
  ): Promise<void> {
    const supabase = await createClient()
    const cost = CREDIT_COSTS[action]

    // Increment usage
    const { error: updateError } = await supabase.rpc('increment_credits', {
      user_id: userId,
      amount: cost,
    })

    if (updateError) {
      // Fallback to manual update if RPC doesn't exist
      const { data: user } = await supabase
        .from('users')
        .select('daily_credits_used')
        .eq('id', userId)
        .single()

      if (user) {
        await supabase
          .from('users')
          .update({ daily_credits_used: user.daily_credits_used + cost })
          .eq('id', userId)
      }
    }

    // Log usage
    await supabase.from('credit_usage').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action_type: action,
      credits_used: cost,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Get credit usage for workspace
   */
  static async getUsageStats(workspaceId: string, days: number = 30) {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('credit_usage')
      .select('action_type, credits_used, timestamp')
      .eq('workspace_id', workspaceId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch usage stats')
    }

    // Aggregate by action type
    const stats = data.reduce(
      (acc, usage) => {
        const action = usage.action_type as CreditAction
        if (!acc[action]) {
          acc[action] = { count: 0, total: 0 }
        }
        acc[action].count++
        acc[action].total += usage.credits_used
        return acc
      },
      {} as Record<CreditAction, { count: number; total: number }>
    )

    return stats
  }

  /**
   * Get remaining credits for user
   */
  static async getRemainingCredits(userId: string): Promise<{
    remaining: number
    limit: number
    resetAt: Date
    plan: string
  }> {
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('plan, daily_credits_used, daily_credits_reset_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      throw new Error('User not found')
    }

    const limit = DAILY_CREDIT_LIMITS[user.plan as keyof typeof DAILY_CREDIT_LIMITS] || DAILY_CREDIT_LIMITS.free
    const resetAt = new Date(user.daily_credits_reset_at || 0)
    const now = new Date()

    // Check if reset needed
    const creditsUsed = now > resetAt ? 0 : user.daily_credits_used
    const remaining = Math.max(0, limit - creditsUsed)

    return {
      remaining,
      limit,
      resetAt: now > resetAt ? new Date(now.setHours(24, 0, 0, 0)) : resetAt,
      plan: user.plan,
    }
  }
}
