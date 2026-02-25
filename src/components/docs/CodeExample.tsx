'use client'

import { useState } from 'react'

interface CodeExampleProps {
  examples: {
    lang: 'cURL' | 'Node.js' | 'Python'
    code: string
  }[]
}

export function CodeExample({ examples }: CodeExampleProps) {
  const [active, setActive] = useState(examples[0]?.lang ?? 'cURL')
  const current = examples.find((e) => e.lang === active) ?? examples[0]

  return (
    <div className="rounded-lg border border-zinc-200 overflow-hidden text-[12px]">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200 bg-zinc-50">
        {examples.map((e) => (
          <button
            key={e.lang}
            onClick={() => setActive(e.lang)}
            className={`px-4 py-2 text-[12px] font-medium border-r border-zinc-200 last:border-r-0 transition-colors ${
              active === e.lang
                ? 'bg-white text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {e.lang}
          </button>
        ))}
      </div>
      {/* Code */}
      <pre className="bg-zinc-950 text-zinc-100 p-4 overflow-x-auto leading-relaxed font-mono text-[12px] whitespace-pre">
        {current?.code ?? ''}
      </pre>
    </div>
  )
}
