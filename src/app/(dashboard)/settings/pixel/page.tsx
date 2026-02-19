'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useToast } from '@/lib/hooks/use-toast'

interface PixelStatus {
  has_pixel: boolean
  pixel: {
    pixel_id: string
    domain: string
    is_active: boolean
    snippet: string | null
    install_url: string | null
    label: string | null
    created_at: string
    trial_ends_at: string | null
    trial_status: 'trial' | 'expired' | 'active' | 'cancelled' | null
    visitor_count_total: number | null
    visitor_count_identified: number | null
  } | null
  recent_events: number
}

interface VerifyResult {
  verified: boolean
  lastEventAt: string | null
  eventCount: number
  pixelId: string | null
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function PixelSettingsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [websiteName, setWebsiteName] = useState('')
  const [copied, setCopied] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)

  const handleVerifyInstallation = useCallback(async () => {
    setVerifying(true)
    setVerifyResult(null)
    setShowTroubleshooting(false)
    try {
      const response = await fetch('/api/pixel/verify')
      if (!response.ok) throw new Error('Verification request failed')
      const result: VerifyResult = await response.json()
      setVerifyResult(result)
      if (!result.verified) {
        setShowTroubleshooting(true)
      }
    } catch {
      toast.error('Could not reach the verification service — please try again.')
    } finally {
      setVerifying(false)
    }
  }, [toast])

  const { data, isLoading } = useQuery<PixelStatus>({
    queryKey: ['pixel', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/pixel/status')
      if (!response.ok) throw new Error('Failed to fetch pixel status')
      return response.json()
    },
  })

  const provisionMutation = useMutation({
    mutationFn: async (params: { website_url: string; website_name?: string }) => {
      const response = await fetch('/api/pixel/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create pixel')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixel', 'status'] })
      toast.success('Pixel created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create pixel')
    },
  })

  const handleCreatePixel = () => {
    if (!websiteUrl) {
      toast.error('Please enter your website URL')
      return
    }

    try {
      new URL(websiteUrl)
    } catch {
      toast.error('Please enter a valid URL (e.g. https://example.com)')
      return
    }

    provisionMutation.mutate({
      website_url: websiteUrl,
      ...(websiteName && { website_name: websiteName }),
    })
  }

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast.success('Snippet copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-zinc-200 rounded animate-pulse" />
        <div className="h-64 bg-zinc-200 rounded animate-pulse" />
      </div>
    )
  }

  // Has pixel - show status + snippet
  if (data?.has_pixel && data.pixel) {
    const hasInstallUrl = !!data.pixel.install_url
    const isTrialExpired = data.pixel.trial_status === 'expired'
    const isTrialActive = data.pixel.trial_status === 'trial'
    const trialEndsAt = data.pixel.trial_ends_at ? new Date(data.pixel.trial_ends_at) : null
    const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000)) : null

    // Build the proper installation snippet:
    // 1. If snippet already contains a <script tag, use it as-is
    // 2. If install_url is available, wrap it in a script tag
    // 3. Fallback: generate from pixel_id using the known V3 SuperPixel CDN format
    const installSnippet = (() => {
      if (data.pixel!.snippet && data.pixel!.snippet.includes('<script')) {
        return data.pixel!.snippet
      }
      if (data.pixel!.install_url) {
        return `<script src="${data.pixel!.install_url}" defer></script>`
      }
      return `<script src="https://cdn.v3.identitypxl.app/pixels/${data.pixel!.pixel_id}/p.js" defer></script>`
    })()
    const hasSnippet = true // We can always generate a snippet from pixel_id

    return (
      <div className="space-y-6">

        {/* Trial Expired Banner */}
        {isTrialExpired && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-red-900 text-base">Your pixel trial has ended</p>
                <p className="text-sm text-red-700 mt-1">
                  Your pixel on <strong>{data.pixel.domain}</strong> is paused. Upgrade to Pro to reactivate it and keep identifying visitors forever.
                </p>
              </div>
              <a
                href="/settings/billing"
                className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Reactivate Pixel
              </a>
            </div>
          </div>
        )}

        {/* Trial Active Countdown */}
        {isTrialActive && daysLeft !== null && (
          <div className={`rounded-xl border p-6 ${
            daysLeft <= 3
              ? 'border-red-200 bg-red-50'
              : daysLeft <= 7
              ? 'border-amber-200 bg-amber-50'
              : 'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className={`font-semibold text-base ${
                  daysLeft <= 3 ? 'text-red-900' : daysLeft <= 7 ? 'text-amber-900' : 'text-blue-900'
                }`}>
                  {daysLeft === 0 ? 'Trial ends today' : daysLeft === 1 ? '1 day left in trial' : `${daysLeft} days left in your free trial`}
                </p>
                <p className={`text-sm mt-1 ${
                  daysLeft <= 3 ? 'text-red-700' : daysLeft <= 7 ? 'text-amber-700' : 'text-blue-700'
                }`}>
                  After {trialEndsAt?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, your pixel stops identifying visitors unless you upgrade.
                </p>
              </div>
              <a
                href="/settings/billing"
                className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
                  daysLeft <= 3 ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
                }`}
              >
                Upgrade to Pro
              </a>
            </div>
          </div>
        )}

        {/* Pixel Status Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Your Tracking Pixel</h2>
            <div className="flex items-center gap-2">
              {data.recent_events > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active — Receiving data
                </span>
              ) : data.pixel.is_active ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Active — No events in 24h
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Domain</p>
              <p className="text-sm font-medium text-zinc-900">{data.pixel.domain}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Events (last 24h)</p>
              <p className="text-sm font-medium text-zinc-900">{data.recent_events}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Pixel ID</p>
              <p className="text-sm font-mono text-zinc-600 truncate">{data.pixel.pixel_id}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap items-center gap-3">
            {hasInstallUrl && (
              <a
                href={data.pixel.install_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Install Guide
              </a>
            )}

            <button
              onClick={handleVerifyInstallation}
              disabled={verifying}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifying ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify Installation
                </>
              )}
            </button>
          </div>

          {verifyResult !== null && (
            <div className="mt-3 space-y-3">
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                verifyResult.verified
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {verifyResult.verified ? (
                  <>
                    <span className="text-green-600">&#10003;</span>
                    <div>
                      <span>Pixel verified and working</span>
                      <span className="block text-xs font-normal text-green-700 mt-0.5">
                        {verifyResult.eventCount} event{verifyResult.eventCount === 1 ? '' : 's'} in the last 7 days
                        {verifyResult.lastEventAt && ` · Last event ${formatRelativeTime(verifyResult.lastEventAt)}`}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-red-600">&#10007;</span>
                    <div className="flex-1">
                      <span>No events detected yet</span>
                      <span className="block text-xs font-normal text-red-700 mt-0.5">
                        It can take up to 5 minutes for the first event to appear after installation.
                      </span>
                    </div>
                    <button
                      onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                      className="text-xs underline text-red-700 hover:text-red-900 shrink-0"
                    >
                      {showTroubleshooting ? 'Hide help' : 'Troubleshoot'}
                    </button>
                  </>
                )}
              </div>

              {showTroubleshooting && !verifyResult.verified && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h4 className="text-sm font-semibold text-amber-900 mb-3">Troubleshooting Checklist</h4>
                  <ol className="text-sm text-amber-800 space-y-2.5">
                    <li className="flex gap-2">
                      <span className="font-semibold text-amber-700 shrink-0">1.</span>
                      <span>
                        <strong>Snippet placement</strong> — Make sure the script tag is inside your{' '}
                        <code className="text-xs bg-amber-100 px-1 py-0.5 rounded font-mono">&lt;head&gt;</code>{' '}
                        section, not the body.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-amber-700 shrink-0">2.</span>
                      <span>
                        <strong>Domain match</strong> — The pixel is configured for{' '}
                        <strong>{data.pixel.domain}</strong>. Make sure you installed the snippet on that exact domain.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-amber-700 shrink-0">3.</span>
                      <span>
                        <strong>Ad blockers</strong> — Some browser extensions or ad blockers may prevent the pixel from loading. Try in an incognito window.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-amber-700 shrink-0">4.</span>
                      <span>
                        <strong>Cache</strong> — If you just added the snippet, clear your site&apos;s cache (CDN, page cache) and refresh.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-amber-700 shrink-0">5.</span>
                      <span>
                        <strong>Visit your site</strong> — Open your website in a new tab to trigger the pixel, then come back here and click Verify again.
                      </span>
                    </li>
                  </ol>
                  <p className="mt-3 text-xs text-amber-700">
                    Still not working? Contact us at{' '}
                    <a href="mailto:support@meetcursive.com" className="underline">support@meetcursive.com</a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Installation Snippet */}
        {hasSnippet && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Installation Snippet</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Paste this code before the closing <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded font-mono">&lt;/head&gt;</code> tag on your website.
                </p>
              </div>
              <button
                onClick={() => handleCopySnippet(installSnippet)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <pre className="text-xs bg-zinc-100 text-zinc-800 border border-zinc-200 p-4 rounded-lg font-mono whitespace-pre-wrap break-all">
              {installSnippet}
            </pre>

            <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-4">
              <h3 className="text-sm font-semibold text-primary mb-2">How it works</h3>
              <ol className="text-sm text-zinc-600 space-y-2">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary flex-shrink-0">1.</span>
                  Add the snippet to your website&apos;s HTML head section
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary flex-shrink-0">2.</span>
                  The pixel identifies visitors to your website in real-time
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary flex-shrink-0">3.</span>
                  Matching leads appear in your My Leads dashboard automatically
                </li>
              </ol>
            </div>
          </div>
        )}

      </div>
    )
  }

  // No pixel yet — show self-serve trial signup
  return (
    <div className="space-y-6">
      {/* Trial CTA */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">Start Your Free 14-Day Pixel Trial</h3>
            <p className="text-sm text-zinc-600">
              Install a tracking pixel on your website to identify anonymous visitors. No credit card required — try it free for 14 days.
            </p>
          </div>
        </div>
      </div>

      {/* Setup Form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">Set Up Your Pixel</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Enter your website URL below and we will generate your tracking pixel instantly.
        </p>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Website URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              placeholder="https://yourcompany.com"
              className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Website Name <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="My Company"
              className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary"
              value={websiteName}
              onChange={(e) => setWebsiteName(e.target.value)}
            />
            <p className="mt-1 text-xs text-zinc-500">Defaults to your domain name if left blank</p>
          </div>

          <button
            onClick={handleCreatePixel}
            disabled={provisionMutation.isPending || !websiteUrl}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {provisionMutation.isPending ? 'Creating Pixel...' : 'Start Free Trial'}
          </button>
        </div>
      </div>

      {/* Info section */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-primary">How does the pixel work?</h3>
            <ol className="mt-2 text-sm text-zinc-600 space-y-2">
              <li className="flex gap-2">
                <span className="font-semibold text-primary flex-shrink-0">1.</span>
                Add a small code snippet to your website
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary flex-shrink-0">2.</span>
                The pixel identifies anonymous visitors using first-party data
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary flex-shrink-0">3.</span>
                Matched visitors appear as leads in your dashboard with verified contact info
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
