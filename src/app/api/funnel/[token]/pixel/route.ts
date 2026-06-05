/**
 * POST /api/funnel/[token]/pixel
 *
 * Provisions an AudienceLab pixel for the buyer's website. Token-gated,
 * no Supabase auth. Idempotent — re-submitting the same URL on an already-
 * provisioned order returns the stored snippet.
 */
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getOrderByToken,
  provisionFunnelPixel,
} from '@/lib/funnel/order.service'
import { provisionCustomerPixel } from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  website_url: z
    .string()
    .url()
    .refine((url) => {
      try {
        const parsed = new URL(url)
        const host = parsed.hostname.toLowerCase()
        // Localhost variants
        if (host === 'localhost') return false
        // Raw IPv4
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false
        // IPv6 literals (Node URL keeps brackets)
        if (host.startsWith('[')) return false
        // No-dot single-label hosts (e.g. "myhost")
        if (!host.includes('.')) return false
        // Cloud metadata + link-local + .internal / .local TLDs
        if (host.endsWith('.internal') || host.endsWith('.local')) return false
        return true
      } catch {
        return false
      }
    }, 'Please enter a valid public website URL'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const lookup = await getOrderByToken(token)

    if (!lookup.ok) {
      return NextResponse.json(
        { error: 'Link no longer valid' },
        { status: lookup.error === 'not_found' ? 404 : 403 }
      )
    }

    const { order } = lookup.data

    // Plan must include pixel
    if (order.offer_slug === 'audience_197') {
      return NextResponse.json(
        { error: 'Your plan does not include the pixel.' },
        { status: 409 }
      )
    }

    // Idempotent: if pixel already provisioned, return existing
    if (order.pixel_snippet) {
      return NextResponse.json({
        pixel_id: order.pixel_audiencelab_id,
        snippet: order.pixel_snippet,
        install_url: order.pixel_install_url,
        domain: order.pixel_domain,
        existing: true,
      })
    }

    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid URL' },
        { status: 400 }
      )
    }

    const websiteUrl = parsed.data.website_url
    const domain = new URL(websiteUrl).hostname.replace(/^www\./, '')

    // Provision via AudienceLab (external API call)
    const result = await provisionCustomerPixel({
      websiteName: domain,
      websiteUrl,
    })

    const installUrl = result.install_url
    if (!installUrl && !result.script) {
      safeError('[funnel/pixel] AL returned no install_url or script', {
        pixel_id: result.pixel_id,
      })
      return NextResponse.json(
        {
          error:
            'Pixel provisioning failed — upstream did not return an install URL. Our team has been notified.',
        },
        { status: 502 }
      )
    }
    const snippet = result.script || `<script src="${installUrl}" defer></script>`

    // Single atomic surface: writes audiencelab_pixels + funnel_orders together
    // with a forward-only state guard. Returns null if order moved past
    // awaiting_pixel via a concurrent request, in which case we return the
    // pre-advanced snapshot.
    const updated = await provisionFunnelPixel(order.id, {
      website_url: websiteUrl,
      domain,
      audiencelab_id: result.pixel_id,
      snippet,
      install_url: installUrl ?? null,
    })

    if (!updated) {
      return NextResponse.json(
        {
          error:
            'Could not record pixel on your order. Please reload and try again.',
        },
        { status: 500 }
      )
    }

    safeLog('[funnel/pixel] provisioned', {
      order_id: order.id,
      pixel_id: result.pixel_id,
      domain,
    })

    sendSlackAlert({
      type: 'pipeline_update',
      severity: 'info',
      message: `Funnel pixel provisioned for ${domain} (${order.offer_slug})`,
      metadata: {
        order_id: order.id,
        email: order.customer_email,
        pixel_id: result.pixel_id,
        domain,
      },
    }).catch((err) => safeError('[funnel/pixel] slack alert failed:', err))

    return NextResponse.json({
      pixel_id: result.pixel_id,
      snippet,
      install_url: installUrl,
      domain,
    })
  } catch (err) {
    safeError('[funnel/pixel] error:', err)
    return NextResponse.json(
      { error: 'Could not generate your pixel. Please try again.' },
      { status: 500 }
    )
  }
}
