'use client'

import { ArrowDown, ArrowRight, Loader2, Plus, X } from 'lucide-react'
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
  onPreview: () => void
  previewLoading: boolean
  previewOpen: boolean
  previewError: string | null
}

export function IcpCard(props: Props) {
  const { icp, complete, count, counting, onChange } = props
  const full = complete ? (icp as Icp) : null

  return (
    <section
      aria-labelledby="icp-heading"
      className="fl-rise overflow-clip rounded-xl bg-[#0063E6] text-white shadow-enterprise-md"
    >
      <div className="px-5 pb-6 pt-6 sm:px-10 sm:pt-9">
        <h2 id="icp-heading" className="flex items-center gap-2 text-sm font-medium text-white">
          {!complete && <span className="fl-pulse h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />}
          {complete ? 'Who buys from you' : 'Working out who buys from you'}
        </h2>
        {icp.summary ? (
          <p className="fl-fade mt-3 max-w-[36ch] text-[1.625rem] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[2.125rem]">
            {icp.summary}
          </p>
        ) : (
          <div className="mt-4 space-y-3" aria-hidden="true">
            <div className="fl-sheen h-7 w-11/12 rounded-md" />
            <div className="fl-sheen h-7 w-2/3 rounded-md" />
          </div>
        )}

        <dl className="mt-8 divide-y divide-white/15 border-y border-white/15">
          {ROWS.map((row) => (
            <IcpRow key={row.key} row={row} icp={icp} full={full} onChange={onChange} />
          ))}
        </dl>

        <RefineBox {...props} disabled={!full} />
      </div>

      <CountFooter {...props} full={full} count={count} counting={counting} />
    </section>
  )
}

function IcpRow({
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
  const values = valuesFor(icp, row.key)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [industries, setIndustries] = useState<readonly string[] | null>(null)
  const inputId = useId()
  const listId = useId()

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

  const remaining = row.options?.filter((o) => !values?.includes(o)) ?? []

  return (
    <div className="grid gap-2 py-3.5 sm:grid-cols-[9rem_1fr] sm:gap-6">
      <dt className="pt-1.5 text-[13px] font-medium text-white">{row.label}</dt>
      <dd className="min-h-9">
        {values === undefined ? (
          <div className="flex gap-2 pt-0.5" aria-hidden="true">
            <div className="fl-sheen h-8 w-28 rounded-md" />
            <div className="fl-sheen h-8 w-20 rounded-md" />
            <div className="fl-sheen hidden h-8 w-32 rounded-md sm:block" />
          </div>
        ) : (
          <ul className="fl-fade flex flex-wrap items-center gap-2" aria-label={row.label}>
            {values.length === 0 && !adding && <li className="py-1.5 text-sm text-white">Any</li>}
            {values.map((v) => (
              <li
                key={v}
                className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-md bg-white py-1 pl-2.5 pr-1 text-sm font-medium leading-tight text-[#0c1f45]"
              >
                <span className="min-w-0 [overflow-wrap:anywhere]">{chipLabel(row.key, v)}</span>
                <button
                  type="button"
                  disabled={!full}
                  onClick={() => full && onChange(withRemoved(full, row.key, v))}
                  className="fl-compact grid h-6 w-6 shrink-0 place-items-center rounded text-[#0063E6] transition-colors hover:bg-[#f0f7ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0c1f45] disabled:opacity-40"
                  aria-label={`Remove ${chipLabel(row.key, v)}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
            {full && adding && row.options && (
              <>
                {remaining.map((o) => (
                  <li key={o}>
                    <button
                      type="button"
                      onClick={() => onChange(withAdded(full, row.key, o))}
                      className="fl-compact h-8 rounded-md border border-dashed border-white/70 px-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      + {chipLabel(row.key, o)}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    className="fl-compact h-8 px-2 text-sm font-medium text-white underline underline-offset-4"
                  >
                    Done
                  </button>
                </li>
              </>
            )}
            {full && adding && !row.options && (
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
                  className="h-8 w-48 max-w-full rounded-md border border-white bg-white px-2.5 text-sm text-[#0c1f45] placeholder:text-[#6b7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0063E6]"
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
            {full && !adding && values.length < row.max && (
              <li>
                <button
                  type="button"
                  onClick={openAdd}
                  className="fl-compact inline-flex h-8 items-center gap-1 rounded-md border border-dashed border-white/70 px-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label={`Add to ${row.label}`}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add
                </button>
              </li>
            )}
          </ul>
        )}
      </dd>
    </div>
  )
}

function RefineBox({
  refining,
  refineNote,
  refineError,
  onRefine,
  disabled,
}: Props & { disabled: boolean }) {
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
    <form onSubmit={submit} className="mt-7">
      <label htmlFor={id} className="text-[13px] font-medium text-white">
        Change anything in plain English
      </label>
      <div className="mt-2 flex h-12 items-center rounded-lg bg-white pl-4 pr-1.5 focus-within:ring-2 focus-within:ring-white focus-within:ring-offset-2 focus-within:ring-offset-[#0063E6]">
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || refining}
          maxLength={500}
          placeholder="Only Texas, add CMOs"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[#1d2025] placeholder:text-[#6b7280] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || refining || !text.trim()}
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

function CountFooter({
  full,
  count,
  counting,
  onChange,
  onPreview,
  previewLoading,
  previewOpen,
  previewError,
}: Props & { full: Icp | null }) {
  const zero = full && count === 0 && !counting
  const unknown = count === null && full && !counting
  // Mobile: the count and the next step stay pinned to the bottom while the long card scrolls.
  const sticky = full && !zero && !previewOpen ? 'max-sm:sticky max-sm:bottom-0 max-sm:z-10' : ''
  return (
    <div className={`border-t border-white/15 bg-[#084fba] px-5 py-4 sm:px-10 sm:py-7 ${sticky}`}>
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
                className="min-h-11 rounded-md bg-white px-3.5 text-sm font-semibold text-[#084fba] transition-colors hover:bg-[#f0f7ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            {count === null ? (
              <div className={`h-10 w-32 rounded-md sm:h-[3.75rem] sm:w-44 ${unknown ? 'bg-white/10' : 'fl-sheen'}`} aria-hidden="true" />
            ) : (
              <AnimatedNumber
                value={count}
                className={`block text-4xl font-semibold tabular-nums tracking-[-0.035em] transition-opacity duration-200 sm:text-6xl sm:leading-none ${counting ? 'opacity-60' : ''}`}
              />
            )}
            <p className="mt-1 text-[13px] leading-snug text-white sm:mt-1.5 sm:text-[15px]">
              {count === null
                ? unknown
                  ? 'Count unavailable right now.'
                  : 'Counting people who fit'
                : 'people fit this.'}
              <span className="hidden sm:inline">{count === null ? '' : ' Your free 25 come from this list.'}</span>
            </p>
          </div>
          {!previewOpen && (
            <button
              type="button"
              onClick={onPreview}
              disabled={!full || previewLoading || (counting && count === null)}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-[15px] font-semibold text-[#084fba] shadow-enterprise-sm transition-[background-color,transform] duration-150 hover:bg-[#f0f7ff] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60 sm:px-5"
            >
              {previewLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              )}
              See 5 of them
            </button>
          )}
        </div>
      )}
      {previewError && (
        <p role="alert" className="mt-3 text-sm font-medium text-white">
          {previewError}
        </p>
      )}
    </div>
  )
}
