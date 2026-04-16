'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, AlertTriangle } from 'lucide-react'
import { SegmentCard } from './SegmentCard'
import { ReasoningPanel } from './ReasoningPanel'
import { InlineMarkdown } from './InlineMarkdown'
import { CursiveOrb } from './CursiveOrb'
import { HistorySidebar, SidebarToggle } from './HistorySidebar'
import type { SegmentResult, StreamEvent } from '@/lib/copilot/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  thinking?: string
  toolCalls?: Array<{ id: string; name: string; input: unknown; summary?: string }>
  segments?: SegmentResult[]
  isStreaming?: boolean
  error?: string
}

const SUGGESTIONS: Array<{ label: string; prompt: string }> = [
  {
    label: 'B2B SaaS buyers',
    prompt:
      'Find me segments for B2B SaaS decision-makers actively evaluating CRM or marketing automation tools.',
  },
  {
    label: 'Luxury auto',
    prompt:
      'I want high-income consumers actively shopping for luxury vehicles in the last 7 days.',
  },
  {
    label: 'Fitness enthusiasts',
    prompt:
      'Show me the best segments for people researching home gym equipment and fitness programs.',
  },
  {
    label: 'Catalog overview',
    prompt: 'What kinds of audience segments do we have? Give me the top categories.',
  },
]

function genSessionId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

interface CopilotChatProps {
  adminEmail: string
}

export function CopilotChat({ adminEmail }: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [extendedThinking, setExtendedThinking] = useState(false)
  const [sessionId, setSessionId] = useState<string>(() => genSessionId())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessionsRefresh, setSessionsRefresh] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll on new content
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  // Auto-resize textarea to content
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [input])

  const hasMessages = messages.length > 0

  const startNewChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setInput('')
    setIsSending(false)
    setSessionId(genSessionId())
    setSidebarOpen(false)
  }, [])

  const loadSession = useCallback(async (id: string) => {
    setSidebarOpen(false)
    try {
      abortRef.current?.abort()
      const res = await fetch(`/api/admin/copilot/sessions/${id}`)
      if (!res.ok) return
      const data = await res.json()
      const hydrated: Message[] = (data.messages ?? []).map((m: {
        id: string
        role: 'user' | 'assistant'
        content: string
        segments: SegmentResult[] | null
        tool_calls:
          | Array<{ id: string; name: string; input: unknown; summary?: string }>
          | null
      }) => ({
        id: m.id,
        role: m.role,
        text: m.content,
        segments: m.segments ?? undefined,
        toolCalls: m.tool_calls ?? undefined,
      }))
      setMessages(hydrated)
      setSessionId(id)
      setIsSending(false)
    } catch {
      // silent
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isSending) return

      const userMsg: Message = {
        id: `u_${Date.now()}`,
        role: 'user',
        text: trimmed,
      }
      const asstMsg: Message = {
        id: `a_${Date.now()}`,
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
        const res = await fetch('/api/admin/copilot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            extendedThinking,
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.text })),
              { role: 'user', content: trimmed },
            ],
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          let errMsg = `Request failed (${res.status})`
          try {
            const body = await res.json()
            if (body?.message) errMsg = body.message
          } catch {}
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstMsg.id ? { ...m, isStreaming: false, error: errMsg } : m
            )
          )
          return
        }

        if (!res.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstMsg.id
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

            let evt: StreamEvent
            try {
              evt = JSON.parse(payload) as StreamEvent
            } catch {
              continue
            }

            setMessages((prev) =>
              prev.map((m) => (m.id === asstMsg.id ? applyEvent(m, evt) : m))
            )
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsg.id
              ? {
                  ...m,
                  isStreaming: false,
                  error: err instanceof Error ? err.message : 'Unknown error',
                }
              : m
          )
        )
      } finally {
        setIsSending(false)
        abortRef.current = null
        setSessionsRefresh((k) => k + 1)
      }
    },
    [messages, isSending, extendedThinking, sessionId]
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

  const handleSuggestion = (prompt: string) => sendMessage(prompt)
  const handleStop = () => abortRef.current?.abort()

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <HistorySidebar
        activeSessionId={sessionId}
        refreshKey={sessionsRefresh}
        onNewChat={startNewChat}
        onSelectSession={loadSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-3 sm:px-6">
        {/* Mobile-only hamburger — desktop has the fixed sidebar */}
        <div className="flex items-center pt-3 md:hidden">
          <SidebarToggle onOpen={() => setSidebarOpen(true)} />
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-2 sm:py-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {!hasMessages ? (
            <EmptyState onSuggestionClick={handleSuggestion} adminEmail={adminEmail} />
          ) : (
            <div className="space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Composer — glassmorphic, borderless */}
        <div className="sticky bottom-0 pb-4 pt-2">
          <form onSubmit={handleSubmit}>
            <div className="flex items-end gap-2 rounded-2xl border border-border/30 bg-white/60 px-3 py-2 shadow-enterprise-sm backdrop-blur-xl transition-shadow focus-within:shadow-enterprise-md sm:rounded-3xl">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your ICP…"
                rows={1}
                disabled={isSending}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                className="min-h-[28px] flex-1 resize-none border-0 bg-transparent px-1 py-1.5 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 sm:text-sm"
                style={{
                  outline: 'none',
                  boxShadow: 'none',
                }}
              />
              {isSending ? (
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop"
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground transition-colors hover:bg-muted"
                >
                  <span className="h-2.5 w-2.5 rounded-sm bg-foreground" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send"
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={extendedThinking}
                  onChange={(e) => setExtendedThinking(e.target.checked)}
                  className="h-3 w-3 accent-primary"
                  disabled={isSending}
                />
                <span>Extended thinking</span>
              </label>
              <span className="hidden sm:inline">
                Enter to send · Shift+Enter for newline
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Message rendering ───────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground/90 px-3.5 py-2 text-[14px] leading-relaxed text-background sm:text-sm">
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
      <div className="w-full max-w-[95%] space-y-2 sm:max-w-[90%]">
        <ReasoningPanel
          thinking={message.thinking}
          toolCalls={message.toolCalls}
          isActive={message.isStreaming && !message.text}
        />

        {message.text && (
          <div className="text-[14.5px] leading-[1.6] text-foreground sm:text-sm">
            <InlineMarkdown text={message.text} />
            {message.isStreaming && (
              <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-foreground/40" />
            )}
          </div>
        )}

        {message.segments && message.segments.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {message.segments.map((seg, i) => (
              <SegmentCard
                key={`${message.id}-${seg.segment_id}-${i}`}
                segment={seg}
                index={i}
              />
            ))}
          </div>
        )}

        {message.isStreaming && !message.text && !message.thinking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CursiveOrb size={16} pulsing />
            <span>Thinking…</span>
          </div>
        )}

        {message.error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{message.error}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────

function EmptyState({
  onSuggestionClick,
  adminEmail,
}: {
  onSuggestionClick: (prompt: string) => void
  adminEmail: string
}) {
  const hour = new Date().getHours()
  const greeting =
    hour < 5
      ? 'Burning the midnight oil'
      : hour < 12
        ? 'Good morning'
        : hour < 18
          ? 'Good afternoon'
          : 'Good evening'
  const firstName = useMemo(() => {
    const local = adminEmail.split('@')[0]
    return local.charAt(0).toUpperCase() + local.slice(1).split(/[._-]/)[0]
  }, [adminEmail])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-2 text-center">
      <CursiveOrb size={56} />

      <div>
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          {greeting}, {firstName}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Describe an ICP or target behavior and I&apos;ll match it to the best
          pre-built segments in our catalog.
        </p>
      </div>

      <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onSuggestionClick(s.prompt)}
            className="group rounded-xl border border-border/60 bg-card p-3 text-left transition-all hover:border-border hover:bg-card/80"
          >
            <div className="text-xs font-semibold text-foreground">
              {s.label}
            </div>
            <p className="mt-1 line-clamp-2 text-[11.5px] text-muted-foreground">
              {s.prompt}
            </p>
          </button>
        ))}
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
      return { ...msg, thinking: (msg.thinking || '') + evt.delta }
    case 'tool_use':
      return {
        ...msg,
        toolCalls: [
          ...(msg.toolCalls ?? []),
          { id: evt.id, name: evt.name, input: evt.input },
        ],
      }
    case 'tool_result':
      return {
        ...msg,
        toolCalls: (msg.toolCalls ?? []).map((tc) =>
          tc.id === evt.tool_use_id ? { ...tc, summary: evt.summary } : tc
        ),
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
