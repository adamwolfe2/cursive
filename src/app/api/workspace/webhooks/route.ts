import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Zod schema for PATCH validation
const updateWebhookSchema = z.object({
  webhook_url: z.string().url('Invalid webhook URL').optional().nullable(),
  webhook_enabled: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  notification_email: z.string().email('Invalid email address').optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user's workspace
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Get workspace webhook settings
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('webhook_url, webhook_secret, webhook_enabled, email_notifications, notification_email')
      .eq('id', user.workspace_id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        webhook_url: workspace.webhook_url,
        webhook_secret: workspace.webhook_secret,
        webhook_enabled: workspace.webhook_enabled,
        email_notifications: workspace.email_notifications,
        notification_email: workspace.notification_email,
      },
    })
  } catch (error: any) {
    console.error('Get webhook settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user's workspace
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Validate input with Zod
    const body = await request.json()
    const parseResult = updateWebhookSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { webhook_url, webhook_enabled, email_notifications, notification_email } = parseResult.data

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (webhook_url !== undefined) updateData.webhook_url = webhook_url
    if (webhook_enabled !== undefined) updateData.webhook_enabled = webhook_enabled
    if (email_notifications !== undefined) updateData.email_notifications = email_notifications
    if (notification_email !== undefined) updateData.notification_email = notification_email

    const { error } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', user.workspace_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update webhook settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

// Regenerate webhook secret
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user's workspace
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Generate new webhook secret
    const newSecret = 'whsec_' + crypto.randomUUID().replace(/-/g, '')

    const { error } = await supabase
      .from('workspaces')
      .update({ webhook_secret: newSecret })
      .eq('id', user.workspace_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to regenerate secret' }, { status: 500 })
    }

    return NextResponse.json({ success: true, webhook_secret: newSecret })
  } catch (error: any) {
    console.error('Regenerate webhook secret error:', error)
    return NextResponse.json({ error: 'Failed to regenerate secret' }, { status: 500 })
  }
}

// Test webhook
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user's workspace
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Get workspace webhook settings
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('webhook_url, webhook_secret')
      .eq('id', user.workspace_id)
      .single()

    if (!workspace?.webhook_url) {
      return NextResponse.json({ error: 'No webhook URL configured' }, { status: 400 })
    }

    // Import and use webhook service
    const { deliverWebhook, generateWebhookSignature } = await import('@/lib/services/webhook.service')

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Cursive',
        workspace_id: user.workspace_id,
      },
    }

    const result = await deliverWebhook(
      workspace.webhook_url,
      testPayload,
      workspace.webhook_secret
    )

    return NextResponse.json({
      success: result.success,
      status_code: result.statusCode,
      error: result.error,
    })
  } catch (error: any) {
    console.error('Test webhook error:', error)
    return NextResponse.json({ error: 'Failed to test webhook' }, { status: 500 })
  }
}
