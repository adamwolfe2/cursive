// User Info API
// GET /api/users/me - Get current user info including credits
// PATCH /api/users/me - Update user profile

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, validationError } from '@/lib/utils/api-error-handler'
import { DAILY_CREDIT_LIMITS } from '@/lib/services/credit.service'

// Generate a unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    let referralCode = user.referral_code

    // 2. Generate referral code if missing
    if (!referralCode) {
      const supabase = await createClient()

      // Generate a unique code
      let newCode = generateReferralCode()
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        // Check if code already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', newCode)
          .single()

        if (!existingUser) {
          // Code is unique, save it
          const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ referral_code: newCode })
            .eq('id', user.id)
            .select('referral_code')
            .single()

          if (!error && updatedUser) {
            referralCode = updatedUser.referral_code
          }
          break
        }

        // Code exists, generate a new one
        newCode = generateReferralCode()
        attempts++
      }
    }

    // 3. Calculate credits remaining using plan-based limits
    const limit = DAILY_CREDIT_LIMITS[user.plan as keyof typeof DAILY_CREDIT_LIMITS] || DAILY_CREDIT_LIMITS.free

    // Check if daily reset is needed
    const resetAt = new Date(user.daily_credits_reset_at || 0)
    const now = new Date()
    const creditsUsed = now > resetAt ? 0 : (user.daily_credits_used || 0)

    const creditsRemaining = limit - creditsUsed

    // 4. Return response
    return success({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      workspace_id: user.workspace_id,
      role: user.role,
      plan: user.plan,
      daily_credit_limit: user.daily_credit_limit,
      daily_credits_used: user.daily_credits_used,
      credits_remaining: Math.max(0, creditsRemaining),
      referral_code: referralCode,
      referred_by: user.referred_by,
      created_at: user.created_at,
      subscription_status: user.subscription_status,
      subscription_period_end: user.subscription_period_end,
      cancel_at_period_end: user.cancel_at_period_end,
      notification_preferences: user.notification_preferences,
      api_key: (user as any).api_key || null,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Get update data
    const body = await request.json()
    const { full_name, notification_preferences } = body

    // 3. Build update object
    const updates: Record<string, any> = {}

    if (full_name !== undefined) {
      if (typeof full_name !== 'string' || full_name.trim().length === 0) {
        return validationError('Full name is required')
      }
      updates.full_name = full_name.trim()
    }

    if (notification_preferences !== undefined) {
      updates.notification_preferences = notification_preferences
    }

    // 4. Check if there's anything to update
    if (Object.keys(updates).length === 0) {
      return validationError('No valid fields to update')
    }

    // 5. Update user
    const supabase = await createClient()
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('id, email, full_name, workspace_id, role, plan, daily_credit_limit, daily_credits_used, daily_credits_reset_at, referral_code, referred_by, created_at, subscription_status, subscription_period_end, cancel_at_period_end, notification_preferences')
      .single()

    if (error) {
      throw error
    }

    // 6. Return updated user
    const limit = DAILY_CREDIT_LIMITS[updatedUser.plan as keyof typeof DAILY_CREDIT_LIMITS] || DAILY_CREDIT_LIMITS.free
    const resetAt = new Date(updatedUser.daily_credits_reset_at || 0)
    const now = new Date()
    const creditsUsed = now > resetAt ? 0 : (updatedUser.daily_credits_used || 0)
    const creditsRemaining = limit - creditsUsed

    return success({
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      workspace_id: updatedUser.workspace_id,
      role: updatedUser.role,
      plan: updatedUser.plan,
      daily_credit_limit: updatedUser.daily_credit_limit,
      daily_credits_used: updatedUser.daily_credits_used,
      credits_remaining: Math.max(0, creditsRemaining),
      referral_code: updatedUser.referral_code,
      referred_by: updatedUser.referred_by,
      created_at: updatedUser.created_at,
      subscription_status: updatedUser.subscription_status,
      subscription_period_end: updatedUser.subscription_period_end,
      cancel_at_period_end: updatedUser.cancel_at_period_end,
      notification_preferences: updatedUser.notification_preferences,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Require email confirmation to prevent accidental deletion
    const body = await request.json()
    const { confirm_email } = body

    if (!confirm_email || typeof confirm_email !== 'string') {
      return validationError('Email confirmation is required to delete account')
    }

    if (confirm_email.toLowerCase() !== user.email.toLowerCase()) {
      return validationError('Email confirmation does not match your account email')
    }

    // 3. Delete user account
    // Note: This should cascade delete related data based on FK constraints
    const supabase = await createClient()

    // First, delete from users table (this will cascade)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    if (error) {
      throw error
    }

    // Sign out the user from auth
    await supabase.auth.signOut()

    return success({ message: 'Account deleted successfully' })
  } catch (error: any) {
    return handleApiError(error)
  }
}
