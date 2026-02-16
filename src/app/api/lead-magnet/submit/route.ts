/**
 * Lead Magnet Submission API
 * Simple email capture for "Free Audit" modal
 * Sends email with link to full onboarding form
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { createAdminClient } from '@/lib/supabase/admin'

// CORS headers for marketing site
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const leadMagnetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  audit_type: z.enum(['ai_audit', 'visitor_audit']),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
})

/**
 * OPTIONS /api/lead-magnet/submit
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

/**
 * POST /api/lead-magnet/submit
 * Capture email for audit lead magnet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, audit_type, utm_source, utm_medium, utm_campaign } = leadMagnetSchema.parse(body)

    const adminClient = createAdminClient()

    // Store lead magnet submission
    const { data: submission, error: insertError } = await adminClient
      .from('lead_magnet_submissions')
      .insert({
        email: email.toLowerCase().trim(),
        audit_type,
        utm_source,
        utm_medium,
        utm_campaign,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer'),
      })
      .select()
      .single()

    if (insertError) {
      // If duplicate email, that's okay - just return success
      if (insertError.code === '23505') {
        safeLog('[Lead Magnet] Duplicate submission:', email)
      } else {
        throw insertError
      }
    }

    // Send Slack notification
    sendSlackAlert({
      type: 'lead_magnet_submission',
      severity: 'info',
      message: `🎯 New ${audit_type === 'ai_audit' ? 'AI Audit' : 'Visitor Audit'} lead: ${email}`,
      metadata: {
        email,
        audit_type,
        utm_source: utm_source || 'direct',
        utm_medium: utm_medium || 'none',
      },
    }).catch((error) => {
      safeError('[Lead Magnet] Slack notification failed:', error)
    })

    // Send confirmation email with next steps
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://leads.meetcursive.com'
    const onboardingUrl = `${baseUrl}/onboarding?email=${encodeURIComponent(email)}&type=${audit_type}`

    try {
      const { sendEmail, EMAIL_CONFIG } = await import('@/lib/email/resend-client')
      await sendEmail({
        to: email,
        subject: audit_type === 'ai_audit'
          ? 'Your AI Audit is Ready - Next Steps'
          : 'Set Up Your Free Visitor Tracking',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 32px 0 24px;">
              <img src="${EMAIL_CONFIG.logoUrl}" alt="Cursive" width="120" style="display: inline-block;" />
            </div>
            <div style="background: #fff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px;">
              <h1 style="font-size: 24px; font-weight: 600; color: #000; margin: 0 0 16px;">
                ${audit_type === 'ai_audit' ? 'Your AI Audit Awaits' : 'Start Tracking Visitors'}
              </h1>
              <p style="font-size: 16px; color: #71717a; line-height: 1.6; margin: 0 0 24px;">
                ${audit_type === 'ai_audit'
                  ? 'We\'re preparing your personalized AI-powered audit. Complete the quick onboarding form below so we can tailor the results to your business.'
                  : 'You\'re one step away from seeing who visits your website. Complete the setup below to start identifying your anonymous visitors.'}
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${onboardingUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  ${audit_type === 'ai_audit' ? 'Complete Your Audit Setup' : 'Set Up Visitor Tracking'}
                </a>
              </div>
              <p style="font-size: 14px; color: #a1a1aa; margin: 24px 0 0; text-align: center;">
                Questions? Reply to this email - we're here to help.
              </p>
            </div>
            <div style="text-align: center; padding: 24px 0; color: #a1a1aa; font-size: 12px;">
              <p>Cursive &middot; Your Growth Engine</p>
            </div>
          </div>
        `,
      })
      safeLog('[Lead Magnet] Confirmation email sent to:', email)
    } catch (emailError) {
      // Don't fail the submission if email fails - Slack notification is the fallback
      safeError('[Lead Magnet] Failed to send confirmation email:', emailError)
    }

    safeLog('[Lead Magnet] Submission stored:', {
      email,
      audit_type,
      id: submission?.id,
    })

    const response = NextResponse.json(
      {
        success: true,
        message: audit_type === 'ai_audit'
          ? 'Thanks! Check your email for next steps to get your personalized AI audit.'
          : 'Thanks! Check your email for instructions to set up your free website visitor tracking.',
        email,
      },
      { status: 201 }
    )

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    safeError('[Lead Magnet] Submission error:', error)

    const response = NextResponse.json(
      {
        error: error instanceof z.ZodError
          ? 'Please enter a valid email address'
          : 'Something went wrong. Please try again.',
      },
      { status: error instanceof z.ZodError ? 400 : 500 }
    )

    // Add CORS headers even on errors
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}
