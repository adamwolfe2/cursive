'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { BOOKING_URL, type InterestResponse, type UpgradeTier } from '@/lib/free-leads/contract'
import { postJson } from '@/app/start/_components/api'

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
