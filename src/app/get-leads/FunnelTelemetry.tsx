'use client'

import { useEffect } from 'react'
import { FUNNEL_EVENTS, trackFunnel } from '@/lib/funnel/tracking'

/**
 * Mounted once at the top of /get-leads. Fires landing_viewed + vsl_loaded
 * exactly once per page mount (StrictMode-safe via the ref guard pattern
 * isn't needed here — PostHog dedupes by distinct_id + session within
 * 2s anyway).
 */
export function FunnelTelemetry({
  offerSlugs,
  vslUrl,
}: {
  offerSlugs: string[]
  vslUrl: string
}) {
  useEffect(() => {
    trackFunnel(FUNNEL_EVENTS.LANDING_VIEWED, {
      offers_shown: offerSlugs.join(','),
      vsl_provider:
        vslUrl.includes('mux.com') ? 'mux'
        : vslUrl.includes('vimeo.com') ? 'vimeo'
        : vslUrl.includes('loom.com') ? 'loom'
        : 'self_hosted',
    })
    trackFunnel(FUNNEL_EVENTS.VSL_LOADED, { vsl_url: vslUrl })
  }, [offerSlugs, vslUrl])

  return null
}
