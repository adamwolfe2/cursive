/**
 * Admin Webhook Retry API
 * Allows admins to manually retry failed webhook processing
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ webhookId: string }>
}

/**
 * POST /api/admin/webhooks/[webhookId]/retry
 * Retry processing a failed webhook event
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin()

    const { webhookId } = await context.params
    const adminClient = createAdminClient()

    // Fetch the webhook event
    const { data: event, error: fetchError } = await adminClient
      .from('webhook_events')
      .select('*')
      .eq('id', webhookId)
      .single()

    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Webhook event not found' },
        { status: 404 }
      )
    }

    safeLog('[Admin Webhook Retry] Retrying webhook:', {
      webhookId,
      eventType: event.event_type,
      originalError: event.error_message,
    })

    // Get the original Stripe event from payload
    const stripeEvent = event.payload as any

    if (!stripeEvent || !stripeEvent.type) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Reset error state
    await adminClient
      .from('webhook_events')
      .update({
        error_message: null,
        retry_count: (event.retry_count || 0) + 1,
      })
      .eq('id', webhookId)

    // Trigger reprocessing by calling the webhook handler
    // Note: In Edge runtime, we can't directly import the handler
    // Instead, we'll make an internal HTTP request to the webhook endpoint
    const webhookUrl = new URL('/api/webhooks/stripe/retry', request.url)

    const retryResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Retry': 'true',
        'X-Webhook-Event-Id': webhookId,
      },
      body: JSON.stringify(stripeEvent),
    })

    if (!retryResponse.ok) {
      const errorText = await retryResponse.text()
      safeError('[Admin Webhook Retry] Retry failed:', errorText)

      // Update error message
      await adminClient
        .from('webhook_events')
        .update({
          error_message: `Retry failed: ${errorText.substring(0, 500)}`,
        })
        .eq('id', webhookId)

      return NextResponse.json(
        {
          success: false,
          error: 'Webhook retry failed',
          details: errorText,
        },
        { status: 500 }
      )
    }

    safeLog('[Admin Webhook Retry] Successfully retried webhook:', webhookId)

    return NextResponse.json({
      success: true,
      message: 'Webhook successfully retried',
      webhook_id: webhookId,
      event_type: event.event_type,
    })
  } catch (error: any) {
    safeError('[Admin Webhook Retry] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retry webhook' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/webhooks/[webhookId]
 * Get webhook event details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin()

    const { webhookId } = await context.params
    const adminClient = createAdminClient()

    const { data: event, error } = await adminClient
      .from('webhook_events')
      .select('*')
      .eq('id', webhookId)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { error: 'Webhook event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ webhook: event })
  } catch (error: any) {
    safeError('[Admin Webhooks] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    )
  }
}
