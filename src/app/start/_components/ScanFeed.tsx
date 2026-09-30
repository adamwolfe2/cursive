'use client'

import { Globe, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { Fact, ScanEvent } from '@/lib/free-leads/contract'
import type { ScanInput } from './api'

export type Site = Extract<ScanEvent, { type: 'site' }>
export type ScanError = Extract<ScanEvent, { type: 'error' }>

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]'

/** Left rail: what we are reading, then the findings as they stream in. */
export function ScanFeed({
  query,
  site,
  findings,
  scanning,
  slow,
  error,
  onRetry,
  onReset,
}: {
  query: ScanInput | null
  site: Site | null
  findings: Fact[]
  scanning: boolean
  slow: 0 | 1 | 2
  error: ScanError | null
  onRetry: () => void
  onReset: () => void
}) {
  const domain = site?.domain ?? (query && 'url' in query ? query.url : null)
  const [faviconOk, setFaviconOk] = useState(true)
  const status = scanning ? (findings.length ? 'Working out who buys from you' : domain ? 'Reading your site' : 'Reading your description') : 'What we found'

  return (
    <aside aria-label="What we found" className="min-w-0 lg:sticky lg:top-8 lg:self-start">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
            {site?.favicon && faviconOk ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party favicon, 20px
              <img src={site.favicon} alt="" width={20} height={20} onError={() => setFaviconOk(false)} />
            ) : (
              <Globe className="h-5 w-5 text-[#6b7280]" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-[#1d2025]">{domain ?? 'Your description'}</p>
            <p className="truncate text-[13px] text-[#6b7280]">
              {site?.title ?? (domain ? (scanning ? 'Opening site' : '') : query && 'description' in query ? query.description : '')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={`-mr-2 min-h-11 shrink-0 rounded-md px-2 text-[13px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1d2025] ${FOCUS}`}
        >
          Start over
        </button>
      </div>

      <div className="mt-5 border-t border-[#e5e7eb] pt-5 lg:mt-7">
        <p className="flex items-center gap-2 text-[13px] font-medium text-[#1d2025]" role="status">
          {scanning && <span className="fl-pulse h-1.5 w-1.5 rounded-full bg-[#007AFF]" aria-hidden="true" />}
          {status}
        </p>
        <ol className="mt-4 space-y-4" aria-live="polite" aria-relevant="additions" aria-label="Findings">
          {findings.map((f, i) => (
            <li key={i} className="fl-rise">
              <p className="text-[12px] font-medium text-[#6b7280]">{f.label}</p>
              <p className="mt-0.5 text-[15px] leading-snug text-[#1d2025]">{f.text}</p>
            </li>
          ))}
          {scanning && (
            <li className="space-y-2" aria-hidden="true">
              <div className="fl-sheen-ink h-3 w-24 rounded" />
              <div className="fl-sheen-ink h-4 w-full rounded" />
            </li>
          )}
        </ol>
        {scanning && slow > 0 && (
          <p className="fl-fade mt-5 text-sm leading-snug text-[#4d5460]" role="status">
            {slow === 1
              ? 'Still reading. Bigger sites take a few more seconds.'
              : 'Almost there. We check every page we can open before we guess who buys.'}
          </p>
        )}
        {error && <ScanErrorNote error={error} onRetry={onRetry} />}
      </div>
    </aside>
  )
}

function ScanErrorNote({ error, onRetry }: { error: ScanError; onRetry: () => void }) {
  if (error.code === 'unreachable' || error.code === 'invalid_url') return null
  const limited = error.code === 'rate_limited'
  return (
    <div role="alert" className="mt-5 rounded-lg border border-[#e5e7eb] p-4">
      <p className="text-sm font-medium text-[#1d2025]">
        {limited ? 'You have hit the scan limit for now.' : 'The scan stopped partway.'}
      </p>
      <p className="mt-1 text-sm text-[#4d5460]">
        {limited ? 'Scans reset within the hour. Your place is not lost: come back and paste the same site.' : 'It usually works on a second try.'}
      </p>
      {!limited && (
        <button
          type="button"
          onClick={onRetry}
          className={`-mx-1 mt-2 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-semibold text-[#0063E6] ${FOCUS}`}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}
