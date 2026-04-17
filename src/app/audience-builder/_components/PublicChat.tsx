'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowUp, Calendar, LogOut } from 'lucide-react'
import { CursiveOrb } from '@/app/admin/copilot/_components/CursiveOrb'
import { LiveSteps } from '@/app/admin/copilot/_components/LiveSteps'
import type { SegmentResult, StreamEvent } from '@/lib/copilot/types'
import { StreamingText } from '@/app/admin/copilot/_components/StreamingText'
import { PublicSegmentCard } from './PublicSegmentCard'
import { TurnsMeter } from './TurnsMeter'
import { BookCallCard } from './BookCallCard'
import { EmailCaptureModal, type EmailSubmitData } from './EmailCaptureModal'

const BOOK_URL =
  'https://cal.com/meetcursive/intro?utm_source=audience-builder&utm_medium=copilot'

const TURN_LIMIT = 10
const DAILY_LIMIT = 30

const SUGGESTIONS: Array<{ label: string; prompt: string }> = [
  {
    label: 'B2B SaaS buyers',
    prompt: 'B2B SaaS decision-makers evaluating CRMs',
  },
  {
    label: 'Luxury auto shoppers',
    prompt: 'High-income auto shoppers in the last 30 days',
  },
  {
    label: 'Fitness enthusiasts',
    prompt: 'Fitness enthusiasts researching home gym equipment',
  },
  {
    label: 'What categories?',
    prompt: 'What categories do you have?',
  },
]

type MessageKind = 'text' | 'book_card'

interface ToolCall {
  id: string
  name: string
  input: unknown
  summary?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  kind?: MessageKind
  text: string
  segments?: SegmentResult[]
  isStreaming?: boolean
  hasThinking?: boolean
  toolCalls?: ToolCall[]
  error?: string
}

interface AuthState {
  token: string | null
  sessionId: string | null
  firstName: string | null
  company: string | null
}

interface PublicChatProps {
  authState: AuthState
  onAuth: (
    token: string,
    sessionId: string,
    leadInfo: { firstName?: string | null; company?: string | null }
  ) => void
  onSessionExpired: () => void
}

interface DonePayload {
  turns_remaining_session?: number
  turns_remaining_day?: number
  preview_id?: string | null
  previews_remaining?: number
}

interface StartPayload {
  email: string
  first_name?: string
  last_name?: string
  username?: string
  company?: string
  use_case?: string
  source: string
  preview_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

type PreviewState = 'idle' | 'streaming' | 'locked' | 'unlocked' | 'error'

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function readUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const key of [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
  ]) {
    const v = params.get(key)
    if (v) out[key] = v.slice(0, 200)
  }
  return out
}

export function PublicChat({
  authState,
  onAuth,
  onSessionExpired,
}: PublicChatProps) {
  const { token } = authState

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [turnsUsed, setTurnsUsed] = useState(0)
  const [turnsToday, setTurnsToday] = useState(0)
  const [dailyLimitReached, setDailyLimitReached] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [hasHadAssistantReply, setHasHadAssistantReply] = useState(false)

  // Preview-first flow state
  const [previewState, setPreviewState] = useState<PreviewState>(
    token ? 'unlocked' : 'idle'
  )
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewQuery, setPreviewQuery] = useState<string | null>(null)
  const [previewSegmentCount, setPreviewSegmentCount] = useState(0)
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const heroTextareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const bookCardInsertedRef = useRef(false)

  const emptyState = messages.length === 0

  // Keep previewState in sync with auth: if token becomes truthy, we're unlocked.
  useEffect(() => {
    if (token) {
      setPreviewState((prev) => (prev === 'locked' ? 'unlocked' : prev))
    }
  }, [token])

  // Auto-scroll when messages update (only once there's a conversation)
  useEffect(() => {
    if (emptyState) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, emptyState])

  // Auto-resize composer textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [input])

  // Auto-resize hero textarea
  useEffect(() => {
    const el = heroTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 240) + 'px'
  }, [input])

  // Load session counters whenever we have a token
  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/public/copilot/session', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) {
          if (!cancelled) {
            setSessionExpired(true)
            onSessionExpired()
          }
          return
        }
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setTurnsUsed(Number(data?.turn_count ?? 0))
        setTurnsToday(Number(data?.turns_today ?? 0))
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, onSessionExpired])

  // Abort any in-flight stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const sessionTurnLimitReached = turnsUsed >= TURN_LIMIT
  const atHardLimit =
    sessionTurnLimitReached || dailyLimitReached || sessionExpired

  // ─── Generic SSE frame → message folding ─────────────────────────────
  const processPreviewEvent = useCallback(
    (asstId: string, evt: StreamEvent & DonePayload) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === asstId ? applyEvent(m, evt) : m))
      )
      if (evt.type === 'segments') {
        setPreviewSegmentCount((c) => c + evt.segments.length)
      }
      if (evt.type === 'done') {
        if (evt.preview_id) setPreviewId(evt.preview_id)
        // Give the user ~2.5s to read the final text + scan segments before
        // the blur overlay + email modal appears. Feels less like a bait-and-
        // switch — they see the work complete, appreciate the result, then
        // the gate drops in.
        setTimeout(() => setPreviewState('locked'), 2500)
      }
    },
    []
  )

  // ─── Streaming the PREVIEW (unauthenticated) ─────────────────────────
  const streamPreview = useCallback(
    async (asstId: string, query: string) => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/public/copilot/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        })

        if (res.status === 429) {
          let message = "You've used all your free previews for today."
          try {
            const body = await res.json()
            if (body?.message) message = body.message
          } catch {
            /* noop */
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId
                ? { ...m, isStreaming: false, error: message }
                : m
            )
          )
          setPreviewState('error')
          return
        }

        if (!res.ok) {
          let errMsg = `Request failed (${res.status})`
          try {
            const body = await res.json()
            if (body?.message) errMsg = body.message
          } catch {
            /* noop */
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId
                ? { ...m, isStreaming: false, error: errMsg }
                : m
            )
          )
          setPreviewState('error')
          return
        }

        if (!res.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId
                ? { ...m, isStreaming: false, error: 'No response body' }
                : m
            )
          )
          setPreviewState('error')
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let idx: number
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, idx)
            buffer = buffer.slice(idx + 2)
            const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
            if (!dataLine) continue
            const payload = dataLine.slice(5).trim()
            if (!payload) continue

            let evt: StreamEvent & DonePayload
            try {
              evt = JSON.parse(payload) as StreamEvent & DonePayload
            } catch {
              continue
            }

            processPreviewEvent(asstId, evt)
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  isStreaming: false,
                  error:
                    err instanceof Error
                      ? err.message
                      : 'Unknown error occurred',
                }
              : m
          )
        )
        setPreviewState('error')
      } finally {
        setIsSending(false)
        abortRef.current = null
      }
    },
    [processPreviewEvent]
  )

  // ─── Streaming an AUTHENTICATED chat turn ───────────────────────────
  const streamAssistantReply = useCallback(
    async (asstId: string, priorTurns: Array<{ role: string; content: string }>) => {
      if (!token) return

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/public/copilot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: priorTurns }),
          signal: controller.signal,
        })

        if (res.status === 401) {
          setSessionExpired(true)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId
                ? { ...m, isStreaming: false, error: 'Your session expired.' }
                : m
            )
          )
          onSessionExpired()
          return
        }

        if (res.status === 429) {
          let message = 'Limit reached. Book a call to continue.'
          let kind: 'session' | 'daily' = 'session'
          try {
            const body = await res.json()
            if (body?.error === 'daily_turn_limit') kind = 'daily'
            if (body?.error === 'daily_budget_exceeded') kind = 'daily'
            if (body?.message) message = body.message
          } catch {
            /* noop */
          }
          if (kind === 'daily') setDailyLimitReached(true)
          else setTurnsUsed(TURN_LIMIT)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId ? { ...m, isStreaming: false, error: message } : m
            )
          )
          return
        }

        if (!res.ok) {
          let errMsg = `Request failed (${res.status})`
          try {
            const body = await res.json()
            if (body?.message) errMsg = body.message
          } catch {
            /* noop */
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId ? { ...m, isStreaming: false, error: errMsg } : m
            )
          )
          return
        }

        if (!res.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId
                ? { ...m, isStreaming: false, error: 'No response body' }
                : m
            )
          )
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let idx: number
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, idx)
            buffer = buffer.slice(idx + 2)
            const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
            if (!dataLine) continue
            const payload = dataLine.slice(5).trim()
            if (!payload) continue

            let evt: StreamEvent & DonePayload
            try {
              evt = JSON.parse(payload) as StreamEvent & DonePayload
            } catch {
              continue
            }

            if (evt.type === 'done') {
              if (typeof evt.turns_remaining_session === 'number') {
                setTurnsUsed(
                  Math.max(0, TURN_LIMIT - evt.turns_remaining_session)
                )
              }
              if (typeof evt.turns_remaining_day === 'number') {
                setTurnsToday(Math.max(0, DAILY_LIMIT - evt.turns_remaining_day))
                if (evt.turns_remaining_day <= 0) {
                  setDailyLimitReached(true)
                }
              }
              setHasHadAssistantReply(true)
            }

            setMessages((prev) =>
              prev.map((m) => (m.id === asstId ? applyEvent(m, evt) : m))
            )
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  isStreaming: false,
                  error:
                    err instanceof Error ? err.message : 'Unknown error occurred',
                }
              : m
          )
        )
      } finally {
        setIsSending(false)
        abortRef.current = null
      }
    },
    [token, onSessionExpired]
  )

  // ─── Submitting a user message ───────────────────────────────────────
  const handleUserSubmit = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed || isSending || atHardLimit) return

      // Case 1 — no token yet: kick off the unauthenticated preview. The
      // UI will blur + show the email modal once streaming finishes.
      if (!token) {
        const userMsg: Message = {
          id: genId('u'),
          role: 'user',
          kind: 'text',
          text: trimmed,
        }
        const asstId = genId('a')
        const asstMsg: Message = {
          id: asstId,
          role: 'assistant',
          kind: 'text',
          text: '',
          isStreaming: true,
          toolCalls: [],
        }
        setMessages((prev) => [...prev, userMsg, asstMsg])
        setInput('')
        setIsSending(true)
        setPreviewState('streaming')
        setPreviewQuery(trimmed)
        setPreviewSegmentCount(0)
        void streamPreview(asstId, trimmed)
        return
      }

      // Case 2 — authenticated: standard flow.
      const userMsg: Message = {
        id: genId('u'),
        role: 'user',
        kind: 'text',
        text: trimmed,
      }
      const asstId = genId('a')
      const asstMsg: Message = {
        id: asstId,
        role: 'assistant',
        kind: 'text',
        text: '',
        isStreaming: true,
      }
      setMessages((prev) => [...prev, userMsg, asstMsg])
      setInput('')
      setIsSending(true)

      const priorTurns = [...messages, userMsg]
        .filter((m) => m.kind === 'text' || m.kind === undefined)
        .filter((m) => m.text.length > 0)
        .map((m) => ({ role: m.role, content: m.text }))

      void streamAssistantReply(asstId, priorTurns)
    },
    [token, isSending, atHardLimit, messages, streamAssistantReply, streamPreview]
  )

  // ─── Email modal submit (after preview completes) ────────────────────
  const handleEmailSubmit = useCallback(
    async (fields: EmailSubmitData) => {
      setEmailError(null)
      setIsSubmittingEmail(true)

      const payload: StartPayload = {
        email: fields.email,
        first_name: fields.first_name,
        last_name: fields.last_name,
        username: fields.username,
        company: fields.company,
        use_case: previewQuery ?? undefined,
        source: 'audience-builder',
        preview_id: previewId ?? undefined,
        ...readUtmParams(),
      }

      try {
        const res = await fetch('/api/public/copilot/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (res.status === 429) {
          let message = "You've hit the daily limit."
          try {
            const j = await res.json()
            if (j?.message) message = j.message
          } catch {
            /* noop */
          }
          setEmailError(message)
          return
        }

        if (!res.ok) {
          setEmailError('Something went wrong. Please try again.')
          return
        }

        const data = (await res.json()) as { token: string; session_id: string }
        if (!data?.token || !data?.session_id) {
          setEmailError('Unexpected response. Please try again.')
          return
        }

        onAuth(data.token, data.session_id, {
          firstName: fields.first_name ?? null,
          company: fields.company ?? null,
        })
        setPreviewState('unlocked')
        setHasHadAssistantReply(true)
      } catch {
        setEmailError('Network error. Please try again.')
      } finally {
        setIsSubmittingEmail(false)
      }
    },
    [previewId, previewQuery, onAuth]
  )

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleUserSubmit(input)
  }

  const handleComposerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleUserSubmit(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleUserSubmit(input)
    }
  }

  const handleStop = () => abortRef.current?.abort()

  const handleResetSession = useCallback(() => {
    onSessionExpired()
    setMessages([])
    setInput('')
    setTurnsUsed(0)
    setTurnsToday(0)
    setDailyLimitReached(false)
    setSessionExpired(false)
    setHasHadAssistantReply(false)
    setPreviewState('idle')
    setPreviewId(null)
    setPreviewQuery(null)
    setPreviewSegmentCount(0)
    setEmailError(null)
    bookCardInsertedRef.current = false
  }, [onSessionExpired])

  // Inline book-call card after the first real assistant reply (authenticated only)
  useEffect(() => {
    if (bookCardInsertedRef.current) return
    if (!hasHadAssistantReply) return
    if (!token) return
    bookCardInsertedRef.current = true
    setMessages((prev) => [
      ...prev,
      {
        id: genId('book'),
        role: 'assistant',
        kind: 'book_card',
        text: '',
      },
    ])
  }, [hasHadAssistantReply, token])

  const suggestionsVisible = useMemo(() => emptyState, [emptyState])
  const composerDisabled =
    isSending || atHardLimit || previewState === 'streaming' || previewState === 'locked'

  // ─── RENDER: empty hero state ────────────────────────────────────────
  if (emptyState) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-20">
        <div className="text-center">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <CursiveOrb size={64} />
          </div>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-[#0F172A] sm:text-5xl md:text-6xl lg:text-7xl">
            Find the perfect audience
            <br />
            for your next campaign
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-600 sm:text-lg">
            Describe your ideal customer. Our AI matches you to{' '}
            <strong>19,000+</strong> pre-built audience segments in seconds.
          </p>
        </div>

        <form onSubmit={handleHeroSubmit} className="mt-10">
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:border-blue-300 focus-within:shadow-md">
            <textarea
              ref={heroTextareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the audience you want to reach..."
              rows={3}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 pr-14 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>

        {suggestionsVisible && (
          <div className="mt-6 text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Try one of these
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setInput(s.prompt)
                    heroTextareaRef.current?.focus()
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14 grid grid-cols-2 gap-6 text-center sm:grid-cols-4 sm:gap-4">
          <div>
            <div className="text-2xl font-bold text-[#0F172A] sm:text-3xl">280M+</div>
            <div className="mt-1 text-[11px] leading-snug text-slate-500">
              identified consumer<br />+ B2B profiles
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0F172A] sm:text-3xl">40M+</div>
            <div className="mt-1 text-[11px] leading-snug text-slate-500">
              website visitors<br />tracked monthly
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0F172A] sm:text-3xl">19K+</div>
            <div className="mt-1 text-[11px] leading-snug text-slate-500">
              pre-built audience<br />segments
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0F172A] sm:text-3xl">500K+</div>
            <div className="mt-1 text-[11px] leading-snug text-slate-500">
              fresh in-market<br />signals daily
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] text-slate-400">
          Powered by Cursive · Used by B2B & B2C teams to build their next audience
        </p>
      </div>
    )
  }

  // ─── RENDER: active conversation ─────────────────────────────────────
  const showOverlay = previewState === 'locked' && !token

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col">
      {/* Slim header */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0F172A]">
              Audience Builder
            </p>
            <p className="truncate text-[11px] text-slate-500">
              Free AI chatbot · Powered by Cursive
            </p>
          </div>
          <div className="flex items-center gap-2">
            {token && (
              <TurnsMeter
                used={turnsUsed}
                limit={TURN_LIMIT}
                showDaily
                dailyUsed={turnsToday}
                dailyLimit={DAILY_LIMIT}
              />
            )}
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
            >
              <Calendar className="h-3.5 w-3.5" />
              Book a call
            </a>
          </div>
        </div>
      </div>

      {/* Messages + locked overlay */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div
            className={`mx-auto w-full max-w-2xl space-y-5 px-4 py-5 sm:px-6 ${
              showOverlay ? 'pointer-events-none select-none' : ''
            }`}
            style={showOverlay ? { filter: 'blur(3px)' } : undefined}
            aria-hidden={showOverlay ? 'true' : undefined}
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </AnimatePresence>

            {sessionTurnLimitReached && !dailyLimitReached && (
              <LimitCard
                title="You've used all 10 messages in this session"
                body="Want to keep exploring? Book a 15-min call to activate these audiences, or start a new session."
                onReset={handleResetSession}
              />
            )}

            {dailyLimitReached && (
              <LimitCard
                title="Daily message limit reached"
                body="We've saved your session — come back tomorrow, or book a call to get unlimited access now."
                hideReset
              />
            )}

            {sessionExpired && !sessionTurnLimitReached && !dailyLimitReached && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Your session expired
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Re-enter your email to pick up where you left off.
                </p>
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Start a new session
                </button>
              </div>
            )}
          </div>
        </div>

        {showOverlay && (
          <div className="absolute inset-0 z-10 flex items-start justify-center overflow-y-auto px-4 pb-8 pt-6 sm:pt-12">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-white/60 to-white/95"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto relative z-20 flex w-full max-w-md justify-center"
            >
              <EmailCaptureModal
                onSubmit={handleEmailSubmit}
                error={emailError}
                isSubmitting={isSubmittingEmail}
                segmentCount={previewSegmentCount}
              />
            </motion.div>
          </div>
        )}
      </div>

      {/* Sticky composer */}
      <div className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-6 sm:py-4">
          <form onSubmit={handleComposerSubmit}>
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-shadow focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  atHardLimit
                    ? 'Limit reached — book a call to continue'
                    : previewState === 'streaming'
                      ? 'Generating your preview…'
                      : previewState === 'locked'
                        ? 'Unlock to keep chatting'
                        : 'Describe your ideal customer…'
                }
                rows={1}
                disabled={composerDisabled}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                className="min-h-[28px] flex-1 resize-none border-0 bg-transparent px-1 py-1.5 text-[15px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed sm:text-sm"
                style={{ outline: 'none', boxShadow: 'none' }}
              />
              {isSending ? (
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop"
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() || composerDisabled}
                  aria-label="Send"
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>Enter to send · Shift+Enter for newline</span>
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 sm:hidden"
              >
                Book a call →
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Message rendering ─────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message
}

function MessageBubble({ message }: MessageBubbleProps) {
  if (message.kind === 'book_card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <BookCallCard
          variant="compact"
          headline="Love what you're seeing?"
          body="Book a 15-min call to activate these audiences — we'll plug the best matches straight into your outbound stack."
          cta="Book a call"
        />
      </motion.div>
    )
  }

  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#0F172A] px-3.5 py-2 text-[14px] leading-relaxed text-white sm:text-sm">
          {message.text}
        </div>
      </motion.div>
    )
  }

  const hasToolCalls = (message.toolCalls?.length ?? 0) > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex justify-start"
    >
      <div className="w-full max-w-[95%] space-y-2.5 sm:max-w-[90%]">
        {(message.isStreaming || hasToolCalls) && (
          <LiveSteps
            isStreaming={Boolean(message.isStreaming)}
            hasThinking={Boolean(message.hasThinking)}
            hasText={message.text.length > 0}
            toolCalls={message.toolCalls}
          />
        )}

        {message.text && (
          <div className="text-[14.5px] leading-[1.6] text-slate-700 sm:text-sm">
            <StreamingText
              text={message.text}
              isStreaming={message.isStreaming}
            />
            {message.isStreaming && (
              <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-slate-400" />
            )}
          </div>
        )}

        {message.segments && message.segments.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {message.segments.map((seg, i) => (
              <PublicSegmentCard
                key={`${message.id}-${i}`}
                segment={seg}
                index={i}
              />
            ))}
          </div>
        )}

        {message.error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{message.error}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Limit card ────────────────────────────────────────────────────────

function LimitCard({
  title,
  body,
  onReset,
  hideReset,
}: {
  title: string
  body: string
  onReset?: () => void
  hideReset?: boolean
}) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
      <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={BOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Calendar className="h-3.5 w-3.5" />
          Book a call
        </a>
        {!hideReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Start new session
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Event folding ─────────────────────────────────────────────────────

function applyEvent(msg: Message, evt: StreamEvent): Message {
  switch (evt.type) {
    case 'text':
      return { ...msg, text: (msg.text || '') + evt.delta }
    case 'thinking':
      return { ...msg, hasThinking: true }
    case 'tool_use': {
      const nextCall: ToolCall = {
        id: evt.id,
        name: evt.name,
        input: evt.input,
      }
      return {
        ...msg,
        toolCalls: [...(msg.toolCalls ?? []), nextCall],
      }
    }
    case 'tool_result': {
      const current = msg.toolCalls ?? []
      return {
        ...msg,
        toolCalls: current.map((tc) =>
          tc.id === evt.tool_use_id ? { ...tc, summary: evt.summary } : tc
        ),
      }
    }
    case 'segments':
      return {
        ...msg,
        segments: [...(msg.segments ?? []), ...evt.segments],
      }
    case 'done':
      return { ...msg, isStreaming: false }
    case 'error':
      return { ...msg, isStreaming: false, error: evt.message }
    default:
      return msg
  }
}
