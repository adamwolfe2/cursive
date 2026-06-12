import { requireAffiliate } from '../_lib/require-affiliate'
import { buildPortalSummary } from '@/lib/affiliate/portal'
import { RAMP_TIERS } from '@/lib/affiliate/ramp'
import { RampLadder } from '../_components/RampLadder'
import { usd } from '../_lib/format'
import { Lock, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
  const affiliate = await requireAffiliate()
  const s = await buildPortalSummary(affiliate)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Achievements</h2>
        <p className="text-sm text-gray-500">
          Every tier you unlock raises your rate on your entire active book.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Commission ramp</h3>
        <RampLadder activePaying={s.activePaying} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Tier badges</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {RAMP_TIERS.map((tier) => {
            const unlocked = s.activePaying >= tier.minPaying
            return (
              <div
                key={tier.rate}
                className={`flex flex-col items-center rounded-xl border p-4 text-center ${
                  unlocked ? 'border-primary/30 bg-blue-50' : 'border-gray-200 bg-white opacity-70'
                }`}
              >
                <div
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
                    unlocked ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {unlocked ? <Trophy className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>
                <p className="text-sm font-semibold text-gray-900">{tier.label}</p>
                <p className="text-xs text-gray-500">{tier.rate}% · {tier.minPaying}+</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Active paying referrals" value={String(s.activePaying)} />
        <Stat label="Lifetime paying referrals" value={String(s.lifetimePaying)} />
        <Stat label="Lifetime earnings" value={usd(s.lifetimeEarningsCents)} />
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
