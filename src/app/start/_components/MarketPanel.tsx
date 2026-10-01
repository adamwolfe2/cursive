'use client'

import { ArrowDown, ArrowRight, ArrowUp, Check, UsersRound } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { FREE_LEAD_COUNT, type Icp } from '@/lib/free-leads/contract'
import { AnimatedNumber, formatCount } from './AnimatedNumber'
import { approveBlocker, marketBand, meterPct, widenings, type MarketBand } from './icp-edit'

/** How the last edit moved the count: "+1,240 since you added Texas". */
export interface CountDelta {
  diff: number
  reason: string
}

interface Props {
  /** The final profile; null while the scan is still building it. */
  full: Icp | null
  count: number | null
  counting: boolean
  delta: CountDelta | null
  onChange: (icp: Icp) => void
  approved: boolean
  onApprove: () => void
  /** The secondary action ("Email me this profile"); its row is held so it never moves the panel. */
  secondary: ReactNode
}

const WHITE_FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
const BAND_LABEL: Record<MarketBand, string> = { none: 'No matches', narrow: 'Narrow', focused: 'Focused', broad: 'Broad' }
const TICKS = ['100', '1k', '10k', '100k', '1M+']

/**
 * The decision: how many people fit, how that moved with the last edit, where it sits on a market-size scale,
 * and Approve. Every height here is fixed across states (building, counted, zero, narrow) so the count landing
 * never pushes the targeting panel below it.
 */
export function MarketPanel({ full, count, counting, delta, onChange, approved, onApprove, secondary }: Props) {
  const approveRef = useRef<HTMLButtonElement>(null)
  const settled = count !== null && !counting
  const band = settled ? marketBand(count) : null
  const blocker = full ? approveBlocker(full, count, counting) : 'not_ready'
  const unknown = count === null && !counting && full !== null

  return (
    <section aria-label="People who fit" className="rounded-2xl bg-[#0063E6] px-5 pb-5 pt-5 text-white shadow-enterprise-md sm:px-8 sm:pb-7 sm:pt-7">
      <p className="sr-only" aria-live="polite">
        {count === null ? '' : `${formatCount(count)} people match.`}
      </p>
      <div className="flex h-7 items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <UsersRound className="h-4 w-4" aria-hidden="true" />
          People who fit
        </p>
        {band && (
          <span key={band} className="fl-fade rounded-full bg-white px-2.5 py-0.5 text-[12px] font-semibold text-[#084fba]">
            {BAND_LABEL[band]}
          </span>
        )}
      </div>

      <div className="mt-2 flex h-[3.25rem] items-end sm:h-[4.25rem]">
        {count === null ? (
          <span className={`block h-10 w-40 rounded-lg sm:h-14 sm:w-56 ${unknown ? 'bg-white/10' : 'fl-sheen'}`} aria-hidden="true" />
        ) : (
          <AnimatedNumber
            value={count}
            duration={900}
            className={`block text-[3.25rem] font-semibold leading-none tabular-nums tracking-[-0.04em] transition-opacity duration-200 sm:text-[4.25rem] ${counting ? 'opacity-60' : ''}`}
          />
        )}
      </div>
      <div className="mt-2 flex h-7 min-w-0 items-center gap-3 text-[14px] sm:text-[15px]">
        <span className="shrink-0">
          {count === null ? (unknown ? 'Count unavailable right now.' : 'Counting people who fit') : 'people fit this profile'}
        </span>
        {delta && settled && <DeltaPill key={deltaKey(delta)} delta={delta} />}
      </div>

      <Meter count={settled ? count : null} />

      <div className="mt-5 border-t border-white/20 pt-4">
        <Guidance full={full} count={settled ? count : null} band={band} blocker={blocker} approved={approved} onChange={onChange} />
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
          <button
            ref={approveRef}
            type="button"
            data-fl-approve=""
            onClick={onApprove}
            disabled={approved || blocker !== null}
            className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-[#084fba] shadow-enterprise-sm transition-[background-color,transform] duration-150 hover:bg-[#f0f7ff] active:scale-[0.98] disabled:cursor-default disabled:bg-white/15 disabled:text-white disabled:shadow-none max-sm:w-full sm:h-14 sm:px-8 sm:text-lg ${WHITE_FOCUS}`}
          >
            {approved ? <Check className="fl-pop h-5 w-5" aria-hidden="true" /> : null}
            {approved ? 'Approved' : 'Approve this profile'}
            {approved ? null : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
          </button>
          <div className="min-h-11 min-w-0 flex-1">{secondary}</div>
        </div>
      </div>
      <StickyApprove target={approveRef} count={count} counting={counting} delta={delta} show={full !== null && !approved && count !== 0} disabled={approved || blocker !== null} onApprove={onApprove} />
    </section>
  )
}

/** Remount key: every new delta pops in again. */
const deltaKey = (d: CountDelta) => `${d.diff}:${d.reason}`

function DeltaPill({ delta, compact = false }: { delta: CountDelta; compact?: boolean }) {
  const Icon = delta.diff > 0 ? ArrowUp : ArrowDown
  const text = `${delta.diff > 0 ? '+' : '-'}${formatCount(Math.abs(delta.diff))}`
  return (
    <span
      className={`fl-pop inline-flex min-w-0 items-center gap-1 rounded-full font-semibold ${compact ? 'bg-[#e8f1ff] px-2 py-0.5 text-[12px] text-[#084fba]' : 'bg-white px-2.5 py-1 text-[13px] text-[#084fba]'}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="shrink-0 tabular-nums">{text}</span>
      <span className={`truncate font-medium ${compact ? 'max-sm:hidden' : ''}`}>{delta.reason}</span>
    </span>
  )
}

/**
 * The count on a log scale with three guidance zones. Honest by construction: it only re-plots the live count.
 * The marker moves with a transform on a full-width layer, so nothing reflows.
 */
function Meter({ count }: { count: number | null }) {
  const pct = count === null ? null : meterPct(count)
  return (
    <div className="mt-5" aria-hidden="true">
      {/* The marker layer is translated up to its own width; this frame clips it (with room for the marker's edge). */}
      <div className="-mx-2 overflow-hidden px-2 py-0.5">
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 gap-1">
          <span className="h-full w-[17.5%] rounded-l-full bg-white/20" />
          <span className="h-full w-[57.5%] bg-white/40" />
          <span className="h-full flex-1 rounded-r-full bg-white/20" />
        </div>
        <div
          className={`fl-meter absolute inset-0 ${pct === null ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: `translateX(${pct ?? 0}%)` }}
        >
          <span className="absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#0063E6] bg-white shadow-[0_0_0_2px_rgb(255_255_255/0.5)]" />
        </div>
      </div>
      </div>
      <div className="mt-1.5 grid grid-cols-[17.5%_57.5%_1fr] text-[12px] font-medium">
        <span>Narrow</span>
        <span className="pl-1">Focused</span>
        <span className="pl-1">Broad</span>
      </div>
      <div className="mt-0.5 flex justify-between text-[11px] tabular-nums max-sm:hidden">
        {TICKS.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  )
}

/** One reserved slot under the meter: what happens next, or a one-click way to widen a short list. */
function Guidance({
  full,
  count,
  band,
  blocker,
  approved,
  onChange,
}: {
  full: Icp | null
  count: number | null
  band: MarketBand | null
  blocker: ReturnType<typeof approveBlocker>
  approved: boolean
  onChange: (icp: Icp) => void
}) {
  const widen = full && (band === 'none' || band === 'narrow') ? widenings(full) : []
  let text: string
  if (approved) text = 'Approved. Add your work email below and we pull your 25.'
  else if (!full || count === null) text = 'Your free 25 come from this list once you approve it.'
  else if (band === 'none') text = 'Nobody matches all of that yet. Loosen one thing:'
  else if (blocker === 'too_broad') text = 'Too broad to approve. Add a title, industry or company size.'
  else if (band === 'narrow') text = `A short list. ${count < FREE_LEAD_COUNT ? `All ${count} are yours free. ` : ''}Widen it in one click:`
  else text = 'Next: confirm a work email and we pull 25 of these people for you, free.'
  const showWiden = widen.length > 0 && !approved

  // Fixed height in every state: one line of guidance plus either a row of one-click widenings or a short hint.
  return (
    <div className="flex h-[5.75rem] flex-col gap-2 sm:h-[4.25rem]">
      <p className="text-[14px] leading-snug sm:text-[15px] sm:font-medium">{text}</p>
      {!showWiden && full && count !== null && !approved && band !== 'none' && (
        <p className="text-[13px] leading-snug">Change anything in the targeting below and this count updates as you go.</p>
      )}
      {showWiden && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {widen.map((w) => (
            <button
              key={w.label}
              type="button"
              onClick={() => onChange(w.next)}
              className={`fl-fade h-11 shrink-0 whitespace-nowrap rounded-lg bg-white px-3.5 text-sm font-semibold text-[#084fba] transition-colors hover:bg-[#f0f7ff] sm:h-9 ${WHITE_FOCUS}`}
            >
              {w.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * The count and Approve follow the reader once the panel's own Approve scrolls out of view (phones: a bottom bar;
 * desktop: a small card bottom right). Fixed and moved with transform only, so showing it never shifts the page.
 */
function StickyApprove({
  target,
  count,
  counting,
  delta,
  show,
  disabled,
  onApprove,
}: {
  target: RefObject<HTMLButtonElement | null>
  count: number | null
  counting: boolean
  delta: CountDelta | null
  show: boolean
  disabled: boolean
  onApprove: () => void
}) {
  const [offscreen, setOffscreen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    const el = target.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setOffscreen(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [target])
  const visible = show && offscreen
  // Portaled to <body>: the panel's entrance animation makes it a containing block for fixed children.
  if (!mounted) return null
  return createPortal(
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={`fl-dock fixed inset-x-0 bottom-0 z-30 border-t border-[#e5e7eb] bg-white px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-[#111318] shadow-[0_-8px_24px_rgb(12_31_69/0.12)] lg:inset-x-auto lg:bottom-5 lg:right-5 lg:w-[26rem] lg:rounded-2xl lg:border lg:p-4 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[calc(100%+1.5rem)] opacity-0'}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-baseline gap-1.5">
            {count === null ? (
              <span className="fl-sheen-ink block h-6 w-20 rounded" />
            ) : (
              <AnimatedNumber value={count} className={`text-[1.375rem] font-semibold tabular-nums tracking-[-0.02em] transition-opacity ${counting ? 'opacity-60' : ''}`} />
            )}
            <span className="text-[13px] text-[#4d5460]">people fit</span>
          </p>
          <p className="mt-0.5 h-5 truncate">{delta && !counting && <DeltaPill key={deltaKey(delta)} delta={delta} compact />}</p>
        </div>
        <button
          type="button"
          onClick={onApprove}
          disabled={disabled}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#0063E6] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#084fba] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] disabled:bg-[#e5e7eb] disabled:text-[#4d5460]"
        >
          Approve
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body
  )
}
