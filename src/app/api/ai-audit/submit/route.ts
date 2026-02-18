// AI Audit Submission API Route
// Public endpoint for AI Readiness Audit form submissions (no auth required)


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError, created } from '@/lib/utils/api-error-handler'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// CORS headers for cross-origin requests from marketing site
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Validation schema for AI Audit submission
const aiAuditSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  company_name: z
    .string()
    .max(200, 'Company name is too long')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(30, 'Phone number is too long')
    .optional()
    .nullable(),
  company_size: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  industry: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  ai_maturity: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  budget_range: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  biggest_bottleneck: z
    .string()
    .max(1000)
    .optional()
    .nullable(),
  using_ai: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  audit_reason: z
    .string()
    .max(1000)
    .optional()
    .nullable(),
  ideal_outcome: z
    .string()
    .max(1000)
    .optional()
    .nullable(),
  website_url: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  utm_source: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  utm_medium: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  utm_campaign: z
    .string()
    .max(200)
    .optional()
    .nullable(),
})

/**
 * OPTIONS /api/ai-audit/submit
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

/**
 * POST /api/ai-audit/submit
 * Submit an AI Readiness Audit form (public, no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, 'public-form')
    if (rateLimited) return rateLimited

    const body = await request.json()
    const validated = aiAuditSchema.parse(body)

    // Clean up empty strings and nulls for event data
    const eventData: Record<string, string> = {
      name: validated.name.trim(),
      email: validated.email.toLowerCase().trim(),
    }

    // Only include optional fields that have values
    if (validated.company_name?.trim()) eventData.company_name = validated.company_name.trim()
    if (validated.phone?.trim()) eventData.phone = validated.phone.trim()
    if (validated.company_size?.trim()) eventData.company_size = validated.company_size.trim()
    if (validated.industry?.trim()) eventData.industry = validated.industry.trim()
    if (validated.ai_maturity?.trim()) eventData.ai_maturity = validated.ai_maturity.trim()
    if (validated.budget_range?.trim()) eventData.budget_range = validated.budget_range.trim()
    if (validated.biggest_bottleneck?.trim()) eventData.biggest_bottleneck = validated.biggest_bottleneck.trim()
    if (validated.using_ai?.trim()) eventData.using_ai = validated.using_ai.trim()
    if (validated.audit_reason?.trim()) eventData.audit_reason = validated.audit_reason.trim()
    if (validated.ideal_outcome?.trim()) eventData.ideal_outcome = validated.ideal_outcome.trim()
    if (validated.website_url?.trim()) eventData.website_url = validated.website_url.trim()
    if (validated.utm_source?.trim()) eventData.utm_source = validated.utm_source.trim()
    if (validated.utm_medium?.trim()) eventData.utm_medium = validated.utm_medium.trim()
    if (validated.utm_campaign?.trim()) eventData.utm_campaign = validated.utm_campaign.trim()

    // Inngest disabled (Node.js runtime not available on this deployment)
    // Original: await inngest.send({ name: 'ai-audit/submitted', data: eventData })
    safeLog(`[AI Audit] Submission received for ${eventData.email} (Inngest event skipped - Edge runtime)`)

    // Non-blocking Slack notification
    sendSlackAlert({
      type: 'ai_audit_submission',
      severity: 'info',
      message: `New AI Audit submission: ${eventData.company_name || 'N/A'} (${eventData.email})`,
      metadata: {
        name: eventData.name,
        email: eventData.email,
        company: eventData.company_name || 'N/A',
        industry: eventData.industry || 'N/A',
        ai_maturity: eventData.ai_maturity || 'N/A',
      },
    }).catch((error) => {
      safeError('[AI Audit] Slack notification failed:', error)
    })

    const response = created({
      message: 'Audit submission received successfully!',
      email: eventData.email,
    })

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error: unknown) {
    const response = handleApiError(error)

    // Add CORS headers even on error responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}
