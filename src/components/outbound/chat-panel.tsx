'use client'

/**
 * AI Chat Panel — right-side drawer.
 *
 * Built fully in Feature 8 with streaming SSE, @-mention context, and
 * saved prompt quick chips. This file currently has the structural shell
 * and the conversation API; the streaming + saved prompts integration
 * lands in Feature 8.
 */

import { useState, useRef, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { SavedPromptsBar } from './saved-prompts-bar'

export interface ChatPanelProps {
  agentId: string
  agentName: string
  onClose: () => void
}

interface UiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

export function ChatPanel({ agentId, agentName, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [threadId] = useState(() => crypto.randomUUID())
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string, savedPromptId?: string) => {
    if (!text.trim() || streaming) return
    setStreaming(true)
    setInput('')

    const userMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    const assistantMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      pending: true,
    }
    setMessages(prev => [...prev, userMsg, assistantMsg])

    try {
      const res = await fetch('/api/outbound/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          thread_id: threadId,
          message: text,
          saved_prompt_id: savedPromptId,
        }),
      })

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Chat request failed')
      }

      // Stream the SSE response
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assembled = ''

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue
          try {
            const parsed = JSON.parse(payload) as { delta?: string; error?: string }
            if (parsed.error) {
              throw new Error(parsed.error)
            }
            if (parsed.delta) {
              assembled += parsed.delta
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: assembled, pending: true } : m
                )
              )
            }
          } catch (err) {
            // Non-JSON SSE line — skip
            if (err instanceof Error && err.message !== '') {
              // re-throw real errors
              throw err
            }
          }
        }
      }

      setMessages(prev =>
        prev.map(m => (m.id === assistantMsg.id ? { ...m, pending: false } : m))
      )
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: `Error: ${(err as Error).message}`, pending: false }
            : m
        )
      )
    } finally {
      setStreaming(false)
    }
  }

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>Chat with {agentName}</SheetTitle>
          <SheetDescription>
            Ask about your prospects, draft emails, or get suggestions.
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Start a conversation or pick a quick prompt below.
            </div>
          )}
          {messages.map(m => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted text-foreground'
              }`}
            >
              {m.content}
              {m.pending && <span className="inline-block animate-pulse ml-1">▍</span>}
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 py-4 space-y-3">
          <SavedPromptsBar onSelect={(label, template, id) => sendMessage(label, id)} />
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-200"
              placeholder="Ask a question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              disabled={streaming}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => sendMessage(input)}
              disabled={streaming || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
