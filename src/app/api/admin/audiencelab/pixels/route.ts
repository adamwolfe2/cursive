/**
 * Admin Audience Labs Pixel Management API
 * Manage pixel → workspace mappings and create new pixels
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { z } from 'zod'

/**
 * GET /api/admin/audiencelab/pixels
 * List all pixels with workspace mappings and stats
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()

    // Get all pixels with workspace info and event counts
    const { data: pixels, error } = await adminClient
      .from('audiencelab_pixels')
      .select(`
        *,
        workspaces (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Get event counts per pixel
    const { data: eventCounts } = await adminClient
      .from('audiencelab_events')
      .select('pixel_id, processed')
      .not('pixel_id', 'is', null)

    // Aggregate counts
    const statsMap = new Map<string, { total: number; processed: number; unprocessed: number }>()
    eventCounts?.forEach(event => {
      if (!event.pixel_id) return
      const stats = statsMap.get(event.pixel_id) || { total: 0, processed: 0, unprocessed: 0 }
      stats.total++
      if (event.processed) {
        stats.processed++
      } else {
        stats.unprocessed++
      }
      statsMap.set(event.pixel_id, stats)
    })

    // Get orphaned events (unknown pixel_ids)
    const { data: orphanedEvents } = await adminClient
      .from('audiencelab_events')
      .select('pixel_id, id')
      .is('workspace_id', null)
      .order('created_at', { ascending: false })
      .limit(100)

    // Group orphaned events by pixel_id
    const orphanedMap = new Map<string, number>()
    orphanedEvents?.forEach(event => {
      if (!event.pixel_id) return
      orphanedMap.set(event.pixel_id, (orphanedMap.get(event.pixel_id) || 0) + 1)
    })

    // Combine data
    const pixelsWithStats = pixels?.map(pixel => ({
      ...pixel,
      stats: statsMap.get(pixel.pixel_id) || { total: 0, processed: 0, unprocessed: 0 },
    }))

    const orphaned = Array.from(orphanedMap.entries()).map(([pixel_id, count]) => ({
      pixel_id,
      orphaned_count: count,
    }))

    return NextResponse.json({
      pixels: pixelsWithStats,
      orphaned,
      total_pixels: pixels?.length || 0,
      total_orphaned: orphaned.length,
    })
  } catch (error) {
    safeError('[Admin AL Pixels] GET error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/audiencelab/pixels
 * Create new pixel for customer or map existing pixel to workspace
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()

    const schema = z.discriminatedUnion('action', [
      // Create new pixel
      z.object({
        action: z.literal('create'),
        workspace_id: z.string().uuid(),
        website_name: z.string().min(1),
        website_url: z.string().url(),
        webhook_url: z.string().url().optional(),
      }),
      // Map existing pixel
      z.object({
        action: z.literal('map'),
        pixel_id: z.string(),
        workspace_id: z.string().uuid(),
      }),
    ])

    const data = schema.parse(body)
    const adminClient = createAdminClient()

    if (data.action === 'create') {
      // Create new pixel via Audience Labs API
      const { provisionCustomerPixel } = await import('@/lib/audiencelab/api-client')

      try {
        const pixelResponse = await provisionCustomerPixel({
          websiteName: data.website_name,
          websiteUrl: data.website_url,
          webhookUrl: data.webhook_url || `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/audiencelab/superpixel`,
        })

        // Store pixel mapping
        const { data: pixel, error: insertError } = await adminClient
          .from('audiencelab_pixels')
          .insert({
            pixel_id: pixelResponse.pixel_id,
            workspace_id: data.workspace_id,
            install_url: pixelResponse.install_url,
            script_snippet: pixelResponse.script,
            website_name: data.website_name,
            website_url: data.website_url,
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        safeLog('[Admin AL Pixels] Created new pixel:', {
          pixel_id: pixelResponse.pixel_id,
          workspace_id: data.workspace_id,
        })

        return NextResponse.json({
          success: true,
          pixel,
          message: 'Pixel created and mapped successfully',
        }, { status: 201 })
      } catch (alError) {
        safeError('[Admin AL Pixels] AL API error:', alError)
        return NextResponse.json(
          { error: 'Failed to create pixel via Audience Labs API' },
          { status: 502 }
        )
      }
    } else {
      // Map existing pixel to workspace
      const { data: pixel, error: insertError } = await adminClient
        .from('audiencelab_pixels')
        .upsert({
          pixel_id: data.pixel_id,
          workspace_id: data.workspace_id,
        }, { onConflict: 'pixel_id' })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Update orphaned events to this workspace
      const { count } = await adminClient
        .from('audiencelab_events')
        .update({ workspace_id: data.workspace_id })
        .eq('pixel_id', data.pixel_id)
        .is('workspace_id', null)

      safeLog('[Admin AL Pixels] Mapped pixel to workspace:', {
        pixel_id: data.pixel_id,
        workspace_id: data.workspace_id,
        rescued_events: count,
      })

      return NextResponse.json({
        success: true,
        pixel,
        rescued_events: count || 0,
        message: `Pixel mapped successfully. ${count || 0} orphaned events rescued.`,
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[Admin AL Pixels] POST error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/audiencelab/pixels?pixel_id=xxx
 * Remove pixel mapping (doesn't delete from AL, just unmaps)
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const pixelId = searchParams.get('pixel_id')

    if (!pixelId) {
      return NextResponse.json(
        { error: 'pixel_id required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('audiencelab_pixels')
      .delete()
      .eq('pixel_id', pixelId)

    if (error) {
      throw error
    }

    safeLog('[Admin AL Pixels] Deleted pixel mapping:', pixelId)

    return NextResponse.json({
      success: true,
      message: 'Pixel mapping removed',
    })
  } catch (error) {
    safeError('[Admin AL Pixels] DELETE error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
