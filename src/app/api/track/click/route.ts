import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// Allowed domains for redirect URLs (prevent open redirect attacks)
const ALLOWED_REDIRECT_DOMAINS = [
  'meetcursive.com',
  'cursive.com',
  'localhost',
  '127.0.0.1',
]

// Validation schema
const querySchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().optional(),
})

/**
 * Validate URL is safe for redirect (prevent open redirect attacks)
 */
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }
    // Check if domain is in allowlist or is a subdomain of allowed domains
    const hostname = parsed.hostname.toLowerCase()
    return ALLOWED_REDIRECT_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

/**
 * Handle click tracking with redirect
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Validate input
  const parseResult = querySchema.safeParse({
    id: searchParams.get('id') || undefined,
    url: searchParams.get('url') || undefined,
  })

  if (!parseResult.success) {
    // Invalid params - redirect to safe fallback
    const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meetcursive.com'
    return NextResponse.redirect(fallbackUrl, { status: 302 })
  }

  const { id: emailSendId, url: encodedUrl } = parseResult.data

  // Decode and validate the target URL
  let targetUrl: string | null = null
  if (encodedUrl) {
    try {
      const decoded = decodeURIComponent(encodedUrl)
      if (isValidRedirectUrl(decoded)) {
        targetUrl = decoded
      }
    } catch {
      // Invalid encoding - ignore
    }
  }

  if (emailSendId && targetUrl) {
    try {
      const supabase = createAdminClient()
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

  // Redirect to validated target URL or safe fallback
  const redirectUrl = targetUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://meetcursive.com'

  return NextResponse.redirect(redirectUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  })
}
