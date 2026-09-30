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
import { errorCopy, isAbort, MIN_DESCRIPTION, postJson, streamScan, type Mock, type ScanInput } from './api'
import { Hero, type InputMode } from './Hero'
import { IcpCard } from './IcpCard'
import { ClaimForm, PreviewTable } from './Preview'
import { ScanFeed, type ScanError, type Site } from './ScanFeed'

const SLOW_AFTER_MS = [12_000, 25_000] as const
const NOT_A_SITE = "That doesn't look like a website. Try something like acme.com."

/** acme.com, www.acme.com, https://acme.com/about -> "acme.com/about"; null if it can't be a site. */
function normalizeUrl(raw: string): string | null {
  const v = raw.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  return /^[^\s/.]+(\.[^\s/.]+)*\.[a-z]{2,}(\/\S*)?$/i.test(v) ? v : null
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function StartFlow({ mock }: { mock: Mock }) {
  const [mode, setMode] = useState<InputMode>('url')
  const [value, setValue] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  /** The site we could not open; kept so the claim still has a website after a description scan. */
  const [fallbackDomain, setFallbackDomain] = useState<string | null>(null)

  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [query, setQuery] = useState<ScanInput | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [findings, setFindings] = useState<Fact[]>([])
  const [icp, setIcp] = useState<Partial<Icp>>({})
  const [complete, setComplete] = useState(false)
  const [scanError, setScanError] = useState<ScanError | null>(null)
  const [slow, setSlow] = useState<0 | 1 | 2>(0)

  const [count, setCount] = useState<number | null>(null)
  const [counting, setCounting] = useState(false)
  const [refining, setRefining] = useState(false)
  const [refineNote, setRefineNote] = useState<string | null>(null)
  const [refineError, setRefineError] = useState<string | null>(null)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<MaskedLead[] | null>(null)
  const [previewTotal, setPreviewTotal] = useState<number | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  /** One controller per scan session: aborting it cancels the stream and every count/refine/preview call. */
  const sessionRef = useRef<AbortController | null>(null)
  const countSeq = useRef(0)
  const countTimer = useRef<number | undefined>(undefined)
  const previewBusy = useRef(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  const endSession = () => {
    sessionRef.current?.abort()
    window.clearTimeout(countTimer.current)
    countSeq.current++
    previewBusy.current = false
  }

  useEffect(() => endSession, [])

  const scanning = phase === 'scanning' && !complete
  useEffect(() => {
    if (!scanning) return
    const timers = SLOW_AFTER_MS.map((ms, i) => window.setTimeout(() => setSlow((i + 1) as 1 | 2), ms))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [scanning])

  const toHero = (nextMode: InputMode, message: string | null) => {
    endSession()
    setPhase('idle')
    setMode(nextMode)
    setValue('')
    setInputError(message)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const onEvent = (e: ScanEvent, input: ScanInput) => {
    switch (e.type) {
      case 'site':
        return setSite(e)
      case 'fact':
        return setFindings((f) => [...f, e.fact])
      case 'icp_partial':
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
          return toHero('description', `We couldn't open ${input.url}. Tell us what you sell and who buys it instead.`)
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
    setFindings([])
    setIcp({})
    setComplete(false)
    setScanError(null)
    setSlow(0)
    setCount(null)
    setCounting(false)
    setRefining(false)
    setRefineNote(null)
    setRefineError(null)
    setPreviewOpen(false)
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

  const onChange = (next: Icp) => {
    setIcp(next)
    setRefineNote(null)
    setRefineError(null)
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

  const onPreview = async () => {
    if (previewBusy.current || !complete) return
    previewBusy.current = true
    setPreviewOpen(true)
    setPreviewError(null)
    requestAnimationFrame(() =>
      previewRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
    )
    try {
      const r = await postJson<PreviewResponse>('/api/start/preview', { icp }, mock, sessionRef.current?.signal)
      setPreview(r.leads)
      setPreviewTotal(r.total)
    } catch (err) {
      if (isAbort(err)) return
      console.error('[start] preview failed', err)
      setPreviewError(errorCopy(err, 'Something in this profile is off. Remove a filter and try again.'))
      setPreviewOpen(false)
    } finally {
      previewBusy.current = false
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
          }}
          value={value}
          setValue={setValue}
          inputError={inputError}
          onSubmit={submit}
          inputRef={inputRef}
        />
      </div>
    )
  }

  const showCard = complete || Object.keys(icp).length > 0 || !scanError
  const website = site?.domain ?? (query && 'url' in query ? query.url : fallbackDomain)

  return (
    <div className="mx-auto w-full max-w-[72rem] px-5 pb-24 pt-6 sm:px-8 sm:pt-12">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-12">
        <ScanFeed
          query={query}
          site={site}
          findings={findings}
          scanning={scanning}
          slow={slow}
          error={scanError}
          onRetry={() => query && void run(query)}
          onReset={() => toHero('url', null)}
        />
        <div className="min-w-0">
          {showCard && (
            <IcpCard
              icp={icp}
              complete={complete}
              count={count}
              counting={counting}
              onChange={onChange}
              refining={refining}
              refineNote={refineNote}
              refineError={refineError}
              onRefine={onRefine}
              onPreview={onPreview}
              previewLoading={previewOpen && !preview}
              previewOpen={previewOpen}
              previewError={previewError}
            />
          )}
        </div>
      </div>

      {previewOpen && complete && (
        <div ref={previewRef} className="mt-14 scroll-mt-6 space-y-8 sm:mt-20">
          <PreviewTable leads={preview} total={previewTotal ?? count} />
          {preview && <ClaimForm website={website} icp={icp as Icp} mock={mock} />}
        </div>
      )}
    </div>
  )
}
