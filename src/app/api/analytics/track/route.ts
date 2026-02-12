/**
 * Analytics Tracking API
 * POST /api/analytics/track - Track analytics events
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const trackSchema = z.object({
  event: z.string().min(1).max(200),
  properties: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()

    const parsed = trackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid tracking payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { event, properties } = parsed.data

    const supabase = await createClient()

    // Enrich properties with user data if authenticated
    const enrichedProperties = {
      ...properties,
      user_id: user?.id || null,
      workspace_id: user?.workspace_id || null,
      user_email: user?.email || null,
      user_plan: user?.plan || null,
    }

    // Store event in analytics table
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        event_name: event,
        properties: enrichedProperties,
        user_id: user?.id || null,
        workspace_id: user?.workspace_id || null,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      safeError('Failed to insert analytics event:', insertError)
      // Don't fail the request - analytics should never block user experience
    }

    // Send to external analytics service (PostHog, Mixpanel, etc.) if configured
    if (process.env.POSTHOG_API_KEY) {
      await sendToPostHog(event, enrichedProperties, user?.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    safeError('Analytics tracking error:', error)
    // Always return success - don't disrupt user experience
    return NextResponse.json({ success: true })
  }
}

/**
 * Send event to PostHog
 */
async function sendToPostHog(
  event: string,
  properties: any,
  userId?: string
): Promise<void> {
  try {
    await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.POSTHOG_API_KEY,
        event,
        properties: {
          ...properties,
          distinct_id: userId || properties.user_id || 'anonymous',
        },
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    safeError('PostHog tracking error:', error)
  }
}
