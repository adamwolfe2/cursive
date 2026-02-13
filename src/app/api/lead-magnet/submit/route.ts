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

    // TODO: Send email with link to onboarding form
    // For now, we'll just log and notify via Slack
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
