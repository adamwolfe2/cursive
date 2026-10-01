'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import type {
  CountResponse,
  Fact,
  Icp,
  MaskedLead,
  PreviewResponse,
  RefineResponse,
  ScanEvent,
} from '@/lib/free-leads/contract'
import { errorCopy, isAbort, MIN_DESCRIPTION, postJson, streamScan, trackStep, type Mock, type ScanInput } from './api'
import { EmailProfile } from './EmailProfile'
import { Hero, type InputMode } from './Hero'
import { IcpCard } from './IcpCard'
import { ClaimForm, PreviewTable } from './Preview'
import { ScanErrorNote, ScanFeed, type ScanError, type Site } from './ScanFeed'
import { withPage, type PageRow } from './scan-state'

const SLOW_AFTER_MS = [12_000, 25_000] as const
const NOT_A_SITE = "That doesn't look like a website. Try something like acme.com."

/** acme.com, www.acme.com, https://acme.com/about -> "acme.com/about"; null if it can't be a site. */
export function normalizeUrl(raw: string): string | null {
  const v = raw.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  return /^[^\s/.]+(\.[^\s/.]+)*\.[a-z]{2,}(\/\S*)?$/i.test(v) ? v : null
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  const [scanError, setScanError] = useState<ScanError | null>(null)
  const [slow, setSlow] = useState<0 | 1 | 2>(0)

  const [count, setCount] = useState<number | null>(null)
  const [counting, setCounting] = useState(false)
  const [refining, setRefining] = useState(false)
  const [refineNote, setRefineNote] = useState<string | null>(null)
  const [refineError, setRefineError] = useState<string | null>(null)

  const [approved, setApproved] = useState(false)
  const [preview, setPreview] = useState<MaskedLead[] | null>(null)
  const [previewTotal, setPreviewTotal] = useState<number | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  /** One controller per scan session: aborting it cancels the stream and every count/refine/preview call. */
  const sessionRef = useRef<AbortController | null>(null)
  const countSeq = useRef(0)
  const countTimer = useRef<number | undefined>(undefined)
  const previewSeq = useRef(0)
  const claimRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  /** Phones: glide to the profile when it starts, unless the reader has scrolled on their own. */
  const followRef = useRef(false)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  const endSession = () => {
    sessionRef.current?.abort()
    window.clearTimeout(countTimer.current)
    countSeq.current++
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
      case 'done':
        return
    }
  }

  const run = async (input: ScanInput) => {
    endSession()
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
    setScanError(null)
    setSlow(0)
    setCount(null)
    setCounting(false)
    setRefining(false)
    setRefineNote(null)
    setRefineError(null)
    setApproved(false)
    setPreview(null)
    setPreviewTotal(null)
    setPreviewError(null)
    window.scrollTo({ top: 0 })

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
    if (finalIcp && !gotCount) recount(finalIcp, 0)
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
      void run({ url })
    } else {
      const description = value.trim()
      if (description.length < MIN_DESCRIPTION) {
        return setInputError('Give us a sentence or two: what you sell and who usually buys it.')
      }
      setInputError(null)
      void run({ description })
    }
  }

  const recount = (next: Icp, delay = 400) => {
    window.clearTimeout(countTimer.current)
    const seq = ++countSeq.current
    const signal = sessionRef.current?.signal
    setCounting(true)
    countTimer.current = window.setTimeout(async () => {
      try {
        const r = await postJson<CountResponse>('/api/start/count', { icp: next }, mock, signal)
        if (seq === countSeq.current) setCount(r.total)
      } catch (err) {
        if (isAbort(err)) return
        console.error('[start] count failed', err)
        if (seq === countSeq.current) {
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
    setIcp(next)
    setRefineNote(null)
    setRefineError(null)
    unapprove()
    recount(next)
  }

  const onRefine = async (instruction: string) => {
    if (!complete || refining) return
    window.clearTimeout(countTimer.current)
    const seq = ++countSeq.current
    setRefining(true)
    setCounting(true)
    setRefineError(null)
    setRefineNote(null)
    try {
      const r = await postJson<RefineResponse>('/api/start/refine', { icp, instruction }, mock, sessionRef.current?.signal)
      if (seq !== countSeq.current) return
      setIcp(r.icp)
      setCount(r.total)
      setRefineNote(r.note)
      unapprove()
    } catch (err) {
      if (isAbort(err)) return
      console.error('[start] refine failed', err)
      if (seq === countSeq.current) setRefineError(errorCopy(err, 'Keep it to a short sentence, like "only Texas, add CMOs".'))
    } finally {
      if (seq === countSeq.current) {
        setRefining(false)
        setCounting(false)
      }
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
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14">
        <ScanFeed
          query={query}
          site={site}
          pages={pages}
          facts={facts}
          scanning={scanning}
          slow={slow}
          replayedAt={replayedAt}
          onReset={() => toHero('url', null)}
        />
        <div className="min-w-0 space-y-5">
          {showCard && (
            <div ref={cardRef} className="scroll-mt-4">
            <IcpCard
              icp={icp}
              complete={complete}
              count={count}
              // The stream stays open until its count lands; that wait is counting, not "unavailable".
              counting={counting || (phase === 'scanning' && count === null)}
              onChange={onChange}
              refining={refining}
              refineNote={refineNote}
              refineError={refineError}
              onRefine={onRefine}
              approved={approved}
              onApprove={() => void onApprove()}
            />
            </div>
          )}
          {scanError && <ScanErrorNote error={scanError} onRetry={() => query && void run(query)} />}
          {complete && !approved && website && count !== 0 && (
            <div className="px-1">
              <EmailProfile website={website} icp={icp as Icp} mock={mock} />
            </div>
          )}
        </div>
      </div>

      {approved && complete && (
        <div ref={claimRef} className="fl-rise mt-12 scroll-mt-6 border-t border-[#e5e7eb] pt-12 sm:mt-16 sm:pt-16">
          <ClaimForm website={website} icp={icp as Icp} mock={mock} />
          <div className="mt-12 sm:mt-14">
            {previewError ? (
              <p role="status" className="text-sm text-[#4d5460]">
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
