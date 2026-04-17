'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'

const BOOK_URL =
  'https://cal.com/meetcursive/intro?utm_source=audience-builder&utm_medium=rate-limit'

const SCHEMA = z.object({
  email: z.string().email('Please enter a valid email'),
  first_name: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  use_case: z.string().max(2000).optional(),
})

type FormValues = z.infer<typeof SCHEMA>

export interface LeadInfo {
  firstName: string
  company: string
}

interface EmailGateProps {
  onStart: (token: string, sessionId: string, leadInfo: LeadInfo) => void
}

interface StartPayload extends FormValues {
  source: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

function readUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const key of [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
  ]) {
    const v = params.get(key)
    if (v) out[key] = v.slice(0, 200)
  }
  return out
}

export function EmailGate({ onStart }: EmailGateProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(SCHEMA),
    defaultValues: { email: '', first_name: '', company: '', use_case: '' },
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; rateLimited?: boolean } | null>(
    null
  )

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setLoading(true)

    const body: StartPayload = {
      email: values.email.trim().toLowerCase(),
      first_name: values.first_name?.trim() || undefined,
      company: values.company?.trim() || undefined,
      use_case: values.use_case?.trim() || undefined,
      source: 'audience-builder',
      ...readUtmParams(),
    }

    try {
      const res = await fetch('/api/public/copilot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 429) {
        let message = "You've hit the daily limit."
        try {
          const j = await res.json()
          if (j?.message) message = j.message
        } catch {
          /* noop */
        }
        setError({ message, rateLimited: true })
        return
      }

      if (!res.ok) {
        setError({ message: 'Something went wrong. Please try again.' })
        return
      }

      const data = (await res.json()) as { token: string; session_id: string }
      if (!data?.token || !data?.session_id) {
        setError({ message: 'Unexpected response. Please try again.' })
        return
      }

      const leadInfo: LeadInfo = {
        firstName: body.first_name ?? '',
        company: body.company ?? '',
      }

      try {
        sessionStorage.setItem('audience_builder_token', data.token)
        sessionStorage.setItem('audience_builder_session_id', data.session_id)
        sessionStorage.setItem('audience_builder_lead_info', JSON.stringify(leadInfo))
      } catch {
        /* sessionStorage may be disabled; proceed in-memory */
      }

      onStart(data.token, data.session_id, leadInfo)
    } catch {
      setError({ message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-6 sm:pt-10">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-100">
          <Sparkles className="h-3 w-3" />
          Free AI tool · No signup
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#0F172A] sm:text-4xl">
          Find the perfect audience for your next campaign
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-slate-600">
          Describe your ideal customer. Our AI matches you to{' '}
          <span className="font-semibold text-[#0F172A]">19,000+</span> pre-built
          audience segments in seconds. Free, no signup — just email.
        </p>
      </div>

      {/* Form card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        noValidate
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700"
            >
              Work email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={loading}
              placeholder="you@company.com"
              {...register('email')}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="first_name"
                className="block text-xs font-medium text-slate-700"
              >
                First name
              </label>
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                disabled={loading}
                placeholder="Jane"
                {...register('first_name')}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
            <div>
              <label
                htmlFor="company"
                className="block text-xs font-medium text-slate-700"
              >
                Company
              </label>
              <input
                id="company"
                type="text"
                autoComplete="organization"
                disabled={loading}
                placeholder="Acme Inc."
                {...register('company')}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="use_case"
              className="block text-xs font-medium text-slate-700"
            >
              What are you trying to reach?{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="use_case"
              rows={3}
              disabled={loading}
              placeholder="e.g. Finding ICP for a B2B SaaS CRM targeting mid-market sales leaders..."
              {...register('use_case')}
              className="mt-1 block w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
        </div>

        {error && (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              error.rateLimited
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <p>{error.message}</p>
            {error.rateLimited && (
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Book a call to activate an audience
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting session…
            </>
          ) : (
            <>
              Start finding segments
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="mt-3 text-center text-[11px] text-slate-500">
          Your email is only used to save your session. No spam. We&apos;ll only
          reach out if you ask.
        </p>
      </form>

      {/* Benefits */}
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            title: '19,000+ segments',
            body: 'Pre-built audiences across B2B & B2C categories.',
          },
          {
            title: 'Live in-market counts',
            body: 'Know how many people you can actually reach.',
          },
          {
            title: 'Ready to activate',
            body: 'Plug matches straight into your outbound stack.',
          },
        ].map((b) => (
          <div
            key={b.title}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"
          >
            <p className="text-sm font-semibold text-[#0F172A]">{b.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{b.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-[11px] text-slate-400">
        Powered by Cursive · Used by B2B & B2C teams to build their next audience
      </p>
    </div>
  )
}
