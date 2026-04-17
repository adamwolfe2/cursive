'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowRight, Calendar, Mail } from 'lucide-react'

export interface EmailCaptureFields {
  email: string
  first_name?: string
  company?: string
}

interface EmailCaptureCardProps {
  onSubmit: (data: EmailCaptureFields) => void | Promise<void>
  error?: string | null
  isSubmitting?: boolean
}

const BOOK_URL =
  'https://cal.com/meetcursive/intro?utm_source=audience-builder&utm_medium=rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Compact inline email-capture card. Rendered as an assistant bubble
 * in the chat after the user sends their first message. Replaces the
 * big pre-chat EmailGate form.
 */
export function EmailCaptureCard({
  onSubmit,
  error,
  isSubmitting,
}: EmailCaptureCardProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [company, setCompany] = useState('')
  const [touched, setTouched] = useState(false)

  const emailValid = EMAIL_RE.test(email.trim())
  const canSubmit = emailValid && !isSubmitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    await onSubmit({
      email: email.trim().toLowerCase(),
      first_name: firstName.trim() || undefined,
      company: company.trim() || undefined,
    })
  }

  const isRateLimit = Boolean(error && error.toLowerCase().includes('limit'))

  return (
    <div className="rounded-xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-900">
        <Mail className="h-4 w-4" />
        Save your session
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Drop your email and I&apos;ll match you to 2–3 audience segments. No spam —
        just saves your chat so you can come back.
      </p>

      <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
          autoComplete="email"
          disabled={isSubmitting}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="First name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <input
            type="text"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoComplete="organization"
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
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
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? (
            'Starting…'
          ) : (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-500">
          No spam. We only reach out if you ask.
        </p>
      </form>
    </div>
  )
}
