/**
 * Admin AudienceLab Pixel Management API
 * Source of truth: AL API (all pixels). DB enriches with workspace mapping + trial data.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'
import { listPixels, provisionCustomerPixel } from '@/lib/audiencelab/api-client'

/**
 * GET /api/admin/audiencelab/pixels
 * Pulls all pixels from AL API, enriches with DB data (workspace, trial status, etc.)
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    // Fetch AL pixels + DB records in parallel
    const [alPixels, { data: dbPixels }, { data: workspaces }] = await Promise.all([
      listPixels(),
      adminClient
        .from('audiencelab_pixels')
        .select(`
          pixel_id, workspace_id, domain, label, trial_status, trial_ends_at,
          is_active, visitor_count_total, visitor_count_identified,
          last_v4_synced_at, created_at,
          workspaces ( id, name, slug )
        `),
      adminClient
        .from('workspaces')
        .select('id, name, slug')
        .order('name'),
    ])

    // Build DB lookup by pixel_id
    const dbMap = new Map((dbPixels || []).map(p => [p.pixel_id, p]))

    // Merge: AL is source of truth for existence; DB adds our business data
    const pixels = alPixels.map(alPixel => {
      const db = dbMap.get(alPixel.id) ?? null
      return {
        pixel_id:              alPixel.id,
        website_name:          alPixel.website_name,
        website_url:           alPixel.website_url,
        last_sync_status:      alPixel.last_sync_status ?? null,
        last_sync_count:       alPixel.last_sync_count ?? 0,
        last_sync_start:       alPixel.last_sync_start ?? null,
        // DB enrichment
        is_mapped:             !!db,
        workspace_id:          db?.workspace_id ?? null,
        workspace:             db?.workspaces ?? null,
        trial_status:          db?.trial_status ?? null,
        trial_ends_at:         db?.trial_ends_at ?? null,
        is_active:             db?.is_active ?? false,
        visitor_count_total:   db?.visitor_count_total ?? 0,
        visitor_count_identified: db?.visitor_count_identified ?? 0,
        last_v4_synced_at:     db?.last_v4_synced_at ?? null,
        db_created_at:         db?.created_at ?? null,
      }
    })

    const stats = {
      total:          pixels.length,
      mapped:         pixels.filter(p => p.is_mapped).length,
      unmapped:       pixels.filter(p => !p.is_mapped).length,
      active_trials:  pixels.filter(p => p.trial_status === 'trial').length,
      active_clients: pixels.filter(p => p.trial_status === 'active').length,
      expired:        pixels.filter(p => p.trial_status === 'expired').length,
    }

    return NextResponse.json({ pixels, workspaces: workspaces || [], stats })
  } catch (error) {
    safeError('[Admin AL Pixels] GET error:', error)
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/audiencelab/pixels
 * action: 'create' — provision new pixel via AL API
 * action: 'map'    — link existing AL pixel to a workspace
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const schema = z.discriminatedUnion('action', [
      z.object({
        action:       z.literal('create'),
        workspace_id: z.string().uuid(),
        website_name: z.string().min(1),
        website_url:  z.string().url(),
        webhook_url:  z.string().url().optional(),
      }),
      z.object({
        action:       z.literal('map'),
        pixel_id:     z.string(),
        workspace_id: z.string().uuid(),
      }),
    ])

    const data = schema.parse(body)
    const adminClient = createAdminClient()

    if (data.action === 'create') {
      const pixelResponse = await provisionCustomerPixel({
        websiteName:       data.website_name,
        websiteUrl:        data.website_url,
        cursiveWebhookUrl: data.webhook_url
          || `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/audiencelab/superpixel`,
      })

      const { error } = await adminClient
        .from('audiencelab_pixels')
        .insert({
          pixel_id:     pixelResponse.pixel_id,
          workspace_id: data.workspace_id,
          install_url:  pixelResponse.install_url,
          snippet:      pixelResponse.script,
          label:        data.website_name,
          domain:       data.website_url,
        })

      if (error) throw error

      return NextResponse.json({ ok: true, message: 'Pixel created and mapped' }, { status: 201 })
    } else {
      // Map existing AL pixel to workspace
      const { error } = await adminClient
        .from('audiencelab_pixels')
        .upsert({
          pixel_id:     data.pixel_id,
          workspace_id: data.workspace_id,
        }, { onConflict: 'pixel_id' })

      if (error) throw error

      return NextResponse.json({ ok: true, message: 'Pixel mapped to workspace' })
    }
  } catch (error) {
    safeError('[Admin AL Pixels] POST error:', error)
    return handleApiError(error)
  }
}

/**
 * DELETE /api/admin/audiencelab/pixels?pixel_id=xxx
 * Removes workspace mapping (doesn't delete from AL)
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const pixelId = new URL(request.url).searchParams.get('pixel_id')
    if (!pixelId) {
      return NextResponse.json({ error: 'pixel_id required' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('audiencelab_pixels')
      .delete()
      .eq('pixel_id', pixelId)

    if (error) throw error

    return NextResponse.json({ ok: true, message: 'Pixel mapping removed' })
  } catch (error) {
    safeError('[Admin AL Pixels] DELETE error:', error)
    return handleApiError(error)
  }
}
