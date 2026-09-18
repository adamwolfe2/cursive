'use client'

import { useState } from 'react'
import { CheckCircle, Copy } from 'lucide-react'

const TABS = ['HTML', 'GTM', 'Shopify'] as const
type Tab = typeof TABS[number]

const INSTRUCTIONS: Record<Tab, string> = {
  HTML: 'Paste this snippet before the closing </head> tag on every page you want to track.',
  GTM: 'Create a Custom HTML tag in Google Tag Manager, paste this snippet, set the All Pages trigger, then save and publish.',
  Shopify: 'Paste this snippet in your storefront theme.liquid file before the closing </head> tag, then save the theme.',
}

function CodeBlock({ code, onCopy, copied }: { code: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative">
      <pre className="bg-zinc-50 text-zinc-900 border border-border rounded-lg p-4 pr-12 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
      <button
        type="button"
        onClick={onCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors"
        title={copied ? 'Copied' : 'Copy code'}
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied
          ? <CheckCircle className="h-3.5 w-3.5 text-primary" />
          : <Copy className="h-3.5 w-3.5 text-zinc-500" />
        }
      </button>
    </div>
  )
}

export function PixelInstallTabs({ snippet }: { snippet: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('HTML')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const handleCopy = async () => {
    setCopied(false)
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
    } catch {
      setCopyError('Could not copy the snippet. Select the code and copy it manually.')
    }
  }

  if (!snippet.trim()) {
    return <p role="alert" className="text-sm text-muted-foreground">The installation snippet is unavailable. Contact support to recover your pixel installation code.</p>
  }

  return (
    <div>
      <div className="flex gap-0 border border-border rounded-lg overflow-hidden mb-3 w-fit">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setCopied(false)
              setCopyError(null)
            }}
            aria-pressed={activeTab === tab}
            className={`px-4 py-2 text-sm font-medium border-r border-border last:border-r-0 transition-colors ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <CodeBlock code={snippet} onCopy={handleCopy} copied={copied} />
      {copyError && <p role="alert" className="text-sm text-destructive mt-2">{copyError}</p>}
      <p className="text-xs text-muted-foreground mt-2">{INSTRUCTIONS[activeTab]}</p>
    </div>
  )
}
