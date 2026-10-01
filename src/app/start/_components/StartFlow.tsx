'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import type {
  CountResponse,
  Fact,
  Icp,
  MaskedLead,
  Persona,
  PreviewResponse,
  RefineResponse,
  ScanEvent,
} from '@/lib/free-leads/contract'
import { errorCopy, isAbort, MIN_DESCRIPTION, postJson, streamScan, trackStep, type Mock, type ScanInput } from './api'
import { EmailProfile } from './EmailProfile'
import { Hero, type InputMode } from './Hero'
import { IcpCard } from './IcpCard'
import { describeChange } from './icp-edit'
import type { CountDelta } from './MarketPanel'
import { PersonaCard } from './PersonaCard'
import { ClaimForm, PreviewTable } from './Preview'
import { ScanErrorNote, ScanFeed, type ScanError, type Site } from './ScanFeed'
import { withPage, type PageRow } from './scan-state'

const SLOW_AFTER_MS = [12_000, 25_000] as const
const NOT_A_SITE = "That doesn't look like a website. Try something like acme.com."

/**
 * acme.com, https://www.acme.com/about?x=1#top, acme.com:8080 -> "acme.com" / "www.acme.com/about";
 * null if it can't be a site. Port, query and hash are dropped (the server scans the origin).
 * IDN hosts come back in their ASCII (xn--) form.
 */
export function normalizeUrl(raw: string): string | null {
  const v = raw.trim()
  if (!v || /\s/.test(v)) return null
  const candidate = /^https?:\/\//i.test(v) ? v : `https://${v}`
  if (!URL.canParse(candidate)) return null
  const url = new URL(candidate)
  if (!/^([a-z0-9-]+\.)+([a-z]{2,}|xn--[a-z0-9-]+)$/i.test(url.hostname)) return null
  return url.hostname + url.pathname.replace(/\/+$/, '')
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Hero <-> scan view: the site field morphs into the scan header (both carry view-transition-name fl-site). */
function morph(update: () => void) {
  if (typeof document.startViewTransition !== 'function' || reducedMotion()) return update()
  document.startViewTransition(() => flushSync(update))
}

/** `initialSite` comes from `/start?site=acme.com` (links in the profile email) and starts the scan on load. */
export function StartFlow({ mock, initialSite }: { mock: Mock; initialSite: string | null }) {
  const autoUrl = initialSite ? normalizeUrl(initialSite) : null
  const [mode, setMode] = useState<InputMode>('url')
  const [value, setValue] = useState(initialSite && !autoUrl ? initialSite : '')
  const [inputError, setInputError] = useState<string | null>(initialSite && !autoUrl ? NOT_A_SITE : null)
  /** Not an error: why we are asking for a description instead of a site. */
  const [notice, setNotice] = useState<string | null>(null)
  /** The site we could not open; kept so the claim still has a website after a description scan. */
  const [fallbackDomain, setFallbackDomain] = useState<string | null>(null)

  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>(autoUrl ? 'scanning' : 'idle')
  const [query, setQuery] = useState<ScanInput | null>(autoUrl ? { url: autoUrl } : null)
  const [site, setSite] = useState<Site | null>(null)
  const [pages, setPages] = useState<PageRow[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [replayedAt, setReplayedAt] = useState<string | null>(null)
  const [icp, setIcp] = useState<Partial<Icp>>({})
  const [complete, setComplete] = useState(false)
  /** Best effort, after `count`; may never arrive. */
  const [persona, setPersona] = useState<Persona | null>(null)
  const [scanError, setScanError] = useState<ScanError | null>(null)
  const [slow, setSlow] = useState<0 | 1 | 2>(0)

  const [count, setCount] = useState<number | null>(null)
  /** How the reader's last edit moved the count ("+1,240 since you added Texas"). */
  const [delta, setDelta] = useState<CountDelta | null>(null)
  const [counting, setCounting] = useState(false)
  const [refining, setRefining] = useState(false)
  const [refineNote, setRefineNote] = useState<string | null>(null)
  const [refineError, setRefineError] = useState<string | null>(null)
  /** The reader changed the scanned profile (chips or refine). The emailed profile is always the scanned one. */
  const [edited, setEdited] = useState(false)

  const [approved, setApproved] = useState(false)
  const [preview, setPreview] = useState<MaskedLead[] | null>(null)
  const [previewTotal, setPreviewTotal] = useState<number | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  /** One controller per scan session: aborting it cancels the stream and every count/refine/preview call. */
  const sessionRef = useRef<AbortController | null>(null)
  /** Bumped by every count source (edit, refine, new scan); a response only lands if its seq is still current. */
  const countSeq = useRef(0)
  /** countSeq when the scan started: the stream's late `count` only applies while no edit has happened since. */
  const scanCountSeq = useRef(0)
  const refineSeq = useRef(0)
  const countTimer = useRef<number | undefined>(undefined)
  const previewSeq = useRef(0)
  /** The settled count before the pending edit(s) and what they changed; folded into `delta` when the count lands. */
  const pendingRef = useRef<{ base: number; reasons: string[] } | null>(null)
  const claimRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  /** Phones: glide to the profile when it starts, unless the reader has scrolled on their own. */
  const followRef = useRef(false)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  /** The results heading takes keyboard focus when the hero (and its input) unmounts. */
  const headingRef = useRef<HTMLHeadingElement>(null)

  const endSession = () => {
    sessionRef.current?.abort()
    window.clearTimeout(countTimer.current)
    countSeq.current++
    refineSeq.current++
    previewSeq.current++
  }

  useEffect(() => endSession, [])

  const scanning = phase === 'scanning' && !complete
  useEffect(() => {
    if (!scanning) return
    const stop = () => {
      followRef.current = false
    }
    const events = ['wheel', 'touchmove', 'keydown'] as const
    events.forEach((ev) => window.addEventListener(ev, stop, { passive: true }))
    return () => events.forEach((ev) => window.removeEventListener(ev, stop))
  }, [scanning])

  useEffect(() => {
    if (!scanning) return
    const timers = SLOW_AFTER_MS.map((ms, i) => window.setTimeout(() => setSlow((i + 1) as 1 | 2), ms))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [scanning])

  const toHero = (nextMode: InputMode, message: string | null, nextNotice: string | null = null) => {
    endSession()
    setPhase('idle')
    setMode(nextMode)
    setValue('')
    setInputError(message)
    setNotice(nextNotice)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const onEvent = (e: ScanEvent, input: ScanInput) => {
    switch (e.type) {
      case 'replay':
        return setReplayedAt(e.scanned_at)
      case 'page':
        return setPages((p) => withPage(p, e))
      case 'site':
        return setSite(e)
      case 'fact':
        return setFacts((f) => [...f, e.fact])
      case 'icp_partial':
        if (followRef.current) {
          followRef.current = false
          if (window.matchMedia('(max-width: 1023px)').matches) {
            requestAnimationFrame(() =>
              cardRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
            )
          }
        }
        return setIcp((prev) => ({ ...prev, ...e.icp }))
      case 'icp':
        setIcp(e.icp)
        setComplete(true)
        return
      case 'count':
        // Counts the scanned profile; once the reader has edited it, the edit's own count wins.
        if (countSeq.current !== scanCountSeq.current) return
        return setCount(e.total)
      case 'error':
        // Unreachable site or bad input: back to the hero with a specific next step.
        if (e.code === 'unreachable' && 'url' in input) {
          setFallbackDomain(input.url)
          return toHero('description', null, `We couldn't open ${input.url}. Tell us what you sell and who buys it, and we will work from that instead.`)
        }
        if (e.code === 'invalid_url') {
          return 'url' in input
            ? toHero('url', NOT_A_SITE)
            : toHero('description', `Tell us a bit more: at least ${MIN_DESCRIPTION} characters on what you sell and who buys it.`)
        }
        return setScanError(e)
      case 'persona':
        // Drop a malformed persona rather than render half a person.
        if (!e.persona?.name || !Array.isArray(e.persona.measured_on)) return
        return setPersona(e.persona)
      case 'done':
        return
    }
  }

  const run = async (input: ScanInput) => {
    endSession()
    scanCountSeq.current = countSeq.current
    const ctrl = new AbortController()
    sessionRef.current = ctrl
    setQuery(input)
    setPhase('scanning')
    setSite(null)
    setPages([])
    setFacts([])
    setReplayedAt(null)
    followRef.current = true
    setIcp({})
    setComplete(false)
    setPersona(null)
    setScanError(null)
    setSlow(0)
    setCount(null)
    setDelta(null)
    pendingRef.current = null
    setCounting(false)
    setRefining(false)
    setRefineNote(null)
    setRefineError(null)
    setEdited(false)
    setApproved(false)
    setPreview(null)
    setPreviewTotal(null)
    setPreviewError(null)
    window.scrollTo({ top: 0 })
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))

    let finalIcp: Icp | null = null
    let gotCount = false
    let gotError = false
    try {
      await streamScan(
        input,
        (e) => {
          if (ctrl.signal.aborted) return
          if (e.type === 'icp') finalIcp = e.icp
          if (e.type === 'count') gotCount = true
          if (e.type === 'error') gotError = true
          onEvent(e, input)
        },
        ctrl.signal,
        mock
      )
    } catch (err) {
      if (ctrl.signal.aborted || isAbort(err)) return
      console.error('[start] scan stream failed', err)
    }
    if (ctrl.signal.aborted) return
    if (!finalIcp && !gotError) {
      // Stream closed without a result (timeout, dropped connection).
      setScanError({ type: 'error', code: 'failed', message: 'The scan stopped partway.' })
    }
    // The scan's own count is best effort; fetch it if it never arrived.
    if (finalIcp && !gotCount && countSeq.current === scanCountSeq.current) recount(finalIcp, 0)
    setPhase((p) => (p === 'idle' ? 'idle' : 'done'))
  }

  // `/start?site=acme.com`: start straight away. Runs once; run() aborts any earlier stream (StrictMode remounts).
  useEffect(() => {
    if (autoUrl) void run({ url: autoUrl })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'url') {
      const url = normalizeUrl(value)
      if (!url) return setInputError(NOT_A_SITE)
      setInputError(null)
      setFallbackDomain(null)
      morph(() => void run({ url }))
    } else {
      const description = value.trim()
      if (description.length < MIN_DESCRIPTION) {
        return setInputError('Give us a sentence or two: what you sell and who usually buys it.')
      }
      if (description.length > 4000) return setInputError('Keep it under 4,000 characters. A short paragraph is plenty.')
      setInputError(null)
      morph(() => void run({ description }))
    }
  }

  /** Remember what an edit changed, against the last count the reader actually saw. */
  const noteChange = (prev: Partial<Icp>, next: Icp) => {
    const reason = describeChange(prev, next)
    const p = pendingRef.current
    if (p) pendingRef.current = { ...p, reasons: [...p.reasons, reason] }
    else if (count !== null) pendingRef.current = { base: count, reasons: [reason] }
  }

  const landCount = (total: number) => {
    const p = pendingRef.current
    pendingRef.current = null
    setCount(total)
    setDelta(
      p && total !== p.base
        ? { diff: total - p.base, reason: p.reasons.length === 1 ? p.reasons[0] : `since your last ${p.reasons.length} changes` }
        : null
    )
  }

  const recount = (next: Icp, delay = 400) => {
    window.clearTimeout(countTimer.current)
    const seq = ++countSeq.current
    const signal = sessionRef.current?.signal
    setCounting(true)
    countTimer.current = window.setTimeout(async () => {
      try {
        const r = await postJson<CountResponse>('/api/start/count', { icp: next }, mock, signal)
        if (seq === countSeq.current) landCount(r.total)
      } catch (err) {
        if (isAbort(err)) return
        console.error('[start] count failed', err)
        if (seq === countSeq.current) {
          // The old total described a different profile: show "unavailable" and keep Approve blocked.
          pendingRef.current = null
          setDelta(null)
          setCount(null)
          setRefineError(`${errorCopy(err, 'One of those filters is not valid. Remove it and try again.')} Your changes are kept.`)
        }
      } finally {
        if (seq === countSeq.current) setCounting(false)
      }
    }, delay)
  }

  /** Any edit after approval re-opens the decision: the preview and claim must match what was approved. */
  const unapprove = () => {
    previewSeq.current++
    setApproved(false)
    setPreview(null)
    setPreviewTotal(null)
  }

  const onChange = (next: Icp) => {
    noteChange(icp, next)
    setIcp(next)
    setEdited(true)
    setRefineNote(null)
    setRefineError(null)
    unapprove()
    recount(next)
  }

  const onRefine = async (instruction: string) => {
    if (!complete || refining) return
    window.clearTimeout(countTimer.current)
    const seq = ++countSeq.current
    const own = ++refineSeq.current
    setRefining(true)
    setCounting(true)
    setRefineError(null)
    setRefineNote(null)
    try {
      const r = await postJson<RefineResponse>('/api/start/refine', { icp, instruction }, mock, sessionRef.current?.signal)
      // A chip edit landed while this was in flight: the edit is newer, so this rewrite is dropped.
      if (seq !== countSeq.current) {
        if (own === refineSeq.current) setRefineNote('You edited the profile while that ran, so we kept your edit. Send it again to apply it.')
        return
      }
      noteChange(icp, r.icp)
      setIcp(r.icp)
      setEdited(true)
      landCount(r.total)
      setRefineNote(r.note)
      unapprove()
    } catch (err) {
      if (isAbort(err)) return
      console.error('[start] refine failed', err)
      if (seq === countSeq.current) setRefineError(errorCopy(err, 'Keep it to a short sentence, like "only Texas, add CMOs".'))
    } finally {
      // `refining` belongs to this request alone; `counting` belongs to whichever count is newest.
      if (own === refineSeq.current) setRefining(false)
      if (seq === countSeq.current) setCounting(false)
    }
  }

  /** Approve goes straight to the work-email step; the 5-lead preview loads underneath it, never blocking. */
  const onApprove = async () => {
    if (!complete || approved) return
    setApproved(true)
    setPreviewError(null)
    trackStep('icp_approved', mock)
    requestAnimationFrame(() =>
      claimRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
    )
    const seq = ++previewSeq.current
    try {
      const r = await postJson<PreviewResponse>('/api/start/preview', { icp }, mock, sessionRef.current?.signal)
      if (seq !== previewSeq.current) return
      setPreview(r.leads)
      setPreviewTotal(r.total)
    } catch (err) {
      if (isAbort(err)) return
      console.error('[start] preview failed', err)
      if (seq === previewSeq.current) setPreviewError(errorCopy(err, 'We could not pull a preview for this profile.'))
    }
  }

  if (phase === 'idle') {
    return (
      <div className="mx-auto w-full max-w-[72rem] px-5 sm:px-8">
        <Hero
          mode={mode}
          setMode={(m) => {
            setMode(m)
            setValue('')
            setInputError(null)
            setNotice(null)
          }}
          value={value}
          setValue={setValue}
          inputError={inputError}
          notice={notice}
          onSubmit={submit}
          inputRef={inputRef}
        />
      </div>
    )
  }

  const website = site?.domain ?? (query && 'url' in query ? query.url : fallbackDomain)
  const showCard = complete || Object.keys(icp).length > 0 || !scanError

  return (
    <div className={`mx-auto w-full max-w-[72rem] px-5 pb-24 pt-6 sm:px-8 sm:pt-12 ${replayedAt ? 'fl-instant' : ''}`}>
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">{website ? `Who buys from ${website}` : 'Who buys from you'}</h1>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14">
        <ScanFeed
          query={query}
          site={site}
          pages={pages}
          facts={facts}
          scanning={scanning}
          icpReady={complete}
          slow={slow}
          replayedAt={replayedAt}
          count={count}
          onReset={() => morph(() => toHero('url', null))}
        />
        {/* Phones: room below the profile so the follow-scroll can bring it to the top, past the rail. */}
        <div className={`min-w-0 space-y-5 ${Object.keys(icp).length > 0 ? 'max-lg:min-h-[100svh]' : ''}`}>
          {showCard && (
            <div ref={cardRef} className="scroll-mt-4">
            <IcpCard
              icp={icp}
              complete={complete}
              count={count}
              delta={delta}
              // The stream stays open until its count lands; that wait is counting, not "unavailable".
              counting={counting || (phase === 'scanning' && count === null)}
              onChange={onChange}
              refining={refining}
              refineNote={refineNote}
              refineError={refineError}
              onRefine={onRefine}
              approved={approved}
              onApprove={() => void onApprove()}
              secondary={
                complete && !approved && website && count !== 0 ? (
                  <EmailProfile website={website} icp={icp as Icp} mock={mock} edited={edited} />
                ) : null
              }
            />
            </div>
          )}
          {/* Describes the scanned profile; hidden once the reader edits it so it never contradicts the card. */}
          {complete && persona && !edited && <PersonaCard persona={persona} />}
          {scanError && <ScanErrorNote error={scanError} onRetry={() => query && void run(query)} />}
        </div>
      </div>

      {approved && complete && (
        <div ref={claimRef} className="fl-rise mt-12 scroll-mt-6 border-t border-[#e5e7eb] pt-12 sm:mt-16 sm:pt-16">
          <ClaimForm website={website} icp={icp as Icp} mock={mock} />
          <div className="mt-12 sm:mt-14">
            {previewError ? (
              <p role="status" className="text-sm text-[#4b5563]">
                {previewError} Your 25 still come from the profile you approved.
              </p>
            ) : (
              <PreviewTable leads={preview} total={previewTotal ?? count} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
