/**
 * Dashboard banner shown when the user has a marketplace install (GHL or
 * Shopify) that needs setup completion — typically the GHL pixel embed
 * snippet hasn't been pasted into a funnel yet, or a Shopify install ran
 * into a webPixelCreate edge case and needs the manual fallback.
 *
 * Hidden when all installs are 'active' or there are no installs.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PendingInstall {
  id: string
  source: 'ghl' | 'shopify'
  external_name: string | null
  pixel_deployment_status: string
}

export function MarketplaceSetupBanner() {
  const [pending, setPending] = useState<PendingInstall[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/integrations/ghl-app/installs').then((r) => r.ok ? r.json() : { installs: [] }),
      fetch('/api/integrations/shopify-app/installs').then((r) => r.ok ? r.json() : { installs: [] }),
    ])
      .then(([ghl, shopify]) => {
        const pendingList: PendingInstall[] = []
        for (const i of ghl.installs ?? []) {
          if (i.pixel_deployment_status !== 'active' && i.status === 'active') {
            pendingList.push({
              id: i.id,
              source: 'ghl',
              external_name: i.external_name,
              pixel_deployment_status: i.pixel_deployment_status,
            })
          }
        }
        for (const i of shopify.installs ?? []) {
          if (i.pixel_deployment_status === 'manual_required' && i.status === 'active') {
            pendingList.push({
              id: i.id,
              source: 'shopify',
              external_name: i.external_name,
              pixel_deployment_status: i.pixel_deployment_status,
            })
          }
        }
        setPending(pendingList)
      })
      .catch(() => {
        // No installs surface yet (api may 404 if user is on a non-marketplace path)
      })
  }, [])

  if (dismissed || pending.length === 0) return null

  // Show only the first pending install — when they fix it, the next one surfaces
  const first = pending[0]
  const sourceLabel = first.source === 'ghl' ? 'GoHighLevel' : 'Shopify'
  const setupHref = first.source === 'ghl'
    ? `/integrations/ghl/embed/${first.id}`
    : `/integrations/shopify`

  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <span className="mt-0.5 text-amber-600">●</span>
      <div className="flex-1">
        <div className="font-medium text-amber-900">
          Finish your {sourceLabel} setup
        </div>
        <div className="mt-1 text-sm text-amber-800">
          {first.external_name
            ? <>Your <strong>{first.external_name}</strong> install is connected, but the pixel isn&apos;t live yet.</>
            : <>Your {sourceLabel} install is connected, but the pixel isn&apos;t live yet.</>
          }
          {' '}Complete setup so visitors start flowing into your dashboard.
          {pending.length > 1 && (
            <span className="ml-1 text-xs text-amber-700">
              ({pending.length - 1} more {pending.length - 1 === 1 ? 'install' : 'installs'} pending)
            </span>
          )}
        </div>
      </div>
      <Link
        href={setupHref}
        className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
      >
        Complete setup →
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="ml-1 rounded-md p-1 text-amber-700 hover:bg-amber-100"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
