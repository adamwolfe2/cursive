'use client'

import { ArrowRight, Loader2, Mail } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import type { EmailIcpResponse, Icp } from '@/lib/free-leads/contract'
import { errorCopy, postJson, type Mock } from './api'

type State = 'closed' | 'open' | 'sending' | 'sent' | 'rate_limited' | 'invalid_email' | 'error'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Secondary to Approve: send the profile to any inbox and come back later. */
export function EmailProfile({ website, icp, mock }: { website: string; icp: Icp; mock: Mock }) {
  const [state, setState] = useState<State>('closed')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const id = useId()
  const msgId = useId()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (state === 'sending') return
    if (!EMAIL.test(value)) return setState('invalid_email')
    setState('sending')
    try {
      const r = await postJson<EmailIcpResponse>('/api/start/email-icp', { email: value, website, icp }, mock)
      setState(r.status)
    } catch (err) {
      console.error('[start] email profile failed', err)
      setError(errorCopy(err, 'That email does not look right. Check it and try again.'))
      setState('error')
    }
  }

  if (state === 'closed') {
    return (
      <p className="fl-fade flex flex-wrap items-center gap-x-2 text-[15px] text-[#4d5460]">
        Not ready to decide?
        <button
          type="button"
          data-fl-email-profile=""
          onClick={() => setState('open')}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[#0063E6] underline decoration-[#b3d7ff] underline-offset-4 transition-colors hover:decoration-[#0063E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Email me this profile
        </button>
      </p>
    )
  }

  if (state === 'sent') {
    return (
      <p role="status" className="fl-fade flex min-h-11 items-center gap-2 text-[15px] text-[#1d2025]">
        <Mail className="h-4 w-4 shrink-0 text-[#007AFF]" aria-hidden="true" />
        <span>
          Sent to <strong className="font-semibold [overflow-wrap:anywhere]">{email.trim()}</strong>, with a link back to this profile.
        </span>
      </p>
    )
  }

  const message =
    state === 'invalid_email'
      ? 'That email does not look right. Check it and try again.'
      : state === 'rate_limited'
        ? 'We have sent a lot of emails to this network today. Try again later.'
        : state === 'error'
          ? error
          : null

  return (
    <form onSubmit={submit} noValidate className="fl-fade max-w-xl">
      <label htmlFor={id} className="text-sm font-medium text-[#1d2025]">
        Where should we send it? Any inbox works.
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id={id}
          data-fl-email-profile-input=""
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state !== 'sending') setState('open')
          }}
          placeholder="you@anywhere.com"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? msgId : undefined}
          className="h-11 min-w-0 flex-1 rounded-lg border border-[#d1d5db] bg-white px-3.5 text-base text-[#1d2025] placeholder:text-[#a0a5b1] focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15 aria-[invalid]:border-[#dc2626]"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-[#1d2025] bg-white px-4 text-[15px] font-semibold text-[#1d2025] transition-colors hover:bg-[#f9fafb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] disabled:opacity-60"
        >
          Send
          {state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <p id={msgId} role="alert" className="mt-2 min-h-5 text-sm text-[#b91c1c]">
        {message}
      </p>
    </form>
  )
}
