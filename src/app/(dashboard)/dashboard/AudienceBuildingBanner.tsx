/**
 * Audience "build in progress" banner.
 *
 * Shown to funnel buyers whose managed audience hasn't been delivered yet.
 * The audience is fulfilled + routed manually, so this sets the expectation
 * that leads arrive within 24h instead of leaving the section looking empty.
 */
export function AudienceBuildingBanner() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
      <span className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-blue-900">
          Your custom audience is being built
        </p>
        <p className="mt-0.5 text-xs text-blue-800/80">
          We&apos;re hand-building your audience around your ICP and routing it
          to this dashboard. Your first leads land here within 24 hours, and your
          identified website visitors start flowing as soon as your pixel fires.
        </p>
      </div>
    </div>
  )
}
