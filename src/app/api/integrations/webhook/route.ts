/**
 * Workspace Webhook Settings API Route
 * Cursive Platform
 *
 * Manages webhook configuration for workspaces.
 */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'
import { hmacSha256Hex } from '@/lib/utils/crypto'
import { z } from 'zod'

// Request validation schemas
const updateWebhookSchema = z.object({
  webhook_url: z.string().url('Invalid webhook URL').optional().nullable(),
  webhook_enabled: z.boolean().optional(),
  webhook_events: z.array(z.string()).optional(),
})

const testWebhookSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
})

/**
 * GET - Get current webhook settings
 */
export async function GET(req: NextRequest) {
  try {
    const user = await fastAuth(req)
    if (!user) return unauthorized()

    const supabase = await createClient()

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('webhook_url, webhook_secret, webhook_enabled, webhook_events')
      .eq('id', user.workspaceId)
      .maybeSingle()

    if (error || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      webhook_url: workspace.webhook_url,
      webhook_secret: workspace.webhook_secret ? '••••••••' : null,
      webhook_enabled: workspace.webhook_enabled || false,
      webhook_events: workspace.webhook_events || ['lead.created'],
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST - Update webhook settings
 */
export async function POST(req: NextRequest) {
  try {
    const user = await fastAuth(req)
    if (!user) return unauthorized()

    const supabase = await createClient()

    const body = await req.json()
    const validation = updateWebhookSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { webhook_url, webhook_enabled, webhook_events } = validation.data

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (webhook_url !== undefined) {
      updateData.webhook_url = webhook_url
    }

    if (webhook_enabled !== undefined) {
      updateData.webhook_enabled = webhook_enabled
    }

    if (webhook_events !== undefined) {
      updateData.webhook_events = webhook_events
    }

    // Track if we're generating a new secret
    let isNewSecret = false

    // Generate new secret if URL is being set for the first time
    if (webhook_url && webhook_url.length > 0) {
      const { data: existing } = await supabase
        .from('workspaces')
        .select('webhook_secret')
        .eq('id', user.workspaceId)
        .maybeSingle()

      if (!existing?.webhook_secret) {
        updateData.webhook_secret = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
        isNewSecret = true
      }
    }

    const { error } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', user.workspaceId)

    if (error) {
      safeError('[Webhook Settings] Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update webhook settings' },
        { status: 500 }
      )
    }

    // Return updated settings (with new secret if generated)
    const { data: updated } = await supabase
      .from('workspaces')
      .select('webhook_url, webhook_secret, webhook_enabled, webhook_events')
      .eq('id', user.workspaceId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      webhook_url: updated?.webhook_url,
      // Only return full secret if we just generated it, otherwise mask
      webhook_secret: isNewSecret
        ? updated?.webhook_secret
        : (updated?.webhook_secret ? '••••••••' : null),
      webhook_enabled: updated?.webhook_enabled,
      webhook_events: updated?.webhook_events,
      ...(isNewSecret && {
        message: 'Webhook secret generated. Save it now - you won\'t see it again.',
      }),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT - Test webhook endpoint
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await fastAuth(req)
    if (!user) return unauthorized()

    const supabase = await createClient()

    const body = await req.json()
    const validation = testWebhookSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { url } = validation.data

    // Get workspace webhook secret
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('webhook_secret')
      .eq('id', user.workspaceId)
      .maybeSingle()

    // Create test payload
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Cursive',
        workspace_id: user.workspaceId,
      },
    }

    const payloadString = JSON.stringify(testPayload)

    // Generate signature
    const timestamp = Math.floor(Date.now() / 1000)
    const signaturePayload = `${timestamp}.${payloadString}`
    const signature = await hmacSha256Hex(workspace?.webhook_secret || 'test', signaturePayload)

    // Send test webhook
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cursive-Signature': `t=${timestamp},v1=${signature}`,
          'X-Cursive-Event': 'test',
          'User-Agent': 'Cursive-Webhook/1.0',
        },
        body: payloadString,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      return NextResponse.json({
        success: response.ok,
        status_code: response.status,
        message: response.ok
          ? 'Webhook test successful'
          : `Webhook returned status ${response.status}`,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          message: 'Webhook request timed out',
        })
      }

      return NextResponse.json({
        success: false,
        message: 'Failed to connect to webhook endpoint',
      })
    }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE - Regenerate webhook secret
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await fastAuth(req)
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Generate new secret
    const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await supabase
      .from('workspaces')
      .update({
        webhook_secret: newSecret,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.workspaceId)

    if (error) {
      safeError('[Webhook Settings] Regenerate error:', error)
      return NextResponse.json(
        { error: 'Failed to regenerate secret' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      webhook_secret: newSecret,
      message: 'Webhook secret regenerated successfully. Save it now - you won\'t see it again.',
      warning: 'Update your webhook consumer with this new secret immediately to avoid delivery failures.',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
