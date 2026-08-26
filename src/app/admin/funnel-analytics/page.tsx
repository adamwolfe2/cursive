import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/admin'
import {
  getDailyVolume,
  getFunnelStepCounts,
  getOfferBreakdown,
  isPostHogConfigured,
} from '@/lib/funnel/posthog-client'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ days?: string }>
}

export default async function FunnelAnalyticsPage({ searchParams }: PageProps) {
  try {
    await requireAdmin()
  } catch {
    redirect('/dashboard')
  }

  const { days: daysParam } = await searchParams
  const days = Math.min(Math.max(parseInt(daysParam ?? '30', 10) || 30, 1), 90)

  const configured = isPostHogConfigured()
  const [steps, offers, daily] = configured
    ? await Promise.all([
        getFunnelStepCounts(days),
        getOfferBreakdown(days),
        getDailyVolume(days),
      ])
    : [[], [], []]

  const topCount = steps.reduce((m, s) => Math.max(m, s.count), 0) || 1
  const landingCount = steps.find((s) => s.name === 'funnel.landing_viewed')?.count ?? 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funnel Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            PostHog event data for the /get-leads → portal flow. Updates each
            page load (no caching).
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 60, 90].map((d) => (
            <a
              key={d}
              href={`/admin/funnel-analytics?days=${d}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                d === days
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {d}d
            </a>
          ))}
        </div>
      </div>

      {!configured && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">PostHog server credentials not set.</p>
          <p className="mt-1 text-xs leading-relaxed">
            Set <code className="rounded bg-amber-100 px-1.5 py-0.5">POSTHOG_PERSONAL_API_KEY</code>{' '}
            (a <code>phx_…</code> token created in PostHog → Personal API
            Keys) and{' '}
            <code className="rounded bg-amber-100 px-1.5 py-0.5">POSTHOG_PROJECT_ID</code>{' '}
            (the numeric project id from your PostHog dashboard URL) in
            Vercel env. Events are still being captured client-side and visible
            in PostHog directly — this page just needs the keys to query them.
          </p>
        </div>
      )}

      {/* Conversion funnel bars */}
      <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Conversion funnel
        </h2>
        <p className="mb-5 text-xs text-gray-500">
          Distinct people who reached each step in the last {days} days.
          Drop-off % is relative to the previous step.
        </p>
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const prev = idx === 0 ? null : steps[idx - 1].count
            const dropOffPct =
              prev != null && prev > 0
                ? Math.round(((prev - step.count) / prev) * 100)
                : null
            const conversionPct =
              landingCount > 0
                ? Math.round((step.count / landingCount) * 100)
                : 0
            const widthPct = Math.max(
              4,
              Math.round((step.count / topCount) * 100)
            )
            return (
              <div key={step.name}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-gray-800">
                    {idx + 1}. {step.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {step.count.toLocaleString()} people
                    {idx > 0 && (
                      <>
                        {' · '}
                        <span className="text-gray-400">
                          {conversionPct}% of landing
                        </span>
                        {dropOffPct != null && dropOffPct > 0 && (
                          <>
                            {' · '}
                            <span className="text-red-600">
                              -{dropOffPct}% step drop
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      idx === 0
                        ? 'bg-blue-600'
                        : idx === steps.length - 1
                          ? 'bg-emerald-600'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            )
          })}
          {steps.every((s) => s.count === 0) && (
            <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
              No events recorded in the last {days} days yet.
            </p>
          )}
        </div>
      </section>

      {/* Per-offer breakdown */}
      <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Plan tier breakdown
        </h2>
        <p className="mb-5 text-xs text-gray-500">
          Which plan each buyer picked. Checkout_initiated should equal
          plan_selected; gap = drop-off between click and form-submit.
        </p>
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Offer</th>
                <th className="px-4 py-2.5 text-right">Plan selected</th>
                <th className="px-4 py-2.5 text-right">Checkout initiated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-xs text-gray-500">
                    No plan selections in the last {days} days.
                  </td>
                </tr>
              ) : (
                offers.map((o) => (
                  <tr key={o.offer_slug}>
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {o.offer_slug}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">
                      {o.plan_selected.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">
                      {o.checkout_initiated.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Daily volume mini-chart */}
      <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Daily volume
        </h2>
        <p className="mb-5 text-xs text-gray-500">
          Landing views vs. plan-selected vs. checkout-initiated, day by day.
        </p>
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr className="text-left font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2">Day</th>
                <th className="px-4 py-2 text-right">Landed</th>
                <th className="px-4 py-2 text-right">Plan selected</th>
                <th className="px-4 py-2 text-right">Checkout</th>
                <th className="px-4 py-2 text-right">Conv. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {daily.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No daily volume yet.
                  </td>
                </tr>
              ) : (
                daily.map((d) => {
                  const conv =
                    d.landing > 0
                      ? Math.round((d.checkout / d.landing) * 100)
                      : 0
                  return (
                    <tr key={d.day}>
                      <td className="px-4 py-2 text-gray-700">{d.day}</td>
                      <td className="px-4 py-2 text-right text-gray-800">
                        {d.landing}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-800">
                        {d.planSelected}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-800">
                        {d.checkout}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        {conv}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-center text-xs text-gray-400">
        For session recordings, heatmaps, and per-user paths, open PostHog
        directly. This page summarizes the funnel; PostHog has the depth.
      </p>
    </div>
  )
}
