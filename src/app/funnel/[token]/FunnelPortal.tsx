'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FunnelOrder } from '@/lib/funnel/order.service'
import { FUNNEL_EVENTS, trackFunnel } from '@/lib/funnel/tracking'

// ─── "Test my install" button ─────────────────────────────────────────────

type TestInstallState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'installed'; message: string }
  | { kind: 'missing'; message: string }
  | { kind: 'unreachable'; message: string }
  | { kind: 'error'; message: string }

function TestInstallButton({ token }: { token: string }) {
  const [state, setState] = useState<TestInstallState>({ kind: 'idle' })

  async function runCheck() {
    setState({ kind: 'checking' })
    trackFunnel(FUNNEL_EVENTS.PIXEL_TEST_CLICKED, {})
    try {
      const res = await fetch(`/api/funnel/${token}/test-pixel`, {
        method: 'POST',
      })
      const json = (await res.json().catch(() => ({}))) as {
        state?: string
        message?: string
        error?: string
      }
      if (!res.ok) {
        trackFunnel(FUNNEL_EVENTS.PIXEL_TEST_RESULT, { result: 'error' })
        setState({ kind: 'error', message: json.error || 'Check failed.' })
        return
      }
      trackFunnel(FUNNEL_EVENTS.PIXEL_TEST_RESULT, {
        result: json.state ?? 'unknown',
      })
      if (json.state === 'installed') {
        setState({ kind: 'installed', message: json.message ?? '' })
      } else if (json.state === 'missing') {
        setState({ kind: 'missing', message: json.message ?? '' })
      } else {
        setState({ kind: 'unreachable', message: json.message ?? '' })
      }
    } catch (err) {
      trackFunnel(FUNNEL_EVENTS.PIXEL_TEST_RESULT, { result: 'network_error' })
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Check failed.',
      })
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={runCheck}
        disabled={state.kind === 'checking'}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
      >
        {state.kind === 'checking' ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
            Checking your site…
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Test my install
          </>
        )}
      </button>

      {state.kind === 'installed' && (
        <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          ✓ {state.message}
        </p>
      )}
      {state.kind === 'missing' && (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {state.message}
        </p>
      )}
      {state.kind === 'unreachable' && (
        <p className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
          {state.message}
        </p>
      )}
      {state.kind === 'error' && (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.message}
        </p>
      )}
    </div>
  )
}

// ─── Subscription state banners ───────────────────────────────────────────

function SubscriptionBanner({
  state,
  onManageBilling,
}: {
  state: 'past_due' | 'paused' | 'incomplete'
  onManageBilling: () => void
}) {
  if (state === 'past_due') {
    return (
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-red-900">
            Your last payment didn&apos;t go through.
          </p>
          <p className="mt-0.5 text-xs text-red-800">
            Your visitor feed + audience refreshes are paused. Update your card
            and everything resumes automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={onManageBilling}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
        >
          Update card →
        </button>
      </div>
    )
  }
  if (state === 'paused' || state === 'incomplete') {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-semibold text-amber-900">
          Your subscription is {state === 'paused' ? 'paused' : 'incomplete'}.
        </p>
        <p className="mt-0.5 text-xs text-amber-800">
          {state === 'paused'
            ? 'No charges happening — and no new visitor data being processed. Resume in billing whenever you’re ready.'
            : 'Finish the setup in Stripe to activate everything.'}
        </p>
      </div>
    )
  }
  return null
}

function CancelledScreen({ customerEmail }: { customerEmail: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">
        This subscription has been cancelled
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Your account ({customerEmail}) is no longer active. We sent a
        cancellation confirmation to that address. You can come back any time —
        just re-purchase below and we&apos;ll set you up with a fresh pixel and
        audience.
      </p>
      <a
        href="/get-leads"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Re-subscribe
      </a>
    </div>
  )
}

// ─── Visual primitives — mirror the existing /portal/[token] StepShell ─────

type StepState = 'complete' | 'active' | 'pending' | 'locked'

function StepIcon({ state }: { state: StepState }) {
  if (state === 'complete') {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-50">
        <div className="h-3 w-3 animate-pulse rounded-full bg-blue-600" />
      </div>
    )
  }
  if (state === 'locked') {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50">
        <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white">
      <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
    </div>
  )
}

function StepShell({
  number,
  title,
  state,
  locked,
  children,
}: {
  number: number
  title: string
  state: StepState
  locked: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex gap-4 ${locked ? 'opacity-60' : ''}`}>
      <StepIcon state={state} />
      <div className="flex-1 pb-8">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Step {number}
          </span>
          {state === 'complete' && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Complete
            </span>
          )}
          {state === 'active' && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Action needed
            </span>
          )}
        </div>
        <h3 className={`mb-3 text-base font-semibold ${locked ? 'text-gray-400' : 'text-gray-900'}`}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

// ─── Step 1: Payment (always complete on the portal) ───────────────────────

function PaymentStep({ order }: { order: FunnelOrder }) {
  return (
    <StepShell number={1} title="Payment" state="complete" locked={false}>
      <p className="text-sm font-medium text-emerald-700">
        Payment received — thank you!
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Charged ${(order.monthly_price_cents / 100).toLocaleString()} /
        month. Manage billing any time via the link in your receipt email.
      </p>
    </StepShell>
  )
}

// ─── Step 2: Install Pixel ─────────────────────────────────────────────────

function PixelStep({
  token,
  order,
  includesPixel,
  onProvisioned,
}: {
  token: string
  order: FunnelOrder
  includesPixel: boolean
  onProvisioned: () => void
}) {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const provisioned = !!order.pixel_snippet

  if (!includesPixel) {
    return (
      <StepShell number={2} title="Pixel (not included)" state="complete" locked={false}>
        <p className="text-sm text-gray-500">
          Your plan doesn&apos;t include the pixel. If you change your mind,
          email us and we&apos;ll upgrade you in one click.
        </p>
      </StepShell>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    trackFunnel(FUNNEL_EVENTS.PIXEL_REQUESTED, { order_id: order.id })
    try {
      const res = await fetch(`/api/funnel/${token}/pixel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_url: websiteUrl }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(json.error || `Pixel setup failed (HTTP ${res.status})`)
      }
      trackFunnel(FUNNEL_EVENTS.PIXEL_PROVISIONED, { order_id: order.id })
      onProvisioned()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set up pixel.')
    } finally {
      setSubmitting(false)
    }
  }

  if (provisioned) {
    return (
      <StepShell number={2} title="Set up your pixel" state="complete" locked={false}>
        <p className="mb-3 text-sm font-medium text-emerald-700">
          Pixel created for {order.pixel_domain}. Paste the snippet below into
          your site&apos;s <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">&lt;/head&gt;</code>{' '}
          (or add it via Google Tag Manager) and you&apos;re live.
        </p>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Your pixel snippet
            </p>
            <button
              type="button"
              onClick={() => {
                if (order.pixel_snippet) {
                  navigator.clipboard.writeText(order.pixel_snippet)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }
              }}
              className="rounded bg-gray-800 px-2 py-1 text-[11px] font-medium text-gray-200 hover:bg-gray-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <code className="block whitespace-pre-wrap break-all font-mono text-[12px] leading-relaxed text-emerald-300">
            {order.pixel_snippet}
          </code>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Pixel ID: {order.pixel_audiencelab_id} · Identified visitors start
          flowing within a few minutes of traffic.
        </p>
        <TestInstallButton token={token} />
      </StepShell>
    )
  }

  return (
    <StepShell number={2} title="Set up your pixel" state="active" locked={false}>
      <p className="mb-3 text-sm text-gray-500">
        Type your website — we&apos;ll handle the rest. Pixel is created
        instantly.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
      >
        <div className="flex flex-1 items-stretch overflow-hidden rounded-lg border border-gray-300 focus-within:border-transparent focus-within:ring-2 focus-within:ring-blue-500">
          <span className="flex select-none items-center bg-gray-50 px-3 text-xs font-medium text-gray-500">
            https://
          </span>
          <input
            type="text"
            required
            autoComplete="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="url"
            placeholder="yourcompany.com"
            value={websiteUrl}
            onChange={(e) =>
              setWebsiteUrl(
                e.target.value
                  // Strip a scheme the buyer might paste in — we add it on submit
                  .replace(/^https?:\/\//i, '')
                  // Strip leading whitespace as they type
                  .replace(/^\s+/, '')
              )
            }
            disabled={submitting}
            className="flex-1 border-0 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !websiteUrl}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Generating…' : 'Create pixel'}
        </button>
      </form>
      <p className="mt-2 text-xs text-gray-400">
        Don&apos;t worry about https:// — we add it automatically.
      </p>
      {error && (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </StepShell>
  )
}

// ─── Step 3: Audience builder ──────────────────────────────────────────────

interface AudienceFormState {
  solution: string
  icp_description: string
  titles: string
  industries: string
  employee_range: string
  locations: string
}

const EMPTY_AUDIENCE: AudienceFormState = {
  solution: '',
  icp_description: '',
  titles: '',
  industries: '',
  employee_range: '',
  locations: '',
}

const EMPLOYEE_RANGES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
]

function AudienceStep({
  token,
  order,
  includesAudience,
  pixelLocked,
  onSubmitted,
}: {
  token: string
  order: FunnelOrder
  includesAudience: boolean
  pixelLocked: boolean
  onSubmitted: () => void
}) {
  const [form, setForm] = useState<AudienceFormState>(EMPTY_AUDIENCE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitted = !!order.audience_submitted_at

  if (!includesAudience) {
    return (
      <StepShell number={3} title="Audience (not included)" state="complete" locked={false}>
        <p className="text-sm text-gray-500">
          Your plan doesn&apos;t include a managed audience. Pixel only —
          identified visitors flow as people land on your site.
        </p>
      </StepShell>
    )
  }

  if (pixelLocked) {
    return (
      <StepShell number={3} title="Tell Us Who To Find" state="locked" locked={true}>
        <p className="text-sm text-gray-400">
          Install your pixel above first, then we&apos;ll collect your audience
          targeting.
        </p>
      </StepShell>
    )
  }

  if (submitted) {
    const delivered = !!order.audience_delivered_at
    const includesPixel = order.offer_slug !== 'audience_197'
    return (
      <StepShell
        number={3}
        title="Tell Us Who To Find"
        state={delivered ? 'complete' : 'active'}
        locked={false}
      >
        <p className="text-sm font-medium text-emerald-700">
          ICP submitted — thanks!
        </p>
        <p className="mt-1 text-xs text-gray-500">
          You&apos;ll get an email from Adam with your Google Sheet link within
          12-24 hours.
        </p>

        {includesPixel && order.pixel_snippet && (
          <NextStepInstallPixel
            snippet={order.pixel_snippet}
            domain={order.pixel_domain}
          />
        )}
      </StepShell>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const titlesArr = form.titles.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      const industriesArr = form.industries.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      const locationsArr = form.locations.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)

      const res = await fetch(`/api/funnel/${token}/audience`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solution: form.solution,
          icp_description: form.icp_description,
          titles: titlesArr,
          industries: industriesArr,
          employee_range: form.employee_range,
          locations: locationsArr,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(json.error || `Submit failed (HTTP ${res.status})`)
      }
      trackFunnel(FUNNEL_EVENTS.AUDIENCE_SUBMITTED, {
        order_id: order.id,
        titles_count: titlesArr.length,
        industries_count: industriesArr.length,
        locations_count: locationsArr.length,
        has_employee_range: !!form.employee_range,
      })
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StepShell number={3} title="Tell Us Who To Find" state="active" locked={false}>
      <p className="mb-4 text-sm text-gray-500">
        Three quick questions. Takes less than a minute. We&apos;ll build your
        first audience within 24 hours.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="What do you sell?" required>
          <input
            type="text"
            required
            placeholder="e.g. AI-powered paid social audits for ecom agencies"
            value={form.solution}
            onChange={(e) => setForm({ ...form, solution: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Who's your ideal customer?" required>
          <textarea
            required
            rows={2}
            placeholder="e.g. Founders or CMOs at DTC brands doing $5M-$50M revenue"
            value={form.icp_description}
            onChange={(e) => setForm({ ...form, icp_description: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Job titles to target (one per line, or comma-separated)" required>
          <textarea
            required
            rows={2}
            placeholder="CEO&#10;CMO&#10;VP Marketing&#10;Head of Growth"
            value={form.titles}
            onChange={(e) => setForm({ ...form, titles: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Industries (optional)">
          <textarea
            rows={2}
            placeholder="Technology, SaaS, eCommerce"
            value={form.industries}
            onChange={(e) => setForm({ ...form, industries: e.target.value })}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company size">
            <select
              value={form.employee_range}
              onChange={(e) => setForm({ ...form, employee_range: e.target.value })}
              className={inputClass}
            >
              <option value="">Any size</option>
              {EMPLOYEE_RANGES.map((r) => (
                <option key={r} value={r}>
                  {r} employees
                </option>
              ))}
            </select>
          </Field>

          <Field label="Locations (optional)">
            <input
              type="text"
              placeholder="US, CA, UK"
              value={form.locations}
              onChange={(e) => setForm({ ...form, locations: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Build my audience'}
        </button>
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </StepShell>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Next-step callout: confirm pixel install ─────────────────────────────
//
// Shown inside the audience step once ICP is submitted (bundle orders only —
// audience-only orders have no pixel, pixel-only orders skip the audience
// step entirely). The pixel itself was already provisioned earlier; this
// callout reminds the buyer to actually paste it on their site, plus shows
// the snippet again with quick install methods.

function NextStepInstallPixel({
  snippet,
  domain,
}: {
  snippet: string
  domain: string | null
}) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          !
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Next: confirm your pixel is live on {domain ?? 'your site'}
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            Paste the snippet below into the global header of your site (above
            <code className="mx-1 rounded bg-white px-1 py-0.5 text-[11px]">&lt;/head&gt;</code>)
            so we can identify visitors the moment your audience is delivered.
          </p>
        </div>
      </div>

      {/* Snippet box */}
      <div className="overflow-hidden rounded-lg border border-blue-100 bg-gray-900 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Your pixel snippet
          </p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(snippet)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
            className="rounded bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-200 hover:bg-gray-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <code className="block whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-emerald-300">
          {snippet}
        </code>
      </div>

      {/* Three install methods */}
      <ul className="mt-4 space-y-2 text-xs text-gray-700">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            1
          </span>
          <span>
            <span className="font-semibold">Direct HTML:</span> paste before
            the closing <code className="rounded bg-white px-1 text-[10px]">&lt;/head&gt;</code>{' '}
            on every page of your site.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            2
          </span>
          <span>
            <span className="font-semibold">Google Tag Manager:</span> create a
            new Custom HTML tag, paste the snippet, and fire on All Pages.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            3
          </span>
          <span>
            <span className="font-semibold">Verify:</span> load any page of
            your site and you&apos;ll start seeing identified visitors flow in
            within minutes.
          </span>
        </li>
      </ul>
    </div>
  )
}

// ─── Step 4: Audience delivered ────────────────────────────────────────────

function DeliveryStep({
  order,
  includesAudience,
}: {
  order: FunnelOrder
  includesAudience: boolean
}) {
  if (!includesAudience) return null

  const delivered = !!order.audience_sheet_url
  const submitted = !!order.audience_submitted_at

  const state: StepState = delivered ? 'complete' : submitted ? 'active' : 'locked'
  const locked = !submitted

  return (
    <StepShell number={4} title="Your Audience Delivered" state={state} locked={locked}>
      {delivered && order.audience_sheet_url ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700">
            Your audience is live and refreshing weekly.
          </p>
          <a
            href={order.audience_sheet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            Open Audience Sheet
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      ) : submitted ? (
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <p className="text-sm text-gray-500">
            We&apos;re building your first audience — expect your Google Sheet
            link via email within 12-24 hours.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Complete the audience step above to unlock.
        </p>
      )}
    </StepShell>
  )
}

// ─── Sidebar ───────────────────────────────────────────────────────────────

function PackageSidebar({
  order,
  offerLabel,
  onManageBilling,
  billingLoading,
}: {
  order: FunnelOrder
  offerLabel: string
  onManageBilling: () => void
  billingLoading: boolean
}) {
  const stateLabel: Record<string, { label: string; tone: string }> = {
    active: { label: 'Active subscription', tone: 'text-gray-400' },
    past_due: { label: 'Past due', tone: 'text-red-600 font-medium' },
    paused: { label: 'Paused', tone: 'text-amber-700 font-medium' },
    incomplete: { label: 'Incomplete', tone: 'text-amber-700 font-medium' },
    cancelled: { label: 'Cancelled', tone: 'text-gray-500' },
  }
  const stateInfo = stateLabel[order.subscription_state] ?? stateLabel.active

  return (
    <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Your Plan</h2>
      <div className="mb-4">
        <p className="text-base font-medium text-gray-900">{offerLabel}</p>
        <p className={`mt-1 text-xs ${stateInfo.tone}`}>{stateInfo.label}</p>
      </div>
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600">Monthly</p>
            <p className="text-xs text-gray-400">Recurring</p>
          </div>
          <p className="text-base font-bold text-gray-900">
            ${(order.monthly_price_cents / 100).toLocaleString()}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onManageBilling}
        disabled={billingLoading || !order.stripe_customer_id}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {billingLoading ? 'Opening…' : 'Manage billing'}
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
      </button>
      <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
        Update card, view invoices, or cancel — handled by Stripe.
      </p>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────

export function FunnelPortal({
  token,
  order: initialOrder,
  offerLabel,
}: {
  token: string
  order: FunnelOrder
  offerLabel: string
}) {
  const router = useRouter()
  const [order, setOrder] = useState<FunnelOrder>(initialOrder)
  const [billingLoading, setBillingLoading] = useState(false)
  const [saveFlowOpen, setSaveFlowOpen] = useState(false)

  const includesPixel = useMemo(
    () => order.offer_slug !== 'audience_197',
    [order.offer_slug]
  )
  const includesAudience = useMemo(
    () => order.offer_slug !== 'pixel_97',
    [order.offer_slug]
  )

  const pixelLocked = includesPixel && !order.pixel_provisioned_at

  async function handleManageBilling() {
    setBillingLoading(true)
    trackFunnel(FUNNEL_EVENTS.BILLING_PORTAL_OPENED, { order_id: order.id })
    try {
      const res = await fetch(`/api/funnel/${token}/billing-portal`, {
        method: 'POST',
      })
      const json = (await res.json().catch(() => ({}))) as {
        url?: string
        error?: string
      }
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Could not open billing portal.')
      }
      window.location.assign(json.url)
    } catch (err) {
      setBillingLoading(false)
      alert(err instanceof Error ? err.message : 'Could not open billing portal.')
    }
  }

  // Cancel save-flow (#10): the voluntary "Manage billing" entry (where cancel
  // lives) opens a retention interstitial first, giving us a chance to save the
  // account before they reach Stripe. The past-due banner still goes direct —
  // there the intent is to fix payment, which we want to make frictionless.
  function openBillingSaveFlow() {
    trackFunnel(FUNNEL_EVENTS.BILLING_SAVE_FLOW_VIEWED, { order_id: order.id })
    setSaveFlowOpen(true)
  }

  function proceedToBilling() {
    trackFunnel(FUNNEL_EVENTS.BILLING_SAVE_FLOW_PROCEEDED, { order_id: order.id })
    setSaveFlowOpen(false)
    void handleManageBilling()
  }

  function dismissSaveFlow() {
    trackFunnel(FUNNEL_EVENTS.BILLING_SAVE_FLOW_DISMISSED, { order_id: order.id })
    setSaveFlowOpen(false)
  }

  async function refreshOrder() {
    try {
      const res = await fetch(`/api/funnel/${token}`, { cache: 'no-store' })
      if (!res.ok) return
      const json = (await res.json()) as { order?: FunnelOrder }
      if (json.order) setOrder(json.order)
      router.refresh()
    } catch {
      // silent — caller will re-trigger on next interaction
    }
  }

  const firstName = (order.customer_name ?? '').trim().split(/\s+/)[0] || 'there'

  // Fire portal_viewed once per mount + branch-specific banner events.
  // Identity hint goes in as $set so PostHog connects this token to a
  // person profile (matches the email captured by checkout earlier).
  useEffect(() => {
    trackFunnel(FUNNEL_EVENTS.PORTAL_VIEWED, {
      order_id: order.id,
      offer_slug: order.offer_slug,
      subscription_state: order.subscription_state,
      status: order.status,
    })
    if (order.subscription_state === 'cancelled') {
      trackFunnel(FUNNEL_EVENTS.CANCELLED_SCREEN_VIEWED, { order_id: order.id })
    }
    if (order.subscription_state === 'past_due') {
      trackFunnel(FUNNEL_EVENTS.PAST_DUE_BANNER_VIEWED, { order_id: order.id })
    }
    // Once per order, not per render — order.id is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id])

  // Hard-stop on cancel — show a static cancellation screen instead of the
  // full portal so buyers can't keep using a product they no longer pay for.
  if (order.subscription_state === 'cancelled') {
    return <CancelledScreen customerEmail={order.customer_email} />
  }

  const showSubBanner =
    order.subscription_state === 'past_due' ||
    order.subscription_state === 'paused' ||
    order.subscription_state === 'incomplete'

  return (
    <div className="space-y-6">
      {showSubBanner && (
        <SubscriptionBanner
          state={order.subscription_state as 'past_due' | 'paused' | 'incomplete'}
          onManageBilling={handleManageBilling}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Cursive</h1>
          <p className="mt-1 text-sm text-gray-500">
            Hi {firstName} — finish the steps below to go live.
          </p>
        </div>
        {/* Always-available entry into the full dashboard (passwordless — the
            portal token is exchanged for a session server-side). Ensures a
            buyer can reach their dashboard at any point and never dead-ends. */}
        <a
          href={`/api/funnel/${token}/dashboard-login`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Open your dashboard
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="relative">
              <div
                className="absolute bottom-0 left-[17px] top-9 z-0 w-0.5 bg-gray-100"
                aria-hidden="true"
              />
              <div className="relative z-10">
                <PaymentStep order={order} />
                <PixelStep
                  token={token}
                  order={order}
                  includesPixel={includesPixel}
                  onProvisioned={refreshOrder}
                />
                <AudienceStep
                  token={token}
                  order={order}
                  includesAudience={includesAudience}
                  pixelLocked={pixelLocked}
                  onSubmitted={refreshOrder}
                />
                <DeliveryStep order={order} includesAudience={includesAudience} />
              </div>
            </div>
          </div>

          {/* Identified visitors + the audience live in the DASHBOARD, not the
              portal. The portal is setup only; "Open your dashboard" (above)
              is where buyers see all their leads. */}

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
            <p className="text-sm text-gray-500">
              Questions?{' '}
              <a
                href="mailto:support@meetcursive.com"
                className="font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                support@meetcursive.com
              </a>
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 lg:w-72">
          <PackageSidebar
            order={order}
            offerLabel={offerLabel}
            onManageBilling={openBillingSaveFlow}
            billingLoading={billingLoading}
          />
        </div>
      </div>

      {saveFlowOpen && (
        <BillingSaveFlow
          onProceed={proceedToBilling}
          onDismiss={dismissSaveFlow}
          loading={billingLoading}
        />
      )}
    </div>
  )
}

/**
 * Retention interstitial shown before the buyer reaches Stripe's billing
 * portal (where cancellation lives). Offers a human touchpoint + a beat to
 * reconsider, without blocking anyone who genuinely wants to manage billing.
 */
function BillingSaveFlow({
  onProceed,
  onDismiss,
  loading,
}: {
  onProceed: () => void
  onDismiss: () => void
  loading: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">
          Before you go — can we help?
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          If something isn&apos;t working or the value isn&apos;t landing yet,
          reply and we&apos;ll fix it fast — most issues are a quick pixel or
          targeting tweak. You can also pause instead of cancelling.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <a
            href="mailto:support@meetcursive.com?subject=Help%20with%20my%20Cursive%20account"
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Email us — we&apos;ll make it right
          </a>
          <button
            type="button"
            onClick={onProceed}
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? 'Opening…' : 'Continue to billing'}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-1 text-center text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            Never mind, I&apos;ll stay
          </button>
        </div>
      </div>
    </div>
  )
}
