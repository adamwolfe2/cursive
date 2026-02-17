import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace_id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    // SECURITY FIX: Use standard client instead of admin client to enforce RLS policies
    // This ensures users can only access their own workspace's pixel data

    // Get pixel for this workspace (RLS will enforce workspace isolation)
    const { data: pixel, error: pixelError } = await supabase
      .from('audiencelab_pixels')
      .select('pixel_id, domain, is_active, snippet, install_url, created_at, label, trial_ends_at, trial_status, visitor_count_total, visitor_count_identified')
      .eq('workspace_id', userData.workspace_id)
      .maybeSingle()

    if (pixelError) {
      console.error('[API] Failed to fetch pixel:', pixelError)
      // Don't expose error details to client
    }

    // Count recent superpixel events (last 24h) by pixel_id
    let recentEvents = 0
    if (pixel) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count, error: eventsError } = await supabase
        .from('audiencelab_events')
        .select('*', { count: 'exact', head: true })
        .eq('pixel_id', pixel.pixel_id)
        .eq('source', 'superpixel')
        .gte('received_at', twentyFourHoursAgo)

      if (eventsError) {
        console.error('[API] Failed to fetch events count:', eventsError)
        // Continue with recentEvents = 0
      } else {
        recentEvents = count || 0
      }
    }

    return NextResponse.json({
      has_pixel: !!pixel,
      pixel: pixel ? {
        pixel_id: pixel.pixel_id,
        domain: pixel.domain,
        is_active: pixel.is_active,
        snippet: pixel.snippet,
        install_url: pixel.install_url,
        label: pixel.label,
        created_at: pixel.created_at,
        trial_ends_at: pixel.trial_ends_at ?? null,
        trial_status: pixel.trial_status ?? null,
        visitor_count_total: pixel.visitor_count_total ?? null,
        visitor_count_identified: pixel.visitor_count_identified ?? null,
      } : null,
      recent_events: recentEvents,
    })
  } catch (error) {
    console.error('[API] Pixel status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pixel status' },
      { status: 500 }
    )
  }
}
