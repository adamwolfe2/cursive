// User Info API
// GET /api/users/me - Get current user info including credits
// PATCH /api/users/me - Update user profile


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, validationError } from '@/lib/utils/api-error-handler'
import { DAILY_CREDIT_LIMITS } from '@/lib/services/credit.service'

const notificationPreferencesSchema = z.object({
  new_leads: z.boolean().optional(),
  daily_digest: z.boolean().optional(),
  weekly_report: z.boolean().optional(),
  query_updates: z.boolean().optional(),
  credit_alerts: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  lead_delivery_email: z.boolean().optional(),
  slack_notifications: z.boolean().optional(),
  webhook_delivery: z.boolean().optional(),
  digest_time: z.string().optional(),
}).passthrough()

const patchUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200).trim().optional(),
  notification_preferences: notificationPreferencesSchema.optional(),
}).strict()

const deleteUserSchema = z.object({
  confirm_email: z.string().email('Valid email is required for confirmation'),
})

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

    // Cast to any to access columns that may exist in DB but not in generated types
    const userData = user as any
    let referralCode = userData.referral_code as string | null

    // 2. Generate referral code if missing
    if (!referralCode) {
      const supabase = await createClient()

      // Generate a unique code
      let newCode = generateReferralCode()
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        // Check if code already exists
        const { data: existingUser } = await (supabase as any)
          .from('users')
          .select('id')
          .eq('referral_code', newCode)
          .maybeSingle()

        if (!existingUser) {
          // Code is unique, save it
          const { data: updatedUser, error } = await (supabase as any)
            .from('users')
            .update({ referral_code: newCode })
            .eq('id', user.id)
            .select('referral_code')
            .maybeSingle()

          if (!error && updatedUser) {
            referralCode = (updatedUser as any).referral_code
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
    const resetAt = new Date(userData.daily_credits_reset_at || 0)
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
      referred_by: userData.referred_by || null,
      created_at: user.created_at,
      subscription_status: userData.subscription_status || null,
      subscription_period_end: userData.subscription_period_end || null,
      cancel_at_period_end: userData.cancel_at_period_end || false,
      notification_preferences: userData.notification_preferences || null,
      api_key: userData.api_key || null,
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

    // 2. Validate input with Zod
    const body = await request.json()
    const validationResult = patchUserSchema.safeParse(body)

    if (!validationResult.success) {
      if (validationResult.error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: validationResult.error.errors },
          { status: 400 }
        )
      }
      return validationError('Invalid request data')
    }

    const { full_name, notification_preferences } = validationResult.data

    // 3. Build update object
    const updates: Record<string, any> = {}

    if (full_name !== undefined) {
      updates.full_name = full_name
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
      .select('*')
      .maybeSingle()

    if (error) {
      throw error
    }

    // 6. Return updated user (cast to any for columns not in generated types)
    const updated = updatedUser as any
    const limit = DAILY_CREDIT_LIMITS[updated.plan as keyof typeof DAILY_CREDIT_LIMITS] || DAILY_CREDIT_LIMITS.free
    const resetAt = new Date(updated.daily_credits_reset_at || 0)
    const now = new Date()
    const creditsUsed = now > resetAt ? 0 : (updated.daily_credits_used || 0)
    const creditsRemaining = limit - creditsUsed

    return success({
      id: updated.id,
      email: updated.email,
      full_name: updated.full_name,
      workspace_id: updated.workspace_id,
      role: updated.role,
      plan: updated.plan,
      daily_credit_limit: updated.daily_credit_limit,
      daily_credits_used: updated.daily_credits_used,
      credits_remaining: Math.max(0, creditsRemaining),
      referral_code: updated.referral_code || null,
      referred_by: updated.referred_by || null,
      created_at: updated.created_at,
      subscription_status: updated.subscription_status || null,
      subscription_period_end: updated.subscription_period_end || null,
      cancel_at_period_end: updated.cancel_at_period_end || false,
      notification_preferences: updated.notification_preferences || null,
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

    // 2. Validate input with Zod
    const body = await request.json()
    const validationResult = deleteUserSchema.safeParse(body)

    if (!validationResult.success) {
      if (validationResult.error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: validationResult.error.errors },
          { status: 400 }
        )
      }
      return validationError('Email confirmation is required to delete account')
    }

    const { confirm_email } = validationResult.data

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
