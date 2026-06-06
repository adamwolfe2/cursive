'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * Pixel-install assurance (#8).
 *
 * Shown when a pixel is installed but hasn't recorded a visit yet. Converts the
 * silent "awaiting first event" dead-zone into concrete, reassuring next steps
 * so a buyer doesn't assume the product is broken and churn.
 */

const STEPS = [
  'Paste the snippet right before the closing </head> tag, on every page.',
  'Using Google Tag Manager? Add it as a Custom HTML tag, then click Publish.',
  'Make sure the change is live on your production site — not just a preview.',
  'Testing your own visit? Turn off ad-blockers and open the live URL in a normal window.',
  'Identification needs real traffic — once visitors land, names appear here within minutes.',
]

export function PixelTroubleshoot() {
  const [rechecking, setRechecking] = useState(false)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-amber-900">
            Pixel installed — no visits identified yet
          </h3>
          <p className="mt-0.5 text-xs text-amber-800/80">
            This usually means it just needs traffic, or the snippet isn&apos;t
            firing. Quick things to check:
          </p>
        </div>
      </div>

      <ol className="mt-3 space-y-2">
        {STEPS.map((step, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-xs text-amber-900/90"
          >
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setRechecking(true)
            window.location.reload()
          }}
          disabled={rechecking}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
        >
          {rechecking ? 'Re-checking…' : 'Re-check now'}
        </button>
        <Link
          href="/settings/pixel"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50"
        >
          View snippet &amp; install help
        </Link>
        <a
          href="mailto:support@meetcursive.com?subject=Pixel%20not%20firing"
          className="text-xs font-medium text-amber-700 hover:underline"
        >
          Still stuck? Email us
        </a>
      </div>
    </div>
  )
}
