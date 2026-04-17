'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Lock, PartyPopper } from 'lucide-react'

interface RevealGateProps {
  remainingCount: number
  currentUnlockTier: number
  onQualifier: () => void
  onBookCall: () => void
}

/**
 * Inline upsell card shown at the bottom of the SampleLeadList.
 *
 * Tier 0 — no qualifier yet:  "answer 3 questions" OR "book a call".
 * Tier 1 — qualifier done:     "book a call" to unlock ALL + export.
 * Tier 2 — hidden (list shows export button instead).
 */
export function RevealGate({
  remainingCount,
  currentUnlockTier,
  onQualifier,
  onBookCall,
}: RevealGateProps) {
  if (currentUnlockTier >= 2) return null

  if (currentUnlockTier === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50 to-white"
      >
        <div className="px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700">
              <Lock className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#0F172A]">
                {remainingCount} more real leads hidden
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">
                Answer 3 quick questions to unlock 5 more — or book a call to get them all.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onQualifier}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Answer 3 questions
                  <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={onBookCall}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  <Calendar className="h-3 w-3" />
                  Or book a call
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Tier 1 — qualifier done, book a call to unlock everything
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50 to-white"
    >
      <div className="px-3.5 py-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <PartyPopper className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#0F172A]">
              Unlocked — {remainingCount} more to go
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">
              Book a 15-min call to unlock the rest + export to CSV + activate a free trial.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onBookCall}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Calendar className="h-3 w-3" />
                Book a call
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
