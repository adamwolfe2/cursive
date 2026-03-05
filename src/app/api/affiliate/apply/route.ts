/**
 * POST /api/affiliate/apply
 * Public application submission endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import {
  sendPartnerApplicationReceived,
  sendPartnerApplicationNotification,
} from '@/lib/email/affiliate-emails'
import { safeError } from '@/lib/utils/log-sanitizer'

const RATE_LIMIT: Map<string, { count: number; resetAt: number }> = new Map()
const MAX_PER_HOUR = 3

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_LIMIT.get(ip)
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true // allowed
  }
  entry.count++
  RATE_LIMIT.set(ip, entry)
  return entry.count <= MAX_PER_HOUR
}

const applySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  website: z.string().max(500).optional(),
  audienceSize: z.enum(['under_500', '500_2k', '2k_10k', '10k_50k', '50k_plus']),
  audienceTypes: z.array(z.string()).min(1).max(10),
  promotionPlan: z.string().min(10).max(2000),
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.meetcursive.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many applications from this IP. Try again later.' },
        { status: 429, headers: CORS_HEADERS }
      )
    }

    const body = await request.json()
    const validation = applySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validation.error.flatten() },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const data = validation.data
    const admin = createAdminClient()

    // Dedup: if email already has pending/approved application, return success silently
    const { data: existing } = await admin
      .from('affiliate_applications')
      .select('id, status')
      .eq('email', data.email.toLowerCase())
      .in('status', ['pending', 'approved'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true }, { headers: CORS_HEADERS }) // silent dedup
    }

    // Insert application
    const { data: application, error: insertError } = await admin
      .from('affiliate_applications')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        website: data.website || null,
        audience_size: data.audienceSize,
        audience_types: data.audienceTypes,
        promotion_plan: data.promotionPlan,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !application) {
      throw new Error(insertError?.message || 'Failed to save application')
    }

    // Send emails (non-blocking)
    sendPartnerApplicationReceived(data.email, data.firstName).catch(() => {})
    sendPartnerApplicationNotification(
      application.id,
      `${data.firstName} ${data.lastName}`,
      data.audienceTypes,
      data.audienceSize
    ).catch(() => {})

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
  } catch (error) {
    safeError('[affiliate/apply] Error:', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500, headers: CORS_HEADERS })
  }
}
