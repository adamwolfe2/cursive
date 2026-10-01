'use client'

import { ArrowRight, Download, Globe, Info, Mail, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { useId, type FormEvent, type RefObject } from 'react'
import { MIN_DESCRIPTION } from './api'
import { HeroDemo } from './HeroDemo'
import { STEPS } from './Steps'

export type InputMode = 'url' | 'description'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]'
/** Shared with the scan view's site header: on submit the field morphs into it (View Transitions). */
const MORPH = { viewTransitionName: 'fl-site' } as const

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
      className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-6 text-[16px] font-semibold text-white shadow-[0_8px_20px_-8px_rgb(0_99_230/0.6)] transition-[background-color,transform] duration-150 hover:bg-[#0066DD] active:scale-[0.98] ${FOCUS}`}
    >
      Find my buyers
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  )
  const describedBy = [inputError ? errId : null, mode === 'description' ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <>
      <section className="grid grid-cols-[minmax(0,1fr)] gap-12 pb-16 pt-6 sm:pt-12 lg:grid-cols-[minmax(0,29rem)_minmax(0,1fr)] lg:items-start lg:gap-14 lg:pb-24 lg:pt-14">
        <div className="min-w-0">
          <h1 className="text-[2.75rem] font-light leading-[1.02] tracking-[-0.02em] text-[#111827] sm:text-[4rem] lg:text-[4.25rem]">
            {mode === 'url' ? 'Your site in.' : 'What you sell in.'} <span className="fl-script fl-write mt-1 block pb-1 text-[3.5rem] leading-[1] text-[#007AFF] sm:text-[5rem] lg:text-[5.5rem]">25 buyers out.</span>
          </h1>
          <p className="mt-5 max-w-[40ch] text-[17px] leading-relaxed text-[#4b5563] sm:mt-6 sm:text-lg">
            {mode === 'url'
              ? 'We read your site, work out who buys, and find 25 people who fit, with work emails. Free, about a minute.'
              : 'Tell us what you sell and who buys it. We find 25 people who fit, with work emails. Free, about a minute.'}
          </p>

          <form onSubmit={onSubmit} className="mt-8 sm:mt-10" noValidate>
            {notice && (
              <p role="status" className="fl-fade mb-6 flex gap-2.5 rounded-xl bg-[#f0f7ff] px-4 py-3.5 text-[15px] leading-snug text-[#0c1f45]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0066DD]" aria-hidden="true" />
                {notice}
              </p>
            )}
            <label htmlFor={id} className="text-sm font-medium text-[#111827]">
              {mode === 'url' ? 'Your website' : 'What you sell, and who buys it'}
            </label>
            {mode === 'url' ? (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0 sm:rounded-2xl sm:border sm:border-[#d1d5db] sm:bg-white sm:p-1.5 sm:pl-4 sm:shadow-[0_12px_32px_-18px_rgb(12_31_69/0.35)] sm:transition-shadow sm:focus-within:border-[#007AFF] sm:focus-within:ring-4 sm:focus-within:ring-[#007AFF]/15">
                <div
                  style={MORPH}
                  className="flex h-14 shrink-0 items-center gap-3 rounded-xl border border-[#d1d5db] bg-white px-4 focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/15 sm:h-12 sm:flex-1 sm:rounded-none sm:border-0 sm:px-0 sm:focus-within:ring-0"
                >
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
                    placeholder="yourcompany.com"
                    aria-invalid={inputError ? true : undefined}
                    aria-describedby={describedBy}
                    className="h-full min-w-0 flex-1 bg-transparent text-lg text-[#111827] placeholder:text-[#6b7280] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
                  style={MORPH}
                  className="block w-full resize-none rounded-xl border border-[#d1d5db] bg-white px-4 py-3.5 text-base leading-relaxed text-[#111827] placeholder:text-[#6b7280] focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15"
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
            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm">
              <button
                type="button"
                onClick={() => setMode(mode === 'url' ? 'description' : 'url')}
                className={`-ml-1 min-h-11 rounded-md px-1 font-medium text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 transition-colors hover:decoration-[#007AFF] ${FOCUS}`}
              >
                {mode === 'url' ? 'No website? Describe what you sell' : 'Use my website instead'}
              </button>
              <p className="text-[#4b5563]">Free. No card, no sales call.</p>
            </div>
          </form>
        </div>

        <HeroDemo held={value.trim().length > 0} />
      </section>

      <WhatYouGet />
      <HowItWorks onStart={() => inputRef.current?.focus({ preventScroll: true })} />
    </>
  )
}

const GETS: Array<[LucideIcon, string, string]> = [
  [Users, '25 people', 'Picked for what you sell, not pulled off a generic list.'],
  [Mail, 'Name, title, work email', 'Plus company, location and LinkedIn when we have it.'],
  [Sparkles, 'A reason for each one', 'One line on why this person fits, written from your site.'],
  [Download, 'Yours to keep', 'In your own Cursive workspace, and as a CSV. No card, no sales call.'],
]

function WhatYouGet() {
  return (
    <section aria-labelledby="get-heading" className="py-12 sm:py-16">
      <h2 id="get-heading" className="sr-only">
        What you get
      </h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {GETS.map(([Icon, term, detail], i) => (
          <div
            key={term}
            style={{ animationDelay: `${i * 70}ms` }}
            className="fl-rise fl-card group rounded-xl border border-[#e5e7eb] bg-white p-6"
          >
            <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-lg bg-[#f3f4f6] text-[#374151] transition-colors duration-200 group-hover:bg-[#e8f1ff] group-hover:text-[#007AFF]">
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <dt className="mt-4 text-[17px] text-[#111827]">{term}</dt>
            <dd className="mt-1.5 text-[15px] leading-relaxed text-[#4b5563]">{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const HOW: Record<(typeof STEPS)[number], string> = {
  'Read your site': 'We open your homepage and a few pages behind it, and note what you sell and who it is for.',
  'Approve your buyers': 'You see the buyer profile: titles, industries, company size, places. Change any of it in plain words.',
  'Check your inbox': 'We send a sign-in link to your work email. One free list per company.',
  'Open your list': 'Your 25, each with a name, title, work email and why they fit. Download it as a CSV.',
}

function HowItWorks({ onStart }: { onStart: () => void }) {
  return (
    <section
      aria-labelledby="how-heading"
      className="grid grid-cols-[minmax(0,1fr)] gap-10 rounded-3xl bg-[#F7F9FB] px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16 lg:px-14"
    >
      <div className="lg:sticky lg:top-24 lg:self-start">
        <h2 id="how-heading" className="text-[2rem] font-light leading-[1.08] tracking-[-0.02em] text-[#111827] sm:text-[2.5rem]">
          About a minute,
          <span className="fl-script block pt-1 text-[2.75rem] leading-[1.05] text-[#6b7280] sm:text-[3.25rem]">start to list.</span>
        </h2>
        <p className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-[#4b5563]">
          You stay in charge of who counts as a buyer. Nothing is sent to anyone on your behalf.
        </p>
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
            onStart()
          }}
          className={`mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-[#007AFF] px-6 text-[16px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#0066DD] active:scale-[0.98] ${FOCUS}`}
        >
          Find my buyers
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <ol className="relative">
        {STEPS.map((label, i) => (
          <li key={label} className="fl-step relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-5 pb-10 last:pb-0">
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="absolute bottom-0 left-[1.1875rem] top-11 w-0.5 overflow-hidden rounded-full bg-[#d6e4f7]">
                <span className="fl-step-line block h-full w-full bg-[#007AFF]" />
              </span>
            )}
            <span
              aria-hidden="true"
              className="fl-step-num grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-[#007AFF] bg-white text-[15px] font-semibold tabular-nums text-[#0066DD]"
            >
              {i + 1}
            </span>
            <div className="pt-1.5">
              <h3 className="text-[19px] font-medium tracking-[-0.01em] text-[#111827]">{label}</h3>
              <p className="mt-1.5 max-w-[46ch] text-[15px] leading-relaxed text-[#4b5563]">{HOW[label]}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
