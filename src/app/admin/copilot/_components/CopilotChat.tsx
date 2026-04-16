'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUp,
  Brain,
  Sparkles,
  User,
  Loader2,
  AlertTriangle,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SegmentCard } from './SegmentCard'
import { ReasoningPanel } from './ReasoningPanel'
import { BudgetMeter } from './BudgetMeter'
import type { SegmentResult, StreamEvent } from '@/lib/copilot/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  thinking?: string
  toolCalls?: Array<{ id: string; name: string; input: unknown; summary?: string }>
  segments?: SegmentResult[]
  costUsd?: number
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

interface CopilotChatProps {
  adminEmail: string
}

export function CopilotChat({ adminEmail }: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [extendedThinking, setExtendedThinking] = useState(false)
  const [budgetRefresh, setBudgetRefresh] = useState(0)
  const sessionIdRef = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  )
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

  const hasMessages = messages.length > 0

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
            sessionId: sessionIdRef.current,
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

          // Parse SSE frames separated by \n\n
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
        setBudgetRefresh((k) => k + 1)
      }
    },
    [messages, isSending, extendedThinking]
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

  const handleStop = () => {
    abortRef.current?.abort()
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-4xl flex-col px-4 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-border py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Audience Copilot
            </h1>
            <p className="text-xs text-muted-foreground">
              Match your ICP to the right segment · 19,894 in catalog
            </p>
          </div>
        </div>
        <BudgetMeter refreshKey={budgetRefresh} />
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-6"
        style={{ scrollBehavior: 'smooth' }}
      >
        {!hasMessages ? (
          <EmptyState onSuggestionClick={handleSuggestion} adminEmail={adminEmail} />
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background/95 py-3 backdrop-blur">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 shadow-enterprise-xs focus-within:border-primary/40 focus-within:shadow-enterprise-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your ICP, industry, or target behavior…"
              rows={1}
              disabled={isSending}
              className="max-h-[180px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            {isSending ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleStop}
                aria-label="Stop"
              >
                <div className="h-2.5 w-2.5 rounded-sm bg-foreground" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon-sm"
                disabled={!input.trim()}
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 px-1">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={extendedThinking}
                onChange={(e) => setExtendedThinking(e.target.checked)}
                className="h-3 w-3 accent-primary"
                disabled={isSending}
              />
              <Sparkles className="h-3 w-3" />
              <span>Extended thinking</span>
              <span className="hidden text-muted-foreground/60 sm:inline">
                (slower, deeper reasoning)
              </span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              Enter to send · Shift+Enter for newline
            </span>
          </div>
        </form>
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="flex max-w-[85%] items-start gap-2">
          <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground shadow-enterprise-xs">
            {message.text}
          </div>
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="h-3.5 w-3.5" />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start"
    >
      <div className="flex max-w-[92%] flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Brain className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <ReasoningPanel
              thinking={message.thinking}
              toolCalls={message.toolCalls}
              isActive={message.isStreaming && !message.text}
            />

            {message.text && (
              <div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-card px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-enterprise-xs">
                {message.text}
                {message.isStreaming && (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-primary/60" />
                )}
              </div>
            )}

            {message.segments && message.segments.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Thinking…</span>
              </div>
            )}

            {message.error && (
              <div className="mt-1 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{message.error}</span>
              </div>
            )}

            {message.costUsd !== undefined && message.costUsd > 0 && (
              <div className="mt-1 text-[10px] text-muted-foreground/70">
                ${message.costUsd.toFixed(4)} · {message.toolCalls?.length ?? 0} tool call
                {(message.toolCalls?.length ?? 0) === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </div>
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
    hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = useMemo(() => {
    const local = adminEmail.split('@')[0]
    return local.charAt(0).toUpperCase() + local.slice(1).split(/[._-]/)[0]
  }, [adminEmail])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
        <Target className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {greeting}, {firstName}
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Describe an ICP or target behavior and I&apos;ll match it to the best
          pre-built segments in our catalog.
        </p>
      </div>

      <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onSuggestionClick(s.prompt)}
            className="group rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/30 hover:shadow-enterprise-sm"
          >
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {s.label}
              </span>
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">
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
      return { ...msg, isStreaming: false, costUsd: evt.usage.cost_usd }
    case 'error':
      return { ...msg, isStreaming: false, error: evt.message }
    default:
      return msg
  }
}
