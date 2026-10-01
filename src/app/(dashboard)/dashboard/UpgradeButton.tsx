'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BOOKING_URL, type InterestResponse, type UpgradeTier } from '@/lib/free-leads/contract'
import { postJson, StartApiError } from '@/app/start/_components/api'

/**
 * Records upgrade intent (alerts sales once per tier) and opens the next step in a new tab.
 * The tab is opened inside the click so popup blockers allow it, then pointed at the URL.
 */
export function UpgradeButton({ tier, label, primary = false }: { tier: UpgradeTier; label: string; primary?: boolean }) {
  const [busy, setBusy] = useState(false)
  const choose = async () => {
    if (busy) return
    setBusy(true)
    const win = window.open('about:blank', '_blank')
    if (win) win.opener = null
    let url = BOOKING_URL
    try {
      url = (await postJson<InterestResponse>('/api/start/interest', { tier }, null)).booking_url
    } catch (err) {
      console.error('[free-leads-home] interest not recorded, opening default booking page', err)
    }
    if (win) win.location.href = url
    else window.location.href = url
    setBusy(false)
  }
  return (
    <button
      type="button"
      onClick={() => void choose()}
      disabled={busy}
      className={`group inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-[15px] transition-[background-color,transform] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] disabled:opacity-70 ${
        primary ? 'bg-[#007AFF] text-white hover:bg-[#0066DD]' : 'border border-[#d1d5db] bg-white text-[#111827] hover:bg-[#f9fafb]'
      }`}
    >
      {label}
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
      )}
    </button>
  )
}

/**
 * POSTs to a session-authenticated Stripe route (/api/start/checkout or /api/start/billing) and
 * follows the returned URL. The server decides workspace, price, customer and email.
 */
export function StripeButton({ path, label, quiet = false }: { path: '/api/start/checkout' | '/api/start/billing'; label: string; quiet?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const start = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const { url } = await postJson<{ url: string }>(path, {}, null)
      window.location.assign(url)
    } catch (err) {
      setBusy(false)
      if (err instanceof StartApiError && err.status === 409) return router.refresh()
      console.error('[free-leads-home] stripe redirect failed', path, err)
      setError(err instanceof StartApiError ? err.message : 'We could not open checkout. Please try again.')
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className={
          quiet
            ? 'inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 hover:decoration-[#007AFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] disabled:opacity-70'
            : 'group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#007AFF] px-4 text-[15px] text-white transition-[background-color,transform] duration-150 hover:bg-[#0066DD] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] disabled:opacity-70'
        }
      >
        {label}
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : quiet ? null : (
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        )}
      </button>
      <p role="status" className="mt-2 min-h-5 text-sm text-[#b91c1c]">
        {error}
      </p>
    </div>
  )
}
