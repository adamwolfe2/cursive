'use client'

import { ArrowRight, Loader2, Mail } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import type { EmailIcpResponse, Icp } from '@/lib/free-leads/contract'
import { errorCopy, postJson, type Mock } from './api'

type State = 'closed' | 'open' | 'sending' | 'sent' | 'rate_limited' | 'invalid_email' | 'error'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const WHITE_FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

/**
 * Lives on the blue decision panel, next to Approve.
 * Secondary to Approve: send the profile to any inbox and come back later. The server emails the profile from the
 * original scan (it never relays client edits), so after an edit the copy says so instead of implying the edited one.
 */
export function EmailProfile({ website, icp, mock, edited }: { website: string; icp: Icp; mock: Mock; edited: boolean }) {
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
      <p className="fl-fade flex min-h-11 flex-wrap items-center gap-x-2 text-[15px] text-white">
        {/* Phones: one line, so the reserved slot under Approve never grows when this appears. */}
        {!edited && <span className="max-sm:hidden">Not ready to decide?</span>}
        <button
          type="button"
          data-fl-email-profile=""
          onClick={() => setState('open')}
          className={`inline-flex min-h-11 items-center gap-1.5 font-semibold text-white underline decoration-white/60 underline-offset-4 transition-colors hover:decoration-white ${WHITE_FOCUS}`}
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {edited ? 'Email me the profile we found' : 'Email me this profile'}
        </button>
      </p>
    )
  }

  if (state === 'sent') {
    return (
      <p role="status" className="fl-fade flex min-h-11 items-center gap-2 text-[15px] text-white">
        <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Sent to <strong className="font-semibold [overflow-wrap:anywhere]">{email.trim()}</strong>, with a link back to{' '}
          {edited ? 'the profile we found.' : 'this profile.'}
        </span>
      </p>
    )
  }

  const message =
    state === 'invalid_email'
      ? 'That email does not look right. Check it and try again.'
      : state === 'rate_limited'
        ? 'We have sent this profile a lot today. Try again tomorrow.'
        : state === 'error'
          ? error
          : null

  return (
    <form onSubmit={submit} noValidate className="fl-fade max-w-xl pt-2 sm:pt-0">
      <label htmlFor={id} className="text-sm font-medium text-white">
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
          onKeyDown={(e) => {
            if (e.key !== 'Escape' || state === 'sending') return
            setState('closed')
            requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-fl-email-profile]')?.focus())
          }}
          placeholder="you@anywhere.com"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? msgId : undefined}
          className="h-11 min-w-0 flex-1 rounded-lg border border-white bg-white px-3.5 text-base text-[#1d2025] placeholder:text-[#6b7280] focus:outline-none focus:ring-4 focus:ring-white/40"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-4 text-[15px] font-semibold text-white ring-1 ring-inset ring-white transition-colors hover:bg-[#084fba] disabled:opacity-60 ${WHITE_FOCUS}`}
        >
          Send
          {state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <p id={msgId} role="alert" className="mt-2 min-h-5 text-sm font-semibold text-white">
        {message}
      </p>
    </form>
  )
}
