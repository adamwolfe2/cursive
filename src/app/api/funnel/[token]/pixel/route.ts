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
  isOrderEntitled,
} from '@/lib/funnel/order.service'
import { provisionCustomerPixel } from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { isPixelV3, isPixelV4, normalizeWebsiteUrl } from '@/lib/funnel/website-url'

// Accept whatever the buyer types — `yoursite.com`, `www.yoursite.com`,
// `https://yoursite.com/path` — and normalize to https://… server-side.
// Most buyers don't know to type https:// and shouldn't have to.
const bodySchema = z.object({
  website_url: z
    .string()
    .trim()
    .min(1, 'Please enter a website URL.')
    .transform((raw, ctx) => {
      const normalized = normalizeWebsiteUrl(raw)
      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Please enter a valid public website URL (e.g. yourcompany.com).',
        })
        return z.NEVER
      }
      return normalized
    }),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  // Hoisted above the try so the catch block can attach context to the
  // failure alert below — otherwise an AudienceLab outage or provisioning
  // exception is a bare 500 with no signal that new buyers are blocked.
  let token: string | undefined
  let orderId: string | undefined

  try {
    ;({ token } = await params)
    const lookup = await getOrderByToken(token)

    if (!lookup.ok) {
      return NextResponse.json(
        { error: 'Link no longer valid' },
        { status: lookup.error === 'not_found' ? 404 : 403 }
      )
    }

    const { order } = lookup.data
    orderId = order.id

    // Entitlement chokepoint. Token revocation is the primary gate, but a
    // partially-applied cancel (token revoke failed, state flipped) must not
    // leave a cancelled buyer able to provision a billable AudienceLab pixel.
    if (!isOrderEntitled(order)) {
      return NextResponse.json(
        { error: 'This subscription is no longer active.' },
        { status: 403 }
      )
    }

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

    // Provision via AudienceLab (external API call). Scope the webhook URL to
    // the workspace (?ws=) so inbound events route deterministically — AL posts
    // a pixel_id that differs from the one it returns here.
    const result = await provisionCustomerPixel({
      websiteName: domain,
      websiteUrl,
      workspaceId: order.workspace_id ?? undefined,
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

    // V4 regression guard. AL provisions v4 (cdn.idpixel.app) by default for
    // our account. If they ever revert us to v3 (cdn.v3.identitypxl.app),
    // fire a critical alert so we know — funnel buyers paid for the v4
    // resolution data and we should not silently downgrade them.
    if (isPixelV3(installUrl)) {
      sendSlackAlert({
        type: 'pipeline_update',
        severity: 'critical',
        message: `Funnel pixel provisioned as V3 (expected V4) — AL account regression`,
        metadata: {
          order_id: order.id,
          domain,
          pixel_id: result.pixel_id,
          install_url: installUrl ?? '',
        },
      }).catch((err) => safeError('[funnel/pixel] v3 alert failed:', err))
    } else if (!isPixelV4(installUrl)) {
      safeLog('[funnel/pixel] install_url has unrecognized version pattern', {
        install_url: installUrl,
      })
    }

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
    sendSlackAlert({
      type: 'pipeline_update',
      severity: 'critical',
      message: 'Funnel pixel provisioning threw — buyer blocked from getting their pixel',
      metadata: {
        order_id: orderId ?? 'unknown',
        token: token ?? 'unknown',
        error: err instanceof Error ? err.message : String(err),
      },
    }).catch((alertErr) => safeError('[funnel/pixel] failure alert failed:', alertErr))
    return NextResponse.json(
      { error: 'Could not generate your pixel. Please try again.' },
      { status: 500 }
    )
  }
}
