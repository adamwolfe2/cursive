'use client'

import { Check, ChevronDown, Globe, History, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Fact, ScanEvent } from '@/lib/free-leads/contract'
import type { ScanInput } from './api'
import { compactChars, groupFacts, pagesSummary, replayLabel, type PageRow } from './scan-state'

export type Site = Extract<ScanEvent, { type: 'site' }>
export type ScanError = Extract<ScanEvent, { type: 'error' }>

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]'

/**
 * Left rail. Every line here is a real scan event: the site we opened, each page as it is fetched and read,
 * then the facts as they land. Everything appends at the bottom so nothing already on screen moves.
 */
export function ScanFeed({
  query,
  site,
  pages,
  facts,
  scanning,
  icpReady = false,
  slow,
  replayedAt,
  onReset,
}: {
  query: ScanInput | null
  site: Site | null
  pages: PageRow[]
  facts: Fact[]
  scanning: boolean
  /** The profile is done: below lg the pages and facts fold behind a one-line summary (if already scrolled past). */
  icpReady?: boolean
  slow: 0 | 1 | 2
  replayedAt: string | null
  onReset: () => void
}) {
  const asideRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(true)
  /** The summary row only exists once the rail has folded, so it never appears above content the reader can see. */
  const [foldable, setFoldable] = useState(false)
  // Phones fold the rail once the profile is ready, but only when it is already scrolled past: folding a rail
  // the reader can see would pull the profile up under them (a layout shift). Desktop never folds.
  useEffect(() => {
    if (!icpReady) {
      setOpen(true)
      setFoldable(false)
      return
    }
    const aside = asideRef.current
    if (aside && !window.matchMedia('(min-width: 1024px)').matches && aside.getBoundingClientRect().bottom <= 0) {
      setOpen(false)
      setFoldable(true)
    }
  }, [icpReady])
  const fromUrl = Boolean(query && 'url' in query)
  const domain = site?.domain ?? (query && 'url' in query ? query.url : null)
  const settled = pagesSummary(pages)
  const showFacts = facts.length > 0 || (scanning && (!fromUrl || settled !== null))

  return (
    <aside ref={asideRef} aria-label="What we read" className="min-w-0 lg:sticky lg:top-8 lg:self-start">
      <SiteHeader site={site} domain={domain} query={query} scanning={scanning} onReset={onReset} />

      <details
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
        className="group"
      >
        <summary
          className={`mt-5 min-h-11 cursor-pointer list-none items-center justify-between gap-3 border-t border-[#e5e7eb] pt-2 text-[14px] font-medium text-[#1d2025] [&::-webkit-details-marker]:hidden ${foldable ? 'flex lg:hidden' : 'hidden'} ${FOCUS}`}
        >
          {readSummary(pages, facts)}
          <ChevronDown className="h-4 w-4 shrink-0 text-[#4d5460] transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
      {fromUrl && (pages.length > 0 || scanning) && (
        <section aria-label="Pages" className="mt-5 border-t border-[#e5e7eb] pt-4">
          <p className="flex h-5 items-center gap-2 text-[13px] font-medium text-[#1d2025]" role="status">
            {/* A replay notice takes this same line, so its arrival never moves anything below. */}
            {replayedAt ? (
              <History className="h-3.5 w-3.5 shrink-0 text-[#0063E6]" aria-hidden="true" />
            ) : settled ? (
              <Check className="h-3.5 w-3.5 text-[#007AFF]" aria-hidden="true" />
            ) : (
              scanning && <LiveDot />
            )}
            {replayedAt ? (
              <span className="truncate text-[#0063E6]">{replayLabel(replayedAt)}</span>
            ) : (
              settled ?? (scanning ? (pages.length ? 'Reading your site' : `Opening ${domain}`) : 'Could not read the site')
            )}
          </p>
          {pages.length > 0 && (
            <ul aria-label="Pages we opened" className="mt-2.5 space-y-1">
              {pages.map((p, i) => (
                <PageLine key={p.path} page={p} first={i === 0} />
              ))}
            </ul>
          )}
        </section>
      )}

      {showFacts && (
        <section aria-label="What we found" className="mt-5 border-t border-[#e5e7eb] pt-4">
          <p className="flex h-5 items-center gap-2 truncate text-[13px] font-medium text-[#1d2025]" role="status">
            {scanning && <LiveDot />}
            {scanning && slow > 0
              ? slow === 1
                ? facts.length
                  ? 'Still working out who buys from you.'
                  : 'Still reading. Bigger sites take longer.'
                : 'Almost there. This one is taking longer than most.'
              : scanning && !facts.length
                ? 'Reading for what you sell and who buys'
                : 'What we found'}
          </p>
          <dl className="mt-3 space-y-3.5" aria-live="polite" aria-relevant="additions">
            {groupFacts(facts).map((g, i) => (
              <div key={`${g.key}-${i}`} className="fl-rise">
                <dt className="text-[12px] font-medium text-[#6b7280]">{g.label}</dt>
                {g.facts.map((f, i) => (
                  <dd key={i} className="fl-rise mt-0.5 text-[14px] leading-snug text-[#1d2025]">
                    {f.text}
                    {f.source === 'site' && (
                      <span className="ml-1.5 whitespace-nowrap text-[11px] font-medium text-[#6b7280]">on your site</span>
                    )}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        </section>
      )}
      </details>
    </aside>
  )
}

/** "What we read: 3 pages, 5 facts" */
function readSummary(pages: PageRow[], facts: Fact[]): string {
  const read = pages.filter((p) => p.state === 'read').length
  const parts = [
    read ? `${read} ${read === 1 ? 'page' : 'pages'}` : null,
    `${facts.length} ${facts.length === 1 ? 'fact' : 'facts'}`,
  ].filter(Boolean)
  return `What we read: ${parts.join(', ')}`
}

function LiveDot() {
  return <span className="fl-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-[#007AFF]" aria-hidden="true" />
}

function SiteHeader({
  site,
  domain,
  query,
  scanning,
  onReset,
}: {
  site: Site | null
  domain: string | null
  query: ScanInput | null
  scanning: boolean
  onReset: () => void
}) {
  const [faviconOk, setFaviconOk] = useState(true)
  const description = site?.description ?? (query && 'description' in query ? query.description : null)
  // The description slot is held while the scan can still fill it; a scan that ended early lets it collapse.
  const hold = scanning || Boolean(site)
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
            {site?.favicon && faviconOk ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party favicon, 20px
              <img src={site.favicon} alt="" width={20} height={20} className="fl-fade" onError={() => setFaviconOk(false)} />
            ) : (
              <Globe className="h-5 w-5 text-[#6b7280]" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-[#1d2025]">{domain ?? 'Your description'}</p>
            {/* Always holds its line so the header never jumps when a scan stops early. */}
            <p className="h-5 truncate text-[13px] text-[#4d5460]">
              {site?.title ? <span className="fl-fade">{site.title}</span> : domain ? (scanning ? 'Opening the homepage' : 'Not opened') : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={`-mr-2 min-h-11 shrink-0 rounded-md px-2 text-[13px] font-medium text-[#4d5460] transition-colors hover:bg-[#f3f4f6] hover:text-[#1d2025] ${FOCUS}`}
        >
          Start over
        </button>
      </div>
      {/* Two lines reserved so the description landing never pushes the page list. */}
      {(hold || description) && (
        <p className="mt-2.5 line-clamp-2 min-h-10 text-[13px] leading-5 text-[#6b7280]">
          {description && <span className="fl-fade">{description}</span>}
        </p>
      )}
    </div>
  )
}

function PageLine({ page, first }: { page: PageRow; first: boolean }) {
  const label = page.path === '/' ? 'Homepage' : page.path
  return (
    <li
      {...(first ? { 'data-fl-progress': '' } : {})}
      className="fl-rise grid h-6 grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-2 text-[13px]"
    >
      {page.state === 'fetching' && (
        <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[#b3d7ff] border-t-[#007AFF]" aria-hidden="true" />
      )}
      {page.state === 'read' && <Check className="h-3.5 w-3.5 text-[#007AFF]" aria-hidden="true" />}
      {page.state === 'failed' && <X className="h-3.5 w-3.5 text-[#a0a5b1]" aria-hidden="true" />}
      <span className={`truncate ${page.state === 'failed' ? 'text-[#6b7280]' : 'text-[#1d2025]'}`}>{label}</span>
      <span className="text-[12px] tabular-nums text-[#6b7280]">
        {page.state === 'fetching' && 'reading'}
        {page.state === 'read' && (page.chars !== null ? `${compactChars(page.chars)} chars` : 'read')}
        {page.state === 'failed' && "couldn't open"}
      </span>
    </li>
  )
}

/** Shown in the main column, where the profile would have been. */
export function ScanErrorNote({ error, onRetry }: { error: ScanError; onRetry: () => void }) {
  if (error.code === 'unreachable' || error.code === 'invalid_url') return null
  const limited = error.code === 'rate_limited'
  return (
    <div role="alert" className="fl-rise rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-5 py-7 sm:px-10 sm:py-9">
      <h2 className="text-xl font-semibold tracking-[-0.015em] text-[#111318] sm:text-2xl">
        {limited ? 'That is the scan limit for now.' : 'The scan stopped partway.'}
      </h2>
      <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-[#4d5460]">
        {limited
          ? `${error.message} Nothing is lost: paste the same site when you are back.`
          : 'Nothing you did. It usually works on a second try.'}
      </p>
      {!limited && (
        <button
          type="button"
          onClick={onRetry}
          className={`mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0063E6] px-4 text-[15px] font-semibold text-white transition-colors hover:bg-[#084fba] ${FOCUS}`}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}
