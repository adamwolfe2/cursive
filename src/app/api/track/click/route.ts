import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Handle click tracking with redirect
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const emailSendId = searchParams.get('id')
  const encodedUrl = searchParams.get('url')

  // Decode the target URL
  const targetUrl = encodedUrl ? decodeURIComponent(encodedUrl) : null

  if (emailSendId && targetUrl) {
    try {
      const supabase = getSupabaseAdmin()
      // Get the email send record
      const { data: emailSend } = await supabase
        .from('email_sends')
        .select('id, campaign_id, clicked_at')
        .eq('id', emailSendId)
        .single()

      if (emailSend) {
        // Record click event
        await supabase.from('email_tracking_events').insert({
          email_send_id: emailSendId,
          event_type: 'click',
          link_url: targetUrl,
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
            }).catch(() => {})
          }
        }
      }
    } catch (error) {
      console.error('Click tracking error:', error)
    }
  }

  // Redirect to target URL or fallback
  const redirectUrl = targetUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://meetcursive.com'

  return NextResponse.redirect(redirectUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  })
}
