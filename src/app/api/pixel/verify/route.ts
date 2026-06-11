import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getCurrentUser } from '@/lib/auth/helpers'
import { unauthorized } from '@/lib/utils/api-error-handler'

/**
 * GET /api/pixel/verify
 *
 * Checks whether the workspace's pixel has received any events in the last 7 days.
 * Returns verification status, last event timestamp, event count, and pixel ID.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the pixel for this workspace (RLS enforces isolation)
    const { data: pixel, error: pixelError } = await supabase
      .from('audiencelab_pixels')
      .select('id, pixel_id, last_v4_synced_at, created_at')
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (pixelError) {
      safeError('[API] Pixel verify — failed to fetch pixel:', pixelError)
    }

    if (!pixel) {
      return NextResponse.json({
        verified: false,
        lastEventAt: null,
        eventCount: 0,
        pixelId: null,
      })
    }

    // Check for events in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { count, error: countError } = await supabase
      .from('audiencelab_events')
      .select('*', { count: 'exact', head: true })
      .eq('pixel_row_id', pixel.id)
      .gte('received_at', sevenDaysAgo)

    if (countError) {
      safeError('[API] Pixel verify — failed to count events:', countError)
    }

    const eventCount = count ?? 0

    // Fetch the most recent event timestamp (only if there are events)
    let lastEventAt: string | null = null
    if (eventCount > 0) {
      const { data: latestEvent, error: latestError } = await supabase
        .from('audiencelab_events')
        .select('received_at')
        .eq('pixel_row_id', pixel.id)
        .gte('received_at', sevenDaysAgo)
        .order('received_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestError) {
        safeError('[API] Pixel verify — failed to fetch latest event:', latestError)
      } else {
        lastEventAt = latestEvent?.received_at ?? null
      }
    }

    // Frontload ROI: the buyer is on the install/verify screen, so the pixel is
    // (about to be) live. Kick an immediate AL visitor pull AFTER the response
    // (non-blocking, throttled to once / 5 min) so their backlog is already
    // landing as leads by the time they open the dashboard — even earlier than
    // the dashboard-open trigger.
    const lastSyncMs = pixel.last_v4_synced_at
      ? new Date(pixel.last_v4_synced_at as string).getTime()
      : 0
    if (Date.now() - lastSyncMs > 5 * 60_000) {
      after(() =>
        inngest
          .send({
            name: 'pixel/v4-sync.requested',
            data: {
              pixel_row_id: pixel.id,
              al_pixel_id: pixel.pixel_id,
              workspace_id: user.workspace_id,
              pixel_created_at:
                (pixel.created_at as string) ?? new Date().toISOString(),
              last_v4_synced_at: (pixel.last_v4_synced_at as string) ?? null,
            },
          })
          .catch(() => undefined)
      )
    }

    return NextResponse.json({
      verified: eventCount > 0,
      lastEventAt,
      eventCount,
      pixelId: pixel.pixel_id,
    })
  } catch (error) {
    safeError('[API] Pixel verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify pixel installation' },
      { status: 500 }
    )
  }
}
