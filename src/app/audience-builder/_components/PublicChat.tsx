'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowUp, Calendar, LogOut } from 'lucide-react'
import type { SegmentResult, StreamEvent } from '@/lib/copilot/types'
import { StreamingText } from '@/app/admin/copilot/_components/StreamingText'
import { PublicSegmentCard } from './PublicSegmentCard'
import { TurnsMeter } from './TurnsMeter'
import { BookCallCard } from './BookCallCard'

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
    label: 'Catalog overview',
    prompt: 'What categories do you have?',
  },
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  segments?: SegmentResult[]
  isStreaming?: boolean
  error?: string
  showBookCard?: boolean
}

export interface LeadInfo {
  firstName: string
  company: string
}

interface PublicChatProps {
  token: string
  sessionId: string
  leadInfo: LeadInfo
  onSessionExpired: () => void
  onResetSession: () => void
}

interface DonePayload {
  turns_remaining_session?: number
  turns_remaining_day?: number
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function greeting(firstName: string): string {
  const name = firstName?.trim() ? firstName.trim() : 'there'
  return `Hi ${name} — tell me about the audience you're trying to reach, and I'll find you 2–3 matched segments from our catalog of 19,000+.`
}

export function PublicChat({
  token,
  sessionId: _sessionId,
  leadInfo,
  onSessionExpired,
  onResetSession,
}: PublicChatProps) {
  const initialGreetingRef = useRef<string>(greeting(leadInfo.firstName))

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'a_greeting',
      role: 'assistant',
      text: initialGreetingRef.current,
    },
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [turnsUsed, setTurnsUsed] = useState(0)
  const [turnsToday, setTurnsToday] = useState(0)
  const [dailyLimitReached, setDailyLimitReached] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [hasHadAssistantReply, setHasHadAssistantReply] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll on new content
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [input])

  // Load initial counters
  useEffect(() => {
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
  const atHardLimit = sessionTurnLimitReached || dailyLimitReached || sessionExpired

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isSending || atHardLimit) return

      const userMsg: Message = {
        id: genId('u'),
        role: 'user',
        text: trimmed,
      }
      const asstId = genId('a')
      const asstMsg: Message = {
        id: asstId,
        role: 'assistant',
        text: '',
        isStreaming: true,
      }
      setMessages((prev) => [...prev, userMsg, asstMsg])
      setInput('')
      setIsSending(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        // The API only sees the last 6 messages, but we send full user/assistant
        // prose (no segments, no tool internals) so the model has context.
        const priorTurns = [...messages, userMsg]
          .filter((m) => m.id !== 'a_greeting')
          .map((m) => ({ role: m.role, content: m.text }))

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
                ? {
                    ...m,
                    isStreaming: false,
                    error: 'Your session expired.',
                  }
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

            // Update counters on `done`
            if (evt.type === 'done') {
              if (typeof evt.turns_remaining_session === 'number') {
                setTurnsUsed(
                  Math.max(0, TURN_LIMIT - evt.turns_remaining_session)
                )
                if (evt.turns_remaining_session <= 0) {
                  // Hit session ceiling
                }
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
    [messages, isSending, atHardLimit, token, onSessionExpired]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleStop = () => abortRef.current?.abort()

  const suggestionsVisible = useMemo(
    () => messages.length <= 1 && !isSending && !atHardLimit,
    [messages.length, isSending, atHardLimit]
  )

  const bookCardInserted = useRef(false)
  useEffect(() => {
    // After the first assistant reply with real content, show the inline book-a-call card once.
    if (bookCardInserted.current) return
    if (!hasHadAssistantReply) return
    bookCardInserted.current = true
    setMessages((prev) => [
      ...prev,
      {
        id: genId('book'),
        role: 'assistant',
        text: '',
        showBookCard: true,
      },
    ])
  }, [hasHadAssistantReply])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col">
      {/* Chat header row */}
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
            <TurnsMeter
              used={turnsUsed}
              limit={TURN_LIMIT}
              showDaily
              dailyUsed={turnsToday}
              dailyLimit={DAILY_LIMIT}
            />
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

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-5 sm:px-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </AnimatePresence>

          {sessionTurnLimitReached && !dailyLimitReached && (
            <LimitCard
              title="You've used all 10 messages in this session"
              body="Want to keep exploring? Book a 15-min call to activate these audiences, or start a new session."
              onReset={onResetSession}
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
                onClick={onResetSession}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                Start a new session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-6 sm:py-4">
          {suggestionsVisible && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => sendMessage(s.prompt)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-200"
                >
                  {s.prompt}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-shadow focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  atHardLimit
                    ? 'Limit reached — book a call to continue'
                    : 'Describe your ideal customer…'
                }
                rows={1}
                disabled={isSending || atHardLimit}
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
                  disabled={!input.trim() || atHardLimit}
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

// ─── Message rendering ───────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  if (message.showBookCard) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex justify-start"
    >
      <div className="w-full max-w-[95%] space-y-2.5 sm:max-w-[90%]">
        {message.text && (
          <div className="text-[14.5px] leading-[1.6] text-slate-700 sm:text-sm">
            <StreamingText text={message.text} isStreaming={message.isStreaming} />
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

// ─── Limit card ──────────────────────────────────────────────────────────

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

// ─── Event folding ───────────────────────────────────────────────────────

function applyEvent(msg: Message, evt: StreamEvent): Message {
  switch (evt.type) {
    case 'text':
      return { ...msg, text: (msg.text || '') + evt.delta }
    case 'thinking':
      // Public surface disables thinking — we ignore deltas if they do arrive.
      return msg
    case 'tool_use':
      return msg
    case 'tool_result':
      return msg
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
