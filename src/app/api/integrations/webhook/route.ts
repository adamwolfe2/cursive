/**
 * Workspace Webhook Settings API Route
 * Cursive Platform
 *
 * Manages webhook configuration for workspaces.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import crypto from 'crypto'

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
 * Get authenticated user from session
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { user: null, supabase }
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, workspace_id, email')
    .eq('auth_user_id', session.user.id)
    .single()

  return { user, supabase }
}

/**
 * GET - Get current webhook settings
 */
export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('webhook_url, webhook_secret, webhook_enabled, webhook_events')
      .eq('id', user.workspace_id)
      .single()

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
  } catch (error: any) {
    console.error('[Webhook Settings] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook settings' },
      { status: 500 }
    )
  }
}

/**
 * POST - Update webhook settings
 */
export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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

    // Generate new secret if URL is being set for the first time
    if (webhook_url && webhook_url.length > 0) {
      const { data: existing } = await supabase
        .from('workspaces')
        .select('webhook_secret')
        .eq('id', user.workspace_id)
        .single()

      if (!existing?.webhook_secret) {
        updateData.webhook_secret = crypto.randomBytes(32).toString('hex')
      }
    }

    const { error } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', user.workspace_id)

    if (error) {
      console.error('[Webhook Settings] Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update webhook settings' },
        { status: 500 }
      )
    }

    // Return updated settings (with new secret if generated)
    const { data: updated } = await supabase
      .from('workspaces')
      .select('webhook_url, webhook_secret, webhook_enabled, webhook_events')
      .eq('id', user.workspace_id)
      .single()

    return NextResponse.json({
      success: true,
      webhook_url: updated?.webhook_url,
      webhook_secret: updated?.webhook_secret,
      webhook_enabled: updated?.webhook_enabled,
      webhook_events: updated?.webhook_events,
    })
  } catch (error: any) {
    console.error('[Webhook Settings] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update webhook settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Test webhook endpoint
 */
export async function PUT(req: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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
      .eq('id', user.workspace_id)
      .single()

    // Create test payload
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Cursive',
        workspace_id: user.workspace_id,
      },
    }

    const payloadString = JSON.stringify(testPayload)

    // Generate signature
    const timestamp = Math.floor(Date.now() / 1000)
    const signaturePayload = `${timestamp}.${payloadString}`
    const signature = crypto
      .createHmac('sha256', workspace?.webhook_secret || 'test')
      .update(signaturePayload)
      .digest('hex')

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
        message: `Failed to connect: ${fetchError.message}`,
      })
    }
  } catch (error: any) {
    console.error('[Webhook Settings] Test error:', error)
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Regenerate webhook secret
 */
export async function DELETE(req: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('hex')

    const { error } = await supabase
      .from('workspaces')
      .update({
        webhook_secret: newSecret,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.workspace_id)

    if (error) {
      console.error('[Webhook Settings] Regenerate error:', error)
      return NextResponse.json(
        { error: 'Failed to regenerate secret' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      webhook_secret: newSecret,
      message: 'Webhook secret regenerated successfully',
    })
  } catch (error: any) {
    console.error('[Webhook Settings] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate secret' },
      { status: 500 }
    )
  }
}
