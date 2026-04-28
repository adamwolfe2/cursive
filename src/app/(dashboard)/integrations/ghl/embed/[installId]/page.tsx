/**
 * GHL embed wizard page — `/integrations/ghl/embed/<install_id>`.
 *
 * Walks the user through pasting the Cursive pixel snippet into their GHL
 * funnel's Head tracking code. Polls every 8s for the first pixel event;
 * flips the badge to "Live" when detected.
 *
 * Hit by the magic-link redirect after a GHL marketplace install completes
 * (or by the user navigating from /dashboard/integrations/ghl).
 */

'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'

type Status = 'not_deployed' | 'pending' | 'active' | 'manual_required' | 'error'

interface State {
  install_id: string
  external_name: string
  pixel_id: string | null
  pixel_snippet: string | null
  deployment_status: Status
  first_event_at: string | null
}

export default function GhlEmbedWizardPage({
  params,
}: {
  params: Promise<{ installId: string }>
}) {
  const { installId } = use(params)
  const [state, setState] = useState<State | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Poll embed status every 8 seconds
  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`/api/integrations/ghl-app/embed-status?install_id=${installId}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(json.error ?? 'Failed to fetch install state')
          return
        }
        setState(json)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Network error')
      }
    }

    poll()
    const interval = setInterval(poll, 8000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [installId])

  const isLive = state?.deployment_status === 'active'

  function handleCopy() {
    if (!state?.pixel_snippet) return
    navigator.clipboard.writeText(state.pixel_snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-2 text-sm text-gray-500">GoHighLevel install</div>
      <h1 className="text-2xl font-semibold">Install your Cursive pixel</h1>
      {state?.external_name && (
        <p className="mt-1 text-sm text-gray-600">
          for <span className="font-medium">{state.external_name}</span>
        </p>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      {/* Live status banner */}
      {isLive && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <div>
              <div className="font-medium text-emerald-900">Pixel is live</div>
              <div className="text-sm text-emerald-700">
                First event received{state.first_event_at ? ` at ${new Date(state.first_event_at).toLocaleString()}` : ''}.
                Visitors will now appear in your dashboard automatically.
              </div>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Open dashboard →
          </Link>
        </div>
      )}

      {!isLive && state?.pixel_snippet && (
        <>
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-3">
              <span className="text-amber-600">●</span>
              <div>
                <div className="font-medium text-amber-900">Waiting for first visitor</div>
                <div className="text-sm text-amber-800">
                  Paste the snippet below into each funnel you want to track. We&apos;ll
                  detect the first pixel fire automatically (usually within minutes).
                </div>
              </div>
            </div>
          </div>

          {/* The snippet */}
          <div className="mt-6 rounded-lg border bg-white p-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Your pixel snippet
            </div>
            <pre className="mt-1 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-300">
              {state.pixel_snippet}
            </pre>
            <button
              onClick={handleCopy}
              className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {copied ? 'Copied ✓' : 'Copy snippet'}
            </button>
          </div>

          {/* Step-by-step */}
          <div className="mt-6 rounded-lg border bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-gray-900">
              How to install in GoHighLevel
            </div>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
                <span>Open GoHighLevel and navigate to <strong>Sites → Funnels</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
                <span>Open the funnel you want to track. Click the <strong>gear icon</strong> (Settings).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
                <span>Find the <strong>Head Tracking Code</strong> section. Paste the snippet above.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">4</span>
                <span>Click <strong>Save</strong>. Repeat for each funnel.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">5</span>
                <span>Visit one of your funnel pages — this status will flip to <strong>Live</strong> automatically.</span>
              </li>
            </ol>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            We check for activity every 8 seconds. You can leave this page open or come back later — it&apos;ll catch up the next time you visit.
          </p>
        </>
      )}

      {!state && !error && (
        <div className="mt-6 rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          Loading install state…
        </div>
      )}
    </div>
  )
}
