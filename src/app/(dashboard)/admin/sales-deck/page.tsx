/**
 * Darren's Sales Deck — Admin Page
 *
 * Live call tool for provisioning a demo pixel and sending a post-call recap
 * email during (or immediately after) a sales call.
 *
 * Protected: admin-only (same guard as other /admin/* pages).
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface ProvisionResult {
  pixel_id: string
  snippet: string
  domain: string
  install_url?: string
  email_sent: boolean
}

interface DemoPixel {
  pixel_id: string
  domain: string
  workspace_id: string | null
  trial_status: string
  created_at: string
}

// ────────────────────────────────────────────────────────────────────────────
// Admin guard — redirect non-admins at render time
// ────────────────────────────────────────────────────────────────────────────

function useAdminGuard() {
  const [checked, setChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data: admin } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('email', user.email as string)
        .eq('is_active', true)
        .maybeSingle()
      if (!admin) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setChecked(true)
    }
    check()
  }, [])

  return { checked, isAdmin }
}

// ────────────────────────────────────────────────────────────────────────────
// Page Component
// ────────────────────────────────────────────────────────────────────────────

export default function SalesDeckPage() {
  const { checked, isAdmin } = useAdminGuard()

  const [prospectEmail, setProspectEmail] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProvisionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [recentPixels, setRecentPixels] = useState<DemoPixel[]>([])
  const [pixelsLoading, setPixelsLoading] = useState(false)

  // Load recent demo pixels
  useEffect(() => {
    if (!isAdmin) return
    async function loadPixels() {
      setPixelsLoading(true)
      try {
        const supabase = createClient()
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { data } = await (supabase
          .from('audiencelab_pixels')
          .select('pixel_id, domain, workspace_id, trial_status, created_at')
          .eq('trial_status', 'demo')
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(10) as any) as { data: DemoPixel[] | null }
        setRecentPixels(data || [])
      } catch {
        // non-critical
      } finally {
        setPixelsLoading(false)
      }
    }
    loadPixels()
  }, [isAdmin])

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/pixel/provision-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectEmail, websiteUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to provision pixel')
        return
      }
      setResult(data)
      // Refresh recent pixels list
      const supabase = createClient()
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: pixels } = await (supabase
        .from('audiencelab_pixels')
        .select('pixel_id, domain, workspace_id, trial_status, created_at')
        .eq('trial_status', 'demo')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10) as any) as { data: DemoPixel[] | null }
      setRecentPixels(pixels || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!result?.snippet) return
    await navigator.clipboard.writeText(result.snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Deck</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Provision a demo pixel live on a call, then send the prospect a post-call recap email with login link.
        </p>
      </div>

      {/* ── Provision Form ───────────────────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6 space-y-5">
        <h2 className="text-base font-semibold">Create Pixel &amp; Send Recap Email</h2>
        <form onSubmit={handleProvision} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="prospectEmail">
              Prospect Email
            </label>
            <input
              id="prospectEmail"
              type="email"
              required
              value={prospectEmail}
              onChange={e => setProspectEmail(e.target.value)}
              placeholder="prospect@company.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="websiteUrl">
              Website URL
            </label>
            <input
              id="websiteUrl"
              type="text"
              required
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://theircompany.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {loading ? 'Creating Pixel...' : 'Create Pixel & Send Recap Email'}
          </button>
        </form>

        {/* ── Success Result ─────────────────────────────────────────────── */}
        {result && (
          <div className="mt-4 space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <p className="text-sm font-semibold text-green-800">
                Pixel created for <strong>{result.domain}</strong>
                {result.email_sent && ' — recap email sent'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Pixel Snippet — paste before &lt;/head&gt;
              </p>
              <div className="relative">
                <pre className="rounded-md bg-gray-900 px-4 py-3 text-xs text-green-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                  {result.snippet}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Pixel ID: {result.pixel_id}</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Recent Demo Pixels ──────────────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">Recent Demo Pixels (last 30 days)</h2>
        {pixelsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading...
          </div>
        ) : recentPixels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No demo pixels created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">Domain</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Pixel ID</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentPixels.map(px => (
                  <tr key={px.pixel_id} className="hover:bg-muted/30">
                    <td className="py-2 pr-4 font-medium">{px.domain}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          px.workspace_id
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {px.workspace_id ? 'Claimed' : 'Unclaimed'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                      {px.pixel_id}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {new Date(px.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
