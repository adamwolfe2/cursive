import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role for tracking (no auth required)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1x1 transparent GIF for tracking pixel
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

/**
 * Handle email open tracking (GET with tracking pixel)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const emailSendId = searchParams.get('id')

  if (emailSendId) {
    try {
      // Get the email send record
      const { data: emailSend } = await supabase
        .from('email_sends')
        .select('id, campaign_id, opened_at')
        .eq('id', emailSendId)
        .single()

      if (emailSend && !emailSend.opened_at) {
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
  try {
    const { emailSendId, url } = await request.json()

    if (!emailSendId) {
      return NextResponse.json({ error: 'Missing emailSendId' }, { status: 400 })
    }

    // Get the email send record
    const { data: emailSend } = await supabase
      .from('email_sends')
      .select('id, campaign_id, clicked_at')
      .eq('id', emailSendId)
      .single()

    if (!emailSend) {
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
