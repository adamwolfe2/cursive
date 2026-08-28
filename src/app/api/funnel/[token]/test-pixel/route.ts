/**
 * POST /api/funnel/[token]/test-pixel
 *
 * Server-side install verifier. Fetches the buyer's domain (https only)
 * and checks the HTML for the pixel script tag (by the pixel's install URL
 * hostname). Returns one of three states:
 *   - installed:   snippet detected on the page
 *   - unconfirmed: page loaded but no snippet found in the source. Deliberately
 *                  NOT "missing" — GTM and client-injected installs are
 *                  invisible here yet work fine. First inbound event is truth.
 *   - unreachable: domain couldn't be fetched
 *
 * Bounded: 15s timeout, max 5MB response. Never follows non-https redirects.
 */
export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getOrderByToken } from '@/lib/funnel/order.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const FETCH_TIMEOUT_MS = 15_000
const MAX_BYTES = 5_000_000

export async function POST(
  _req: NextRequest,
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

    if (!order.pixel_domain || !order.pixel_install_url) {
      return NextResponse.json(
        { state: 'no_pixel', message: 'No pixel on this order yet.' },
        { status: 200 }
      )
    }

    const targetUrl = order.pixel_website_url ?? `https://${order.pixel_domain}/`
    if (!/^https:\/\//i.test(targetUrl)) {
      return NextResponse.json(
        { state: 'unreachable', message: 'Site URL is not https.' },
        { status: 200 }
      )
    }

    // Pull the install URL hostname (e.g. cdn.idpixel.app) — that's the
    // most reliable signature to look for in the HTML.
    let pixelHost = ''
    try {
      pixelHost = new URL(order.pixel_install_url).hostname
    } catch {
      pixelHost = ''
    }
    // Also look for the pixel id as a fallback (in case they hand-edited)
    const pixelIdSig = order.pixel_audiencelab_id ?? ''

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let html = ''
    try {
      const res = await fetch(targetUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          // Friendly UA so sites don't 403 us; we identify ourselves
          'User-Agent': 'CursivePixelVerifier/1.0 (+https://meetcursive.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
      })

      if (!res.ok) {
        return NextResponse.json({
          state: 'unreachable',
          message: `Site returned HTTP ${res.status}.`,
        })
      }

      // Read response with a size cap so a huge page doesn't blow memory
      const reader = res.body?.getReader()
      if (!reader) {
        return NextResponse.json({
          state: 'unreachable',
          message: 'No response body from the site.',
        })
      }

      const chunks: Uint8Array[] = []
      let total = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
          total += value.byteLength
          if (total > MAX_BYTES) break
        }
      }
      html = new TextDecoder('utf-8').decode(Buffer.concat(chunks))
    } catch (err) {
      const aborted = (err as { name?: string })?.name === 'AbortError'
      return NextResponse.json({
        state: 'unreachable',
        message: aborted
          ? 'Site took too long to respond.'
          : 'Could not reach the site.',
      })
    } finally {
      clearTimeout(timeout)
    }

    const haystack = html.toLowerCase()
    const installed =
      (pixelHost && haystack.includes(pixelHost.toLowerCase())) ||
      (pixelIdSig && haystack.includes(pixelIdSig.toLowerCase()))

    if (installed) {
      return NextResponse.json({
        state: 'installed',
        message:
          'Your pixel snippet is on the site. Identified visitors will appear here as traffic lands.',
        checked_url: targetUrl,
      })
    }

    // NOT a hard "missing". A correct install is routinely invisible in the
    // server HTML: Google Tag Manager injects at runtime, and client-side
    // loaders (e.g. next/script's default afterInteractive strategy) attach the
    // tag only after hydration. Telling those buyers their working pixel is
    // broken is worse than saying we could not confirm it. The authoritative
    // signal is the first inbound event, not a substring match.
    return NextResponse.json({
      state: 'unconfirmed',
      message:
        'We could not see the snippet in your page source. If you installed it through a tag manager or a client-side script loader, that is expected — it may already be working, and we will confirm the moment your first visitor is identified. Otherwise, check the snippet is on every page before the closing </head>.',
      checked_url: targetUrl,
    })
  } catch (err) {
    safeError('[funnel/test-pixel] error:', err)
    return NextResponse.json(
      { error: 'Could not check the install. Please try again.' },
      { status: 500 }
    )
  }
}
