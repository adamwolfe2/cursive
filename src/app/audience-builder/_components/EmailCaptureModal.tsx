'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowRight, Calendar, Lock, Mail } from 'lucide-react'

export interface EmailSubmitData {
  email: string
  first_name?: string
  last_name?: string
  username?: string
  company?: string
}

interface EmailCaptureModalProps {
  onSubmit: (data: EmailSubmitData) => void | Promise<void>
  error?: string | null
  isSubmitting?: boolean
  segmentCount?: number
}

const BOOK_URL =
  'https://cal.com/meetcursive/intro?utm_source=audience-builder&utm_medium=rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Modal-style email capture overlay. Renders on top of the blurred preview
 * once a search completes. Collects the 5 fields (username, first_name,
 * last_name, email, company) the authenticated Audience Builder wants.
 */
export function EmailCaptureModal({
  onSubmit,
  error,
  isSubmitting,
  segmentCount,
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [company, setCompany] = useState('')
  const [touched, setTouched] = useState(false)

  const emailValid = EMAIL_RE.test(email.trim())
  const canSubmit = emailValid && !isSubmitting
  const isRateLimit = Boolean(error && error.toLowerCase().includes('limit'))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    await onSubmit({
      email: email.trim().toLowerCase(),
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      username: username.trim() || undefined,
      company: company.trim() || undefined,
    })
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-blue-200/80 bg-white p-6 shadow-2xl sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
          <Lock className="h-4 w-4 text-blue-700" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">
            {segmentCount
              ? `${segmentCount} matches ready`
              : 'Unlock your matches'}
          </h2>
          <p className="text-xs text-slate-500">
            Save your session to see results + activate
          </p>
        </div>
      </div>
      <p className="mb-5 text-sm text-slate-600">
        Drop your info to unlock the full match list + activate any segment. No
        spam — we only reach out if you ask.
      </p>

      <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
        <input
          type="email"
          placeholder="Work email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
          autoComplete="email"
          disabled={isSubmitting}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoComplete="organization"
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        {touched && !emailValid && (
          <p className="text-xs text-red-600">Please enter a valid email.</p>
        )}

        {error && !isRateLimit && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isRateLimit && error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-xs text-amber-900">{error}</p>
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Calendar className="h-3 w-3" /> Book a call instead
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? (
            'Unlocking...'
          ) : (
            <>
              Show me the matches <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-500">
          <Mail className="mr-1 inline h-3 w-3" /> No spam. We only reach out if
          you ask.
        </p>
      </form>
    </div>
  )
}
