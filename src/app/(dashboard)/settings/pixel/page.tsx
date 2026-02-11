'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'

interface PixelStatus {
  has_pixel: boolean
  pixel: {
    pixel_id: string
    domain: string
    is_active: boolean
    snippet: string | null
    label: string | null
    created_at: string
  } | null
  recent_events: number
}

export default function PixelSettingsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [websiteName, setWebsiteName] = useState('')
  const [copied, setCopied] = useState(false)

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

  const handleCopySnippet = () => {
    if (data?.pixel?.snippet) {
      navigator.clipboard.writeText(data.pixel.snippet)
      setCopied(true)
      toast.success('Snippet copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
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
    return (
      <div className="space-y-6">
        {/* Pixel Status Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Your Tracking Pixel</h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              data.pixel.is_active
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${data.pixel.is_active ? 'bg-green-500' : 'bg-zinc-400'}`} />
              {data.pixel.is_active ? 'Active' : 'Inactive'}
            </span>
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
        </div>

        {/* Installation Snippet */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Installation Snippet</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Paste this code before the closing <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded font-mono">&lt;/head&gt;</code> tag on your website.
              </p>
            </div>
            <button
              onClick={handleCopySnippet}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <pre className="text-sm bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto font-mono">
            {data.pixel.snippet || 'Snippet not available'}
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
      </div>
    )
  }

  // No pixel - show setup form
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">Install Your Tracking Pixel</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Create a tracking pixel for your website to identify anonymous visitors and turn them into leads.
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
            {provisionMutation.isPending ? 'Creating Pixel...' : 'Create Pixel'}
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
            <h3 className="text-sm font-medium text-primary">What does the pixel do?</h3>
            <p className="mt-1 text-sm text-zinc-600">
              The Cursive tracking pixel identifies anonymous visitors on your website using first-party data.
              When a visitor matches our identity graph, they become a lead in your dashboard with
              verified contact information, company details, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
