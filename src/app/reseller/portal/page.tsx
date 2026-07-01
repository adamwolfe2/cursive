'use client'

/**
 * Reseller Partner Portal (read-only, public route).
 *
 * Resellers are NOT Supabase users — they authenticate with their API key
 * (rk_live_…). The partner pastes the key; it's kept only in sessionStorage and
 * sent as a Bearer token to the existing GET /api/reseller/v1/usage endpoint
 * (same-origin, server-side API-key auth + RLS). Read-only: shows usage totals
 * and a per-pixel breakdown. Lets Adam walk the experience "as the partner."
 */

import { useCallback, useEffect, useState } from 'react'
import { KeyRound, LogOut, RefreshCw, Radio, Send, AlertCircle, Loader2 } from 'lucide-react'

const STORAGE_KEY = 'cursive_reseller_api_key'

interface PixelUsage {
  pixel_id: string
  external_customer_ref: string
  status: string
  throttle_mode: boolean | null
  lead_cap_per_period: number | null
  leads_delivered_period: number
  leads_delivered_lifetime: number
  remaining: number | null
}
interface Usage {
  reseller: {
    period_kind: string
    period_start: string
    lead_cap_per_period: number | null
    leads_delivered_period: number
    leads_delivered_lifetime: number
    remaining: number | null
  }
  pixels: PixelUsage[]
}

function fmt(n: number | null): string {
  return n == null ? '∞' : n.toLocaleString()
}

export default function ResellerPortalPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) setApiKey(stored)
  }, [])

  const load = useCallback(async (key: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reseller/v1/usage', { headers: { Authorization: `Bearer ${key}` } })
      if (res.status === 401 || res.status === 403) {
        setError('Invalid or unauthorized API key.')
        setUsage(null)
        return
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setUsage((await res.json()) as Usage)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load usage')
      setUsage(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (apiKey) void load(apiKey)
  }, [apiKey, load])

  function connect() {
    const k = keyInput.trim()
    if (!k.startsWith('rk_live_')) {
      setError('Enter a valid key starting with rk_live_')
      return
    }
    sessionStorage.setItem(STORAGE_KEY, k)
    setApiKey(k)
    setKeyInput('')
  }

  function signOut() {
    sessionStorage.removeItem(STORAGE_KEY)
    setApiKey(null)
    setUsage(null)
    setError(null)
  }

  // ── Not connected: key entry ──────────────────────────────────────────────
  if (!apiKey) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-gray-900">
        <h1 className="text-2xl font-semibold tracking-tight">Partner Portal</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your Cursive reseller API key to view your usage and pixels. Your key stays in this
          browser tab only.
        </p>
        <div className="mt-6">
          <label className="block text-xs font-medium text-gray-500">API key</label>
          <div className="mt-1 flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && connect()}
              placeholder="rk_live_…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={connect}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <KeyRound className="h-4 w-4" /> Connect
            </button>
          </div>
          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
        </div>
        <p className="mt-8 text-xs text-gray-400">
          New here? See the <a href="/reseller/docs" className="underline">API docs</a>.
        </p>
      </main>
    )
  }

  // ── Connected: usage dashboard ────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Partner Portal</h1>
          <p className="mt-1 text-sm text-gray-500">Read-only usage for your account.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => apiKey && load(apiKey)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
          </button>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      {usage && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card icon={<Radio className="h-4 w-4" />} label="Pixels" value={usage.pixels.length.toLocaleString()} sub="customers" />
            <Card icon={<Send className="h-4 w-4" />} label={`Delivered (${usage.reseller.period_kind})`} value={usage.reseller.leads_delivered_period.toLocaleString()} sub={`since ${usage.reseller.period_start}`} />
            <Card icon={<Send className="h-4 w-4" />} label="Delivered (lifetime)" value={usage.reseller.leads_delivered_lifetime.toLocaleString()} sub="all time" />
            <Card icon={<KeyRound className="h-4 w-4" />} label="Remaining" value={fmt(usage.reseller.remaining)} sub={usage.reseller.lead_cap_per_period == null ? 'no account cap' : `cap ${fmt(usage.reseller.lead_cap_per_period)}`} />
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-2.5 font-medium">Customer ref</th>
                  <th className="px-4 py-2.5 font-medium">Pixel</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Throttle</th>
                  <th className="px-4 py-2.5 font-medium">Cap</th>
                  <th className="px-4 py-2.5 font-medium">Delivered (period)</th>
                  <th className="px-4 py-2.5 font-medium">Lifetime</th>
                  <th className="px-4 py-2.5 font-medium">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {usage.pixels.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      No pixels yet. Create one via <code>POST /api/reseller/v1/pixels</code>.
                    </td>
                  </tr>
                )}
                {usage.pixels.map((p) => (
                  <tr key={p.pixel_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.external_customer_ref}</td>
                    <td className="px-4 py-3"><code className="text-xs text-gray-600">{p.pixel_id}</code></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.throttle_mode == null ? 'inherit' : p.throttle_mode ? 'on' : 'off'}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(p.lead_cap_per_period)}</td>
                    <td className="px-4 py-3 text-gray-700">{p.leads_delivered_period.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">{p.leads_delivered_lifetime.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(p.remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="mt-8 text-xs text-gray-400">
        API reference: <a href="/reseller/docs" className="underline">/reseller/docs</a>
      </p>
    </main>
  )
}

function Card({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-400">{sub}</div>
    </div>
  )
}
