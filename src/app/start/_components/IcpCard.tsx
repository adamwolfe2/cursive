'use client'

import { ArrowRight, Briefcase, Building2, Check, Factory, Layers, Loader2, MapPin, Plus, SlidersHorizontal, Sparkles, X, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import type { Icp } from '@/lib/free-leads/contract'
import { chipLabel, matchOption, ROWS, valuesFor, withAdded, withRemoved, type ListKey } from './icp-edit'
import { MarketPanel, type CountDelta } from './MarketPanel'

interface Props {
  icp: Partial<Icp>
  complete: boolean
  count: number | null
  counting: boolean
  delta: CountDelta | null
  onChange: (icp: Icp) => void
  refining: boolean
  refineNote: string | null
  refineError: string | null
  onRefine: (instruction: string) => void
  approved: boolean
  onApprove: () => void
  /** "Email me this profile", rendered in the decision panel's reserved secondary slot. */
  secondary: ReactNode
}

/** Titles beyond this fold behind "+N more" so a long list does not bury the rest of the targeting. */
const TITLE_CAP = 6
const ICONS: Record<ListKey, LucideIcon> = {
  industries: Factory,
  job_titles: Briefcase,
  seniority: Layers,
  company_size: Building2,
  locations: MapPin,
}
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]'

/**
 * The buyer profile, built live from `icp_partial` events: the summary, the decision panel (count, market meter,
 * Approve) and the targeting panel. Everything mounts together with the first field and only grows at the bottom
 * while it builds, so nothing on screen is pushed around.
 */
export function IcpCard(props: Props) {
  const { icp, complete } = props
  const started = Object.keys(icp).length > 0
  const full = complete ? (icp as Icp) : null

  // Before the first field: one placeholder that is swapped out whole (desktop only), never shifted.
  if (!started) return <Placeholder />

  return (
    <section aria-labelledby="icp-heading" aria-busy={!complete} className="fl-rise space-y-5">
      <div>
        <h2 id="icp-heading" className="flex h-6 items-center gap-2 text-sm font-medium text-[#4d5460]">
          {!complete && <span className="fl-pulse h-1.5 w-1.5 rounded-full bg-[#007AFF]" aria-hidden="true" />}
          {complete ? 'Who buys from you' : 'Building your buyer profile'}
        </h2>
        {icp.summary && (
          <p className="mt-2 max-w-[44ch] text-[1.5rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[#111318] sm:text-[1.875rem]">
            {icp.summary}
          </p>
        )}
      </div>
      <MarketPanel
        full={full}
        count={props.count}
        counting={props.counting}
        delta={props.delta}
        onChange={props.onChange}
        approved={props.approved}
        onApprove={props.onApprove}
        secondary={props.secondary}
      />
      <Targeting {...props} full={full} />
    </section>
  )
}

function Placeholder() {
  return (
    <div className="max-lg:hidden" aria-hidden="true">
      <p className="flex h-6 items-center gap-2 text-sm font-medium text-[#4d5460]">
        <span className="fl-pulse h-1.5 w-1.5 rounded-full bg-[#007AFF]" />
        Your buyer profile
      </p>
      <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-[#4d5460]">
        Fills in here, one field at a time, as we work out who buys from you.
      </p>
      <div className="mt-5 h-52 rounded-2xl bg-[#0063E6] p-8">
        <span className="fl-sheen block h-14 w-56 rounded-lg" />
        <span className="mt-6 block h-2 rounded-full bg-white/20" />
      </div>
      <div className="mt-5 rounded-2xl border border-[#e5e7eb] px-6">
        {ROWS.map((row, i) => (
          <div key={row.key} className="flex items-center gap-6 border-b border-[#f0f1f3] py-4 last:border-b-0">
            <span className="w-32 shrink-0 text-sm text-[#4d5460]">{row.label}</span>
            <span className="fl-sheen-ink h-7 rounded-md" style={{ width: `${5 + ((i * 3) % 4)}rem` }} />
            <span className="fl-sheen-ink h-7 rounded-md" style={{ width: `${4 + ((i * 5) % 3)}rem` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Targeting(props: Props & { full: Icp | null }) {
  const { icp, full, onChange } = props
  const rows = ROWS.filter((row) => valuesFor(icp, row.key) !== undefined)
  return (
    <section aria-labelledby="targeting-heading" className="rounded-2xl border border-[#e5e7eb] bg-white">
      <div className="flex h-14 items-center justify-between gap-4 border-b border-[#f0f1f3] px-5 py-3 sm:px-6">
        <h3 id="targeting-heading" className="flex items-center gap-2 text-sm font-semibold text-[#1d2025]">
          <SlidersHorizontal className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
          Targeting
        </h3>
        <p className="truncate text-[13px] text-[#6b7280]">{full ? 'Every edit recounts live' : 'Filling in from your site'}</p>
      </div>
      <dl className="px-5 sm:px-6">
        {rows.length === 0
          ? ROWS.map((row, i) => (
              <div key={row.key} className="flex items-center gap-6 border-b border-[#f0f1f3] py-4 last:border-b-0" aria-hidden="true">
                <span className="w-32 shrink-0 text-sm text-[#4d5460]">{row.label}</span>
                <span className="fl-sheen-ink h-7 rounded-md" style={{ width: `${5 + ((i * 3) % 4)}rem` }} />
              </div>
            ))
          : rows.map((row) => <Row key={row.key} row={row} icp={icp} full={full} onChange={onChange} />)}
      </dl>
      {full && <RefineBox {...props} />}
    </section>
  )
}

function Row({
  row,
  icp,
  full,
  onChange,
}: {
  row: (typeof ROWS)[number]
  icp: Partial<Icp>
  full: Icp | null
  onChange: (icp: Icp) => void
}) {
  const values = valuesFor(icp, row.key) ?? []
  const Icon = ICONS[row.key]
  return (
    <div className="fl-rise grid gap-2.5 border-b border-[#f0f1f3] py-4 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-6">
      <dt className="flex items-center gap-2 text-[13px] font-medium text-[#1d2025] sm:h-8">
        <Icon className="h-4 w-4 shrink-0 text-[#6b7280]" aria-hidden="true" />
        {row.label}
        {values.length === 0 && <span className="font-normal text-[#6b7280]">any</span>}
      </dt>
      <dd className="min-w-0">
        {row.options ? (
          <Toggles row={row} options={row.options} values={values} full={full} onChange={onChange} />
        ) : (
          <Tokens row={row} values={values} full={full} onChange={onChange} />
        )}
      </dd>
    </div>
  )
}

/**
 * Seniority and company size: every option on screen, one press to switch it on or off. While the profile is
 * still building they render disabled in the same geometry, so the profile completing moves nothing.
 */
function Toggles({
  row,
  options,
  values,
  full,
  onChange,
}: {
  row: (typeof ROWS)[number]
  options: readonly string[]
  values: string[]
  full: Icp | null
  onChange: (icp: Icp) => void
}) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={row.label}>
      {options.map((o) => {
        const on = values.includes(o)
        return (
          <li key={o}>
            <button
              type="button"
              aria-pressed={on}
              disabled={!full}
              onClick={() => full && onChange(on ? withRemoved(full, row.key, o) : withAdded(full, row.key, o))}
              className={`fl-compact inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors duration-150 max-sm:h-11 ${
                on
                  ? 'bg-[#e8f1ff] text-[#084fba] ring-1 ring-inset ring-[#b3d7ff] hover:bg-[#dbeaff]'
                  : 'bg-white text-[#4d5460] ring-1 ring-inset ring-[#e5e7eb] enabled:hover:text-[#1d2025] enabled:hover:ring-[#a0a5b1]'
              } disabled:cursor-default ${FOCUS}`}
            >
              {on ? <Check className="fl-pop h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
              {chipLabel(row.key, o)}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Industries, titles, locations: removable chips, a one-press way back for anything removed, and Add. The remove
 * and Add controls are on screen (disabled) while the profile builds, so it completing reflows nothing.
 */
function Tokens({
  row,
  values,
  full,
  onChange,
}: {
  row: (typeof ROWS)[number]
  values: string[]
  full: Icp | null
  onChange: (icp: Icp) => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [industries, setIndustries] = useState<readonly string[] | null>(null)
  /** Why a typed value was not added (industries must come from the list). */
  const [hint, setHint] = useState<string | null>(null)
  /** Removed here this session, offered back in place. Cleared by a new scan (the row remounts). */
  const [removed, setRemoved] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)
  const inputId = useId()
  const listId = useId()
  const hintId = useId()
  const addRef = useRef<HTMLButtonElement>(null)
  const firstHiddenRef = useRef<HTMLLIElement>(null)
  const cap = row.key === 'job_titles' && !showAll ? TITLE_CAP : Infinity
  const hidden = Math.max(0, values.length - cap)
  const restorable = full ? removed.filter((v) => !values.includes(v)) : []
  /** Controls that unmount on use hand keyboard focus to the row's Add button (after React commits). */
  const focusAdd = () => requestAnimationFrame(() => addRef.current?.focus())

  const openAdd = () => {
    setAdding(true)
    if (row.key === 'industries' && !industries) {
      import('@/lib/free-leads/industries')
        .then((m) => setIndustries(m.LEAD_INDUSTRIES))
        .catch((err: unknown) => console.error('[start] industry list failed to load', err))
    }
  }

  const close = () => {
    setDraft('')
    setHint(null)
    setAdding(false)
  }

  /** Returns false when the draft stays open (an industry that is not in the list). */
  const commit = (): boolean => {
    const value = draft.trim()
    if (full && value && row.key === 'industries') {
      const match = industries ? matchOption(industries, value) : null
      if (!match) {
        setHint(industries ? 'Pick an industry from the list.' : 'Loading industries. Try again in a moment.')
        return false
      }
      onChange(withAdded(full, row.key, match))
    } else if (full && value) {
      onChange(withAdded(full, row.key, value))
    }
    close()
    return true
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (commit()) focusAdd()
    } else if (e.key === 'Escape') {
      close()
      focusAdd()
    }
  }

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label={row.label}>
      {values.length === 0 && !adding && !restorable.length && <li className="flex h-8 items-center text-sm text-[#4d5460] max-sm:h-11">Anyone</li>}
      {values.slice(0, cap).map((v, i) => (
        <li
          key={v}
          ref={i === TITLE_CAP ? firstHiddenRef : undefined}
          tabIndex={i === TITLE_CAP ? -1 : undefined}
          className={`fl-rise inline-flex min-h-8 max-w-full items-center gap-0.5 rounded-md bg-[#e8f1ff] py-1 pl-2.5 pr-1 text-sm font-medium leading-tight text-[#084fba] ring-1 ring-inset ring-[#b3d7ff] max-sm:min-h-11 max-sm:py-0 max-sm:pr-0 ${FOCUS}`}
        >
          <span className="min-w-0 [overflow-wrap:anywhere]">{chipLabel(row.key, v)}</span>
          <button
              type="button"
              disabled={!full}
              onClick={() => {
                if (!full) return
                onChange(withRemoved(full, row.key, v))
                setRemoved((r) => [...r.filter((x) => x !== v), v])
                focusAdd()
              }}
              className="fl-compact grid h-6 w-6 shrink-0 place-items-center rounded text-[#0063E6] transition-colors enabled:hover:bg-[#cfe2ff] disabled:cursor-default disabled:text-[#7fb0f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007AFF] max-sm:h-11 max-sm:w-11"
              aria-label={`Remove ${chipLabel(row.key, v)}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </li>
      ))}
      {hidden > 0 && (
        <li>
          <button
            type="button"
            onClick={() => {
              setShowAll(true)
              // The button unmounts; focus lands on the first chip it revealed.
              requestAnimationFrame(() => firstHiddenRef.current?.focus())
            }}
            aria-label={`Show ${hidden} more ${row.label.toLowerCase()}`}
            className={`fl-compact h-8 rounded-md px-2 text-sm font-semibold text-[#0063E6] underline underline-offset-4 transition-colors hover:bg-[#f0f7ff] max-lg:h-11 max-lg:px-3 ${FOCUS}`}
          >
            +{hidden} more
          </button>
        </li>
      )}
      {full &&
        restorable.map((v) => (
          <li key={`removed-${v}`}>
            <button
              type="button"
              onClick={() => {
                onChange(withAdded(full, row.key, v))
                setRemoved((r) => r.filter((x) => x !== v))
                focusAdd()
              }}
              aria-label={`Add back ${chipLabel(row.key, v)}`}
              className={`fl-fade fl-compact inline-flex h-8 items-center gap-1 rounded-md border border-dashed border-[#c4c9d2] px-2.5 text-sm text-[#6b7280] transition-colors hover:border-[#0063E6] hover:text-[#084fba] max-sm:h-11 ${FOCUS}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="line-through decoration-[#a0a5b1]">{chipLabel(row.key, v)}</span>
            </button>
          </li>
        ))}
      {full && adding && (
        <li>
          <label htmlFor={inputId} className="sr-only">
            Add to {row.label}
          </label>
          <input
            id={inputId}
            autoFocus
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setHint(null)
            }}
            onKeyDown={onKey}
            onBlur={() => void commit()}
            aria-invalid={hint ? true : undefined}
            aria-describedby={hint ? hintId : undefined}
            list={row.key === 'industries' ? listId : undefined}
            placeholder={row.key === 'locations' ? 'Texas or Canada' : row.key === 'job_titles' ? 'Head of Growth' : 'Type to search'}
            maxLength={80}
            className="h-8 w-52 max-w-full rounded-md border border-[#d1d5db] bg-white px-2.5 text-sm text-[#1d2025] placeholder:text-[#6b7280] focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15 max-sm:h-11"
          />
          {row.key === 'industries' && industries && (
            <datalist id={listId}>
              {industries.map((i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
          )}
          {hint && (
            <p id={hintId} role="status" className="mt-1.5 text-[13px] font-medium text-[#b91c1c]">
              {hint}
            </p>
          )}
        </li>
      )}
      {!adding && values.length < row.max && (
        <li>
          <button
            ref={addRef}
            type="button"
            onClick={openAdd}
            disabled={!full}
            className={`fl-compact inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold text-[#0063E6] transition-colors enabled:hover:bg-[#f0f7ff] disabled:cursor-default disabled:text-[#7fb0f0] max-sm:h-11 ${FOCUS}`}
            aria-label={`Add to ${row.label}`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add
          </button>
        </li>
      )}
    </ul>
  )
}

function RefineBox({ refining, refineNote, refineError, onRefine }: Props) {
  const [text, setText] = useState('')
  const [slow, setSlow] = useState(false)
  const id = useId()
  useEffect(() => {
    setSlow(false)
    if (!refining) return
    const t = window.setTimeout(() => setSlow(true), 6000)
    return () => window.clearTimeout(t)
  }, [refining])
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (text.trim().length < 2 || refining) return
    onRefine(text.trim())
    setText('')
  }
  return (
    <form onSubmit={submit} className="fl-fade rounded-b-2xl border-t border-[#f0f1f3] bg-[#f8fafd] px-5 pb-3 pt-4 sm:px-6">
      <label htmlFor={id} className="flex items-center gap-2 text-[13px] font-medium text-[#1d2025]">
        <Sparkles className="h-4 w-4 text-[#0063E6]" aria-hidden="true" />
        Or say what to change
      </label>
      <div className="mt-2 flex h-12 items-center rounded-lg border border-[#d1d5db] bg-white pl-4 pr-1.5 focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/15">
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={refining}
          maxLength={500}
          placeholder="Only Texas, add CMOs"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-[#1d2025] placeholder:text-[#6b7280] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60 sm:text-[15px]"
        />
        <button
          type="submit"
          disabled={refining || text.trim().length < 2}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#0063E6] text-white transition-colors hover:bg-[#084fba] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0063E6] disabled:bg-[#b3d7ff]"
          aria-label="Apply change"
        >
          {refining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <p className="mt-2 min-h-5 text-[13px] text-[#4d5460]" role="status">
        {refining ? (slow ? 'Rewriting your profile and recounting. A few more seconds.' : 'Updating your list...') : refineError ?? refineNote ?? ''}
      </p>
    </form>
  )
}
