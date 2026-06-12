import Link from 'next/link'
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { requireAffiliate } from './_lib/require-affiliate'
import { buildPortalSummary } from '@/lib/affiliate/portal'
import { RampLadder } from './_components/RampLadder'
import { usd, shortDate } from './_lib/format'

export const dynamic = 'force-dynamic'

export default async function PortalOverview() {
  const affiliate = await requireAffiliate()
  const s = await buildPortalSummary(affiliate)

  const progressPct = s.next
    ? Math.min(100, Math.round((s.activePaying / s.next.at) * 100))
    : 100

  return (
    <div className="space-y-8">
      {/* Headline stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Current rate"
          value={`${s.rate}%`}
          sub={`${s.tierLabel} tier${s.isMaxTier ? ' · max' : ''}`}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Active paying referrals"
          value={String(s.activePaying)}
          sub={`${s.counts.leads} pending · ${s.counts.churned} churned`}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="MRR you've driven"
          value={usd(s.mrrDrivenCents, { cents: false })}
          sub="recurring, while active"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Pending balance"
          value={usd(s.pendingBalanceCents)}
          sub={`Next payout ${shortDate(s.nextPayoutDateISO)}`}
        />
      </div>

      {/* Next tier progress */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your commission ramp</h2>
          <span className="text-sm text-gray-500">
            Lifetime earnings:{' '}
            <span className="font-semibold text-gray-900">{usd(s.lifetimeEarningsCents)}</span>
          </span>
        </div>

        <RampLadder activePaying={s.activePaying} />

        <div className="mt-6">
          {s.next ? (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  <strong className="text-gray-900">{s.next.remaining}</strong> more paying referral
                  {s.next.remaining === 1 ? '' : 's'} to unlock{' '}
                  <strong className="text-primary">{s.next.rate}%</strong>
                </span>
                <span className="text-gray-400">
                  {s.activePaying}/{s.next.at}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm font-medium text-primary">
              You&apos;ve reached the top tier — 40% recurring on your entire active book. Maximum rate
              unlocked.
            </p>
          )}
        </div>
      </section>

      {/* Setup checklist + quick links */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Payout setup
          </h3>
          <ul className="space-y-3">
            <ChecklistRow done={s.signed} label="Sign the Partner Agreement" href="/partners/portal/agreement" />
            <ChecklistRow
              done={s.stripeOnboarded}
              label="Connect Stripe to receive payouts"
              href="/partners/portal/payouts"
            />
          </ul>
          {!s.payoutEligible && (
            <p className="mt-4 text-xs text-gray-500">
              Commissions accrue now and pay out once both steps are complete (min {usd(5000, { cents: false })}/mo).
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            This month
          </h3>
          <div className="space-y-3 text-sm">
            <Row label="Paid this month" value={usd(s.paidThisMonthCents)} />
            <Row label="Pending balance" value={usd(s.pendingBalanceCents)} />
            <Row label="Lifetime paying referrals" value={String(s.lifetimePaying)} />
          </div>
          <Link
            href="/partners/portal/links"
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Grab your referral links <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-primary">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{sub}</p>
    </div>
  )
}

function ChecklistRow({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 text-sm hover:underline">
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-300" />
        )}
        <span className={done ? 'text-gray-500 line-through' : 'text-gray-900'}>{label}</span>
      </Link>
    </li>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}
