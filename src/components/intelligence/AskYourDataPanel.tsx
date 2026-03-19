'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  results?: Record<string, unknown>[]
  count?: number
  sql?: string
  error?: boolean
}

interface AskYourDataPanelProps {
  className?: string
  hideHeader?: boolean
}

const EXAMPLE_QUERIES = [
  "Show me all leads from real estate companies in Texas",
  "Which leads have a score over 80 and haven't been contacted?",
  "How many leads came from the pixel this week?",
  "Find all CEOs and founders in my lead list",
  "Show me leads with tech stacks including Salesforce",
]

export function AskYourDataPanel({ className, hideHeader: _hideHeader }: AskYourDataPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(query?: string) {
    const q = query ?? input.trim()
    if (!q || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/intelligence/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.error ?? 'Query failed. Try rephrasing your question.',
            error: true,
          },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.summary,
            results: data.results,
            count: data.count,
            sql: data.sql,
          },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          error: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`flex flex-col h-full bg-white overflow-hidden ${className ?? ''}`}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Try asking</p>
            {EXAMPLE_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => handleSubmit(q)}
                className="w-full text-left text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs'
                  : msg.error
                  ? 'bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tl-sm px-3 py-2 text-xs'
                  : 'bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm p-3 text-xs w-full'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Results table */}
              {msg.results && msg.results.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        {Object.keys(msg.results[0]).slice(0, 6).map(k => (
                          <th
                            key={k}
                            className="text-left text-gray-500 font-medium pb-1 pr-3 border-b border-gray-200"
                          >
                            {k.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.results.slice(0, 10).map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-100">
                          {Object.values(row).slice(0, 6).map((val, vi) => (
                            <td key={vi} className="py-1 pr-3 text-gray-700">
                              {String(val ?? '—').slice(0, 40)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(msg.count ?? 0) > 10 && (
                    <p className="text-gray-400 mt-1">Showing 10 of {msg.count} results</p>
                  )}
                </div>
              )}

              {msg.count === 0 && <p className="text-gray-500 mt-1">No results found.</p>}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSubmit()
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about your leads..."
            disabled={loading}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  )
}
