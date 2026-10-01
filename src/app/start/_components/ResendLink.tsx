'use client'

import { useEffect, useState } from 'react'
import type { ClaimResponse } from '@/lib/free-leads/contract'
import { CLAIM_STORAGE_KEY, postJson, type Mock } from './api'

const COOLDOWN_S = 30
const LINK =
  'inline-flex min-h-11 items-center font-semibold text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 hover:decoration-[#007AFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]'

/** Re-posts the claim saved by ClaimForm. The claim route resends the link for a pending claim. */
export function ResendLink({ mock }: { mock: Mock }) {
  const [saved, setSaved] = useState<string | null | undefined>(undefined)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [wait, setWait] = useState(0)

  useEffect(() => setSaved(sessionStorage.getItem(CLAIM_STORAGE_KEY)), [])
  useEffect(() => {
    if (wait <= 0) return
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000)
    return () => window.clearTimeout(t)
  }, [wait])

  // No saved claim (link opened on another device): "Use a different email" beside this already covers it.
  if (saved === null) return null

  const resend = async () => {
    if (!saved || state === 'sending' || wait > 0) return
    setState('sending')
    try {
      const res = await postJson<ClaimResponse>('/api/start/claim', JSON.parse(saved), mock)
      setState(res.status === 'sent' ? 'sent' : 'error')
      setWait(COOLDOWN_S)
    } catch (err) {
      console.error('[start] resend failed', err)
      setState('error')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={resend}
        disabled={state === 'sending' || wait > 0}
        className={`${LINK} tabular-nums disabled:text-[#6b7280] disabled:no-underline`}
      >
        {state === 'sending' ? 'Sending...' : wait > 0 ? `Resend in ${wait}s` : 'Resend the link'}
      </button>
      <span role="status" className="sr-only">
        {state === 'sent' ? 'Link sent again.' : state === 'error' ? 'We could not resend the link.' : ''}
      </span>
      {state === 'sent' && <span className="ml-1 text-[#15803d]">Sent again.</span>}
      {state === 'error' && <span className="ml-1 text-[#b91c1c]">That didn&apos;t go through. Try again shortly.</span>}
    </>
  )
}
