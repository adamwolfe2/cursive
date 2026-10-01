import { SESSION_HEADER, type Attribution, type CLIENT_STEPS, type ScanEvent } from '@/lib/free-leads/contract'

/**
 * Client transport for /api/start/*. `mock` is a dev-only scenario name
 * (set by page.tsx from `?mock=`, never in production); when present every call
 * is answered by ./mock, which is loaded lazily so it never ships in the main chunk.
 */
export type Mock = string | null

/** sessionStorage key for the last claim body, reused by the resend link. */
export const CLAIM_STORAGE_KEY = 'cursive:start:claim'

/** Mirrors ScanRequestSchema: a website, or a pasted description (40+ chars) when the site is unreachable. */
export type ScanInput = { url: string } | { description: string }
export const MIN_DESCRIPTION = 40

export class StartApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

const GENERIC = 'Something went wrong on our side. Try again in a moment.'
const OFFLINE = "We couldn't reach Cursive. Check your connection and try again."
const RATE_LIMITED = 'Too many tries from your network. Give it a few minutes, then try again.'

// ---- Funnel: one anonymous session id per browser, sent on every /api/start/* request ----

const SID_KEY = 'cursive_fl_sid'
const ATTRIBUTION_SENT_KEY = 'cursive_fl_attribution_sent'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
let memorySid: string | null = null

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (err) {
    console.error('[start] localStorage read failed', key, err)
    return null
  }
}

function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (err) {
    console.error('[start] localStorage write failed', key, err)
  }
}

/** Created once (crypto.randomUUID) and kept in localStorage; falls back to memory when storage is blocked. */
export function sessionId(): string {
  if (memorySid) return memorySid
  const stored = storageGet(SID_KEY)
  memorySid = stored && UUID.test(stored) ? stored : crypto.randomUUID()
  if (memorySid !== stored) storageSet(SID_KEY, memorySid)
  return memorySid
}

const sessionHeaders = (): Record<string, string> => ({ [SESSION_HEADER]: sessionId() })

const ATTRIBUTION_PARAMS = [
  ['utm_source', 120],
  ['utm_medium', 120],
  ['utm_campaign', 200],
  ['utm_content', 200],
  ['utm_term', 200],
  ['ref', 120],
] as const

/** First-touch attribution from the landing URL and referrer, trimmed to AttributionSchema limits. */
export function attributionFrom(href: string, referrer: string): Attribution {
  const url = new URL(href)
  const params = ATTRIBUTION_PARAMS.flatMap(([key, max]) => {
    const v = url.searchParams.get(key)?.trim()
    return v ? [[key, v.slice(0, max)] as const] : []
  })
  return {
    ...Object.fromEntries(params),
    ...(referrer ? { referrer: referrer.slice(0, 500) } : {}),
    landing: url.pathname.slice(0, 500),
  }
}

/**
 * Attribution rides on scans until one is accepted (the server creates the session row then and
 * keeps first touch). A rejected or rate-limited first scan must not use it up.
 */
function pendingAttribution(): Attribution | undefined {
  if (storageGet(ATTRIBUTION_SENT_KEY) === sessionId()) return undefined
  return attributionFrom(window.location.href, document.referrer)
}

const mockOn = (mock: Mock): mock is string => process.env.NODE_ENV !== 'production' && Boolean(mock)

export const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

/** Human copy for any failure. 400 bodies from the API are terse ("Invalid profile"), so callers pass their own. */
export function errorCopy(err: unknown, onBadRequest = GENERIC): string {
  if (!(err instanceof StartApiError)) return err instanceof TypeError ? OFFLINE : GENERIC
  if (err.status === 400) return onBadRequest
  return err.message
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { ...init, headers: { ...sessionHeaders(), ...init.headers }, cache: 'no-store' })
  } catch (err) {
    if (isAbort(err)) throw err
    throw new StartApiError(OFFLINE, 0)
  }
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (err) {
      console.error('[start] non-JSON response', path, res.status, err)
      throw new StartApiError(res.status === 429 ? RATE_LIMITED : GENERIC, res.status)
    }
  }
  if (res.ok) return data as T
  const serverMessage =
    data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : null
  if (res.status === 429) throw new StartApiError(serverMessage ?? RATE_LIMITED, 429)
  // Error bodies from /api/start/* are written for people; callers override terse 400s via errorCopy.
  throw new StartApiError(serverMessage ?? GENERIC, res.status)
}

export async function postJson<T>(path: string, body: unknown, mock: Mock, signal?: AbortSignal): Promise<T> {
  if (mockOn(mock)) {
    const m = await import('./mock')
    return m.mockRequest(path, body, mock) as Promise<T>
  }
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
}

export async function getJson<T>(path: string, mock: Mock, signal?: AbortSignal): Promise<T> {
  if (mockOn(mock)) {
    const m = await import('./mock')
    return m.mockRequest(path, null, mock) as Promise<T>
  }
  return request<T>(path, { signal })
}

export type ClientStep = (typeof CLIENT_STEPS)[number]

/** Funnel step only the browser can see. Fire and forget: never blocks or breaks the UI. */
export function trackStep(step: ClientStep, mock: Mock): void {
  const send = mockOn(mock)
    ? postJson('/api/start/event', { step }, mock)
    : request('/api/start/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
        keepalive: true,
      })
  send.catch((err: unknown) => console.error('[start] funnel event not recorded', step, err))
}

/**
 * Parse one SSE block ("event: x\ndata: {...}\n\n"). Multiple `data:` lines join with
 * newlines per the spec; `event:`, `id:`, `retry:` and `:` comment lines are ignored.
 */
export function parseSseBlock(block: string): ScanEvent | null {
  const data = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(line.startsWith('data: ') ? 6 : 5))
    .join('\n')
    .trim()
  if (!data) return null
  try {
    return JSON.parse(data) as ScanEvent
  } catch (err) {
    console.error('[start] unparseable scan event', err)
    return null
  }
}

/** Incremental SSE reader: tolerant of events split across chunks and of CRLF / CR line endings. */
export function sseParser(onEvent: (e: ScanEvent) => void) {
  let buffer = ''
  return {
    push(chunk: string) {
      let text = buffer + chunk
      // A trailing CR may be the first half of a CRLF split across chunks; hold it back.
      const heldCr = text.endsWith('\r')
      if (heldCr) text = text.slice(0, -1)
      buffer = text.replace(/\r\n?/g, '\n')
      let end = buffer.indexOf('\n\n')
      while (end !== -1) {
        const event = parseSseBlock(buffer.slice(0, end))
        buffer = buffer.slice(end + 2)
        if (event) onEvent(event)
        end = buffer.indexOf('\n\n')
      }
      if (heldCr) buffer += '\r'
    },
    end() {
      const event = parseSseBlock(buffer.replace(/\r/g, '\n'))
      buffer = ''
      if (event) onEvent(event)
    },
  }
}

/** POST /api/start/scan and feed each event to onEvent. Resolves when the stream closes. */
export async function streamScan(
  input: ScanInput,
  onEvent: (e: ScanEvent) => void,
  signal: AbortSignal,
  mock: Mock
): Promise<void> {
  if (mockOn(mock)) {
    const m = await import('./mock')
    return m.mockScan(input, onEvent, signal, mock)
  }
  const attribution = pendingAttribution()
  let res: Response
  try {
    res = await fetch('/api/start/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...sessionHeaders() },
      body: JSON.stringify(attribution ? { ...input, attribution } : input),
      signal,
    })
  } catch (err) {
    if (isAbort(err)) throw err
    onEvent({ type: 'error', code: 'failed', message: OFFLINE })
    return
  }
  if (!res.ok || !res.body) {
    onEvent(
      res.status === 429
        ? { type: 'error', code: 'rate_limited', message: RATE_LIMITED }
        : { type: 'error', code: 'failed', message: GENERIC }
    )
    return
  }
  let accepted = false
  const parser = sseParser((e) => {
    // Any progress event means the server accepted the scan and stored the attribution.
    if (attribution && !accepted && e.type !== 'error') {
      accepted = true
      storageSet(ATTRIBUTION_SENT_KEY, sessionId())
    }
    onEvent(e)
  })
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    parser.push(value)
  }
  parser.end()
}
