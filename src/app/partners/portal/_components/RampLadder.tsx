import { RAMP_TIERS } from '@/lib/affiliate/ramp'
import { Check } from 'lucide-react'

/**
 * Visual ramp ladder. Highlights the partner's current tier and shows the
 * threshold for each rate. Server-safe (no client JS). When `activePaying` is
 * omitted (marketing context), nothing is highlighted.
 */
export function RampLadder({ activePaying }: { activePaying?: number }) {
  const count = activePaying ?? -1

  // The index of the highest tier the count currently satisfies.
  let currentIdx = -1
  RAMP_TIERS.forEach((t, i) => {
    if (count >= t.minPaying) currentIdx = i
  })

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {RAMP_TIERS.map((tier, i) => {
        const reached = i <= currentIdx
        const isCurrent = i === currentIdx
        const nextThreshold = RAMP_TIERS[i + 1]?.minPaying
        const range = nextThreshold ? `${tier.minPaying}–${nextThreshold - 1}` : `${tier.minPaying}+`
        return (
          <div
            key={tier.rate}
            className={`relative rounded-xl border p-4 text-center transition-colors ${
              isCurrent
                ? 'border-primary bg-blue-50 ring-2 ring-primary/20'
                : reached
                  ? 'border-primary/30 bg-white'
                  : 'border-gray-200 bg-white'
            }`}
          >
            {reached && (
              <span className="absolute right-2 top-2 text-primary">
                <Check className="h-4 w-4" />
              </span>
            )}
            <div className={`text-2xl font-bold ${reached ? 'text-primary' : 'text-gray-900'}`}>
              {tier.rate}%
            </div>
            <div className="mt-1 text-xs font-medium text-gray-500">{tier.label}</div>
            <div className="mt-2 text-[11px] text-gray-400">
              {range} paying {nextThreshold ? 'referrals' : 'referrals'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
