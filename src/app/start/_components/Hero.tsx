'use client'

import { ArrowRight, Globe, Info } from 'lucide-react'
import { useId, type FormEvent, type RefObject } from 'react'
import { MIN_DESCRIPTION } from './api'

export type InputMode = 'url' | 'description'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]'

export function Hero({
  mode,
  setMode,
  value,
  setValue,
  inputError,
  notice,
  onSubmit,
  inputRef,
}: {
  mode: InputMode
  setMode: (m: InputMode) => void
  value: string
  setValue: (v: string) => void
  inputError: string | null
  notice: string | null
  onSubmit: (e: FormEvent) => void
  inputRef: RefObject<HTMLInputElement & HTMLTextAreaElement | null>
}) {
  const id = useId()
  const errId = useId()
  const hintId = useId()
  const short = MIN_DESCRIPTION - value.trim().length
  const button = (
    <button
      type="submit"
      className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007AFF] px-5 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#0063E6] active:scale-[0.98] ${FOCUS}`}
    >
      Find my buyers
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  )
  const describedBy = [inputError ? errId : null, mode === 'description' ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <section className="pb-20 pt-10 sm:pb-28 sm:pt-20 lg:pt-24">
      <h1 className="max-w-[15ch] text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.045em] text-[#111318] min-[400px]:text-[2.75rem] sm:text-[4.25rem] lg:text-[5.25rem]">
        {mode === 'url' ? 'Paste your website.' : 'Tell us what you sell.'}{' '}
        <span className="text-[#6b7280]">Meet 25 people who should buy from you.</span>
      </h1>
      <p className="mt-5 max-w-[54ch] text-[17px] leading-relaxed text-[#4d5460] sm:mt-8 sm:text-lg">
        {mode === 'url'
          ? 'We read your site, work out who buys from you, and find them. Real names, titles, and work emails. Free, in about a minute.'
          : 'From a few lines on what you sell, we work out who buys from you and find them. Real names, titles, and work emails. Free.'}
      </p>

      <form onSubmit={onSubmit} className="mt-9 max-w-2xl sm:mt-12" noValidate>
        {notice && (
          <p role="status" className="fl-fade mb-6 flex gap-2.5 rounded-xl bg-[#f0f7ff] px-4 py-3.5 text-[15px] leading-snug text-[#0c1f45]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0063E6]" aria-hidden="true" />
            {notice}
          </p>
        )}
        <label htmlFor={id} className="text-sm font-medium text-[#1d2025]">
          {mode === 'url' ? 'Your website' : 'What you sell, and who buys it'}
        </label>
        {mode === 'url' ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0 sm:rounded-xl sm:border-[1.5px] sm:border-[#1d2025] sm:bg-white sm:p-1.5 sm:pl-4 sm:focus-within:border-[#007AFF] sm:focus-within:ring-4 sm:focus-within:ring-[#007AFF]/15">
            <div className="flex h-14 shrink-0 items-center gap-3 sm:flex-1 rounded-xl border-[1.5px] border-[#1d2025] px-4 focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/15 sm:h-12 sm:rounded-none sm:border-0 sm:px-0 sm:focus-within:ring-0">
              <Globe className="h-5 w-5 shrink-0 text-[#6b7280]" aria-hidden="true" />
              <input
                ref={inputRef}
                id={id}
                type="text"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                maxLength={2048}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="acme.com"
                aria-invalid={inputError ? true : undefined}
                aria-describedby={describedBy}
                className="h-full min-w-0 flex-1 bg-transparent text-lg text-[#111318] placeholder:text-[#a0a5b1] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            {button}
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <textarea
              ref={inputRef}
              id={id}
              rows={4}
              autoFocus
              maxLength={4000}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit()
              }}
              placeholder="We run bookkeeping for dental practices with 2 to 10 locations. Owners and office managers usually sign."
              aria-invalid={inputError ? true : undefined}
              aria-describedby={describedBy}
              className="block w-full resize-none rounded-xl border-[1.5px] border-[#1d2025] bg-white px-4 py-3.5 text-base leading-relaxed text-[#111318] placeholder:text-[#a0a5b1] focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15"
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p id={hintId} className="text-[13px] tabular-nums text-[#6b7280]">
                {short > 0 ? `A sentence or two is plenty. ${short} more characters.` : 'Looks good.'}
              </p>
              {button}
            </div>
          </div>
        )}
        <p id={errId} role="alert" className="mt-2 min-h-5 text-sm text-[#b91c1c]">
          {inputError}
        </p>
        <div className="mt-2 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setMode(mode === 'url' ? 'description' : 'url')}
            className={`-my-2 self-start py-2 font-medium text-[#0063E6] underline decoration-[#b3d7ff] underline-offset-4 transition-colors hover:decoration-[#0063E6] ${FOCUS}`}
          >
            {mode === 'url' ? 'No website? Describe what you sell' : 'Use my website instead'}
          </button>
          <p className="text-[#6b7280]">No card. No sales call. The 25 are yours.</p>
        </div>
      </form>

      <ExampleRows />
    </section>
  )
}

/** Static peek at the output so the promise is concrete before anyone types. */
function ExampleRows() {
  const rows = [
    ['Rachel J.', 'VP of Engineering', 'Ledgerline', 'r•••@ledgerline.com', 'Runs engineering at a 120-person fintech that just signed its first bank.'],
    ['Marcus O.', 'CTO', 'Shipfast', 'm•••@shipfast.dev', 'CTO at a Series A dev tools company hiring its first security lead.'],
    ['Priya R.', 'Head of Security', 'Northwind Health', 'p•••@northwindhealth.io', 'Owns vendor reviews at a health company selling into hospitals.'],
  ]
  return (
    <figure className="mt-16 max-w-3xl sm:mt-24" aria-label="Example of the leads you get">
      <figcaption className="text-[13px] font-medium text-[#6b7280]">What lands in your list (example)</figcaption>
      <ul
        className="mt-3 divide-y divide-[#f3f4f6] overflow-hidden rounded-lg border border-[#e5e7eb] text-sm [mask-image:linear-gradient(to_bottom,black_45%,transparent)]"
        aria-hidden="true"
      >
        {rows.map(([name, title, company, email, why]) => (
          <li key={name} className="grid gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[8rem_1fr_1fr_minmax(0,13rem)]">
            <span className="font-semibold text-[#1d2025]">{name}</span>
            <span className="text-[#4d5460]">
              {title}
              <span className="sm:hidden">, {company}</span>
            </span>
            <span className="hidden text-[#4d5460] sm:block">{company}</span>
            <span className="truncate text-[13px] text-[#3a3f4b]">{email}</span>
            <span className="text-[13px] leading-snug text-[#3a3f4b] sm:col-span-full">
              <span className="mr-1.5 font-semibold text-[#0063E6]">Why them</span>
              {why}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
