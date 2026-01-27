import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Create Supabase client with service role for tracking (no auth required)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 1x1 transparent GIF for tracking pixel
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

// Input validation schemas
const uuidSchema = z.string().uuid()
const clickTrackingSchema = z.object({
  emailSendId: z.string().uuid(),
  url: z.string().url().optional(),
})

/**
 * Handle email open tracking (GET with tracking pixel)
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const emailSendId = searchParams.get('id')

  // Validate UUID format to prevent injection
  if (emailSendId && uuidSchema.safeParse(emailSendId).success) {
    try {
      // Get the email send record with workspace validation
      const { data: emailSend } = await supabase
        .from('email_sends')
        .select('id, campaign_id, opened_at, email_campaigns!inner(workspace_id)')
        .eq('id', emailSendId)
        .single()

      // Only process if we found a valid record with a workspace
      if (emailSend && emailSend.email_campaigns && !emailSend.opened_at) {
        // Record open event
        const now = new Date().toISOString()

        await supabase.from('email_tracking_events').insert({
          email_send_id: emailSendId,
          event_type: 'open',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
        })

        // Update email send status
        await supabase
          .from('email_sends')
          .update({
            status: 'opened',
            opened_at: now,
          })
          .eq('id', emailSendId)
          .is('opened_at', null)

        // Update campaign stats
        if (emailSend.campaign_id) {
          await supabase.rpc('increment_campaign_opens', {
            p_campaign_id: emailSend.campaign_id,
          }).catch(() => {
            // Function might not exist yet
          })
        }
      }
    } catch (error) {
      console.error('Email open tracking error:', error)
    }
  }

  // Return tracking pixel regardless of success
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  })
}

/**
 * Handle click tracking (POST for click events)
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  try {
    const body = await request.json()

    // Validate input
    const parseResult = clickTrackingSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { emailSendId, url } = parseResult.data

    // Get the email send record with workspace validation
    const { data: emailSend } = await supabase
      .from('email_sends')
      .select('id, campaign_id, clicked_at, email_campaigns!inner(workspace_id)')
      .eq('id', emailSendId)
      .single()

    // Validate that the email send exists and belongs to a valid workspace
    if (!emailSend || !emailSend.email_campaigns) {
      return NextResponse.json({ error: 'Email send not found' }, { status: 404 })
    }

    // Record click event
    await supabase.from('email_tracking_events').insert({
      email_send_id: emailSendId,
      event_type: 'click',
      link_url: url,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    // Update email send status if first click
    if (!emailSend.clicked_at) {
      await supabase
        .from('email_sends')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString(),
        })
        .eq('id', emailSendId)

      // Update campaign stats
      if (emailSend.campaign_id) {
        await supabase.rpc('increment_campaign_clicks', {
          p_campaign_id: emailSend.campaign_id,
        }).catch(() => {
          // Function might not exist yet
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email click tracking error:', error)
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}
