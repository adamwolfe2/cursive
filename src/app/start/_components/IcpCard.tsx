'use client'

import { ArrowRight, Check, Loader2, Pencil, Plus, X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Icp } from '@/lib/free-leads/contract'
import { AnimatedNumber, formatCount } from './AnimatedNumber'
import { chipLabel, ROWS, valuesFor, widenings, withAdded, withRemoved } from './icp-edit'

interface Props {
  icp: Partial<Icp>
  complete: boolean
  count: number | null
  counting: boolean
  onChange: (icp: Icp) => void
  refining: boolean
  refineNote: string | null
  refineError: string | null
  onRefine: (instruction: string) => void
  approved: boolean
  onApprove: () => void
}

const WHITE_FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

/**
 * The buyer profile, built live from `icp_partial` events. Fields append in arrival order (summary, then rows)
 * and the footer mounts with the final `icp`, so nothing already on screen is pushed around while it builds.
 */
export function IcpCard(props: Props) {
  const { icp, complete, onChange } = props
  const [editing, setEditing] = useState(false)
  const started = Object.keys(icp).length > 0
  const full = complete ? (icp as Icp) : null
  const rows = ROWS.filter((row) => valuesFor(icp, row.key) !== undefined)

  return (
    <section
      aria-labelledby="icp-heading"
      aria-busy={!complete}
      // Mobile: the card mounts under the rail with its first field. Desktop keeps the frame from the start.
      className={`overflow-clip rounded-2xl bg-[#0063E6] text-white shadow-enterprise-md ${started ? 'fl-rise' : 'max-lg:hidden'}`}
    >
      <div className="px-5 pb-6 pt-5 sm:px-10 sm:pb-8 sm:pt-8">
        <div className="flex min-h-11 items-center justify-between gap-4 sm:min-h-9">
          <h2 id="icp-heading" className="flex items-center gap-2 text-sm font-medium text-white">
            {!complete && <span className="fl-pulse h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />}
            {complete ? 'Who buys from you' : started ? 'Building your buyer profile' : 'Your buyer profile'}
          </h2>
          {full && (
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              aria-pressed={editing}
              className={`fl-fade inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/50 transition-colors hover:bg-[#084fba] ${WHITE_FOCUS}`}
            >
              {editing ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
              {editing ? 'Done editing' : 'Edit'}
            </button>
          )}
        </div>
        {icp.summary ? (
          <p className="fl-rise mt-3 max-w-[34ch] text-[1.625rem] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[2.125rem]">
            {icp.summary}
          </p>
        ) : (
          <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-white">
            Fills in here, one field at a time, as we work out who buys from you.
          </p>
        )}

        {rows.length > 0 && (
          <dl className="mt-7 border-t border-white/20">
            {rows.map((row) => (
              <IcpRow key={row.key} row={row} icp={icp} full={full} editing={editing} onChange={onChange} />
            ))}
          </dl>
        )}

        {full && editing && <RefineBox {...props} />}
      </div>

      {full && <CountFooter {...props} full={full} />}
    </section>
  )
}

function IcpRow({
  row,
  icp,
  full,
  editing,
  onChange,
}: {
  row: (typeof ROWS)[number]
  icp: Partial<Icp>
  full: Icp | null
  editing: boolean
  onChange: (icp: Icp) => void
}) {
  const values = valuesFor(icp, row.key) ?? []
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [industries, setIndustries] = useState<readonly string[] | null>(null)
  const inputId = useId()
  const listId = useId()
  const edit = Boolean(full && editing)

  const openAdd = () => {
    setAdding(true)
    if (row.key === 'industries' && !industries) {
      import('@/lib/free-leads/industries')
        .then((m) => setIndustries(m.LEAD_INDUSTRIES))
        .catch((err: unknown) => console.error('[start] industry list failed to load', err))
    }
  }

  const commit = () => {
    if (full && draft.trim()) onChange(withAdded(full, row.key, draft))
    setDraft('')
    setAdding(false)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      setDraft('')
      setAdding(false)
    }
  }

  const remaining = row.options?.filter((o) => !values.includes(o)) ?? []

  return (
    <div className="fl-rise grid gap-2 border-b border-white/20 py-3.5 sm:grid-cols-[9rem_1fr] sm:gap-6">
      <dt className="pt-1.5 text-[13px] font-medium text-white">{row.label}</dt>
      <dd className="min-h-8">
        <ul className="flex flex-wrap items-center gap-2" aria-label={row.label}>
          {values.length === 0 && !adding && <li className="py-1.5 text-sm text-white">Any</li>}
          {values.map((v) => (
            <li
              key={v}
              className={`inline-flex min-h-8 max-w-full items-center gap-1 rounded-md bg-white py-1 text-sm font-medium leading-tight text-[#0c1f45] ${edit ? 'pl-2.5 pr-1 max-sm:min-h-11 max-sm:py-0 max-sm:pr-0' : 'px-2.5'}`}
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{chipLabel(row.key, v)}</span>
              {full && edit && (
                <button
                  type="button"
                  onClick={() => onChange(withRemoved(full, row.key, v))}
                  className="fl-compact grid h-6 w-6 shrink-0 max-sm:h-11 max-sm:w-11 place-items-center rounded text-[#0063E6] transition-colors hover:bg-[#f0f7ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0c1f45]"
                  aria-label={`Remove ${chipLabel(row.key, v)}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
          {full && edit && adding && row.options && (
            <>
              {remaining.map((o) => (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => onChange(withAdded(full, row.key, o))}
                    className={`fl-compact h-8 rounded-md border max-sm:h-11 border-dashed border-white/70 px-2.5 text-sm font-medium text-white transition-colors hover:bg-[#084fba] ${WHITE_FOCUS}`}
                  >
                    + {chipLabel(row.key, o)}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className={`fl-compact h-8 px-2 max-sm:h-11 max-sm:px-3 text-sm font-medium text-white underline underline-offset-4 ${WHITE_FOCUS}`}
                >
                  Done
                </button>
              </li>
            </>
          )}
          {full && edit && adding && !row.options && (
            <li>
              <label htmlFor={inputId} className="sr-only">
                Add to {row.label}
              </label>
              <input
                id={inputId}
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKey}
                onBlur={commit}
                list={row.key === 'industries' ? listId : undefined}
                placeholder={row.key === 'locations' ? 'Texas or Canada' : row.key === 'job_titles' ? 'Head of Growth' : 'Type to search'}
                maxLength={80}
                className="h-8 w-48 max-w-full rounded-md max-sm:h-11 border border-white bg-white px-2.5 text-sm text-[#0c1f45] placeholder:text-[#6b7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0063E6]"
              />
              {row.key === 'industries' && industries && (
                <datalist id={listId}>
                  {industries.map((i) => (
                    <option key={i} value={i} />
                  ))}
                </datalist>
              )}
            </li>
          )}
          {full && edit && !adding && values.length < row.max && (
            <li>
              <button
                type="button"
                onClick={openAdd}
                className={`fl-compact inline-flex h-8 max-sm:h-11 items-center gap-1 rounded-md border border-dashed border-white/70 px-2.5 text-sm font-medium text-white transition-colors hover:bg-[#084fba] ${WHITE_FOCUS}`}
                aria-label={`Add to ${row.label}`}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            </li>
          )}
        </ul>
      </dd>
    </div>
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
    if (!text.trim() || refining) return
    onRefine(text.trim())
    setText('')
  }
  return (
    <form onSubmit={submit} className="fl-fade mt-6">
      <label htmlFor={id} className="text-[13px] font-medium text-white">
        Or say what to change
      </label>
      <div className="mt-2 flex h-12 items-center rounded-lg bg-white pl-4 pr-1.5 focus-within:ring-2 focus-within:ring-white focus-within:ring-offset-2 focus-within:ring-offset-[#0063E6]">
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={refining}
          maxLength={500}
          placeholder="Only Texas, add CMOs"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[#1d2025] placeholder:text-[#6b7280] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={refining || !text.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#0063E6] text-white transition-colors hover:bg-[#084fba] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0063E6] disabled:bg-[#b3d7ff]"
          aria-label="Apply change"
        >
          {refining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <p className="mt-2 min-h-5 text-[13px] text-white" role="status">
        {refining ? (slow ? 'Rewriting your profile and recounting. A few more seconds.' : 'Updating your list...') : refineError ?? refineNote ?? ''}
      </p>
    </form>
  )
}

function CountFooter({ full, count, counting, onChange, approved, onApprove }: Props & { full: Icp }) {
  const zero = count === 0 && !counting
  const unknown = count === null && !counting
  // Mobile: the count and Approve stay pinned to the bottom while the long card scrolls.
  const sticky = !zero && !approved ? 'max-sm:sticky max-sm:bottom-0 max-sm:z-10 max-sm:shadow-[0_-8px_24px_rgb(12_31_69/0.18)]' : ''
  return (
    <div className={`border-t border-white/20 bg-[#084fba] px-5 py-4 sm:px-10 sm:py-7 ${sticky}`}>
      <p className="sr-only" aria-live="polite">
        {count === null ? '' : `${formatCount(count)} people match.`}
      </p>
      {zero ? (
        <div className="fl-fade py-2 sm:py-0">
          <p className="text-xl font-semibold tracking-[-0.01em]">Nobody matches all of that yet.</p>
          <p className="mt-1 text-[15px] text-white">Loosen one thing and the list comes back:</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {widenings(full).map((w) => (
              <button
                key={w.label}
                type="button"
                onClick={() => onChange(w.next)}
                className={`min-h-11 rounded-md bg-white px-3.5 text-sm font-semibold text-[#084fba] transition-colors hover:bg-[#f0f7ff] ${WHITE_FOCUS}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 sm:items-end">
          <div className="min-w-0">
            <div className="flex h-9 items-end sm:h-[3.75rem]">
              {count === null ? (
                <span className={`block h-7 w-28 rounded-md sm:h-12 sm:w-44 ${unknown ? 'bg-white/10' : 'fl-sheen'}`} aria-hidden="true" />
              ) : (
                <AnimatedNumber
                  value={count}
                  className={`block text-[2.25rem] font-semibold leading-none tabular-nums tracking-[-0.035em] transition-opacity duration-200 sm:text-6xl ${counting ? 'opacity-60' : ''}`}
                />
              )}
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-white sm:text-[15px]">
              {count === null ? (unknown ? 'Count unavailable right now.' : 'Counting people who fit') : 'people fit this profile.'}
              <span className="hidden sm:inline">{count === null ? '' : ' Your free 25 come from this list.'}</span>
            </p>
          </div>
          <button
            type="button"
            data-fl-approve=""
            onClick={onApprove}
            disabled={approved}
            className={`fl-fade inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-[#084fba] shadow-enterprise-sm transition-[background-color,transform] duration-150 hover:bg-[#f0f7ff] active:scale-[0.98] disabled:cursor-default disabled:bg-white/15 disabled:text-white disabled:shadow-none sm:h-14 sm:px-8 sm:text-lg ${WHITE_FOCUS}`}
          >
            {approved ? <Check className="h-5 w-5" aria-hidden="true" /> : null}
            {approved ? 'Approved' : 'Approve'}
            {approved ? null : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  )
}
