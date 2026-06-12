'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'

interface LinkItem {
  label: string
  description: string
  url: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function LinksClient({ code }: { code: string }) {
  const links: LinkItem[] = [
    {
      label: 'VSL offer (primary)',
      description: 'Self-serve checkout for the $97/$197/$247 plans. Your best converter.',
      url: `https://leads.meetcursive.com/get-leads?ref=${code}`,
    },
    {
      label: 'Lead magnet — Visitor Estimate',
      description: 'Free calculator showing how many leads a site is losing. Great top-of-funnel.',
      url: `https://leads.meetcursive.com/visitor-estimate?ref=${code}`,
    },
    {
      label: 'Pricing page',
      description: 'For prospects who want to compare plans first.',
      url: `https://www.meetcursive.com/pricing?ref=${code}`,
    },
    {
      label: 'Homepage',
      description: 'General-purpose link for bios, posts, and signatures.',
      url: `https://www.meetcursive.com?ref=${code}`,
    },
  ]

  const swipes = [
    {
      label: 'Cold email',
      text: `Subject: the leads your site is quietly losing\n\nHi {{first_name}},\n\nMost B2B sites can identify 40–60% of anonymous visitors — by company AND person — but almost nobody turns that on. Cursive installs in 60 seconds and turns that traffic into contactable leads.\n\nQuick way to see what you're missing (free, no signup): https://leads.meetcursive.com/visitor-estimate?ref=${code}\n\nIf the number looks big, the pixel is $97/mo: https://leads.meetcursive.com/get-leads?ref=${code}\n\n— {{your_name}}`,
    },
    {
      label: 'LinkedIn post',
      text: `Your website knows more about your visitors than your CRM does — you're just not capturing it.\n\nCursive identifies 40–60% of anonymous B2B traffic (company + person), installs in 60 seconds, and syncs straight to your pipeline.\n\nSee how many leads your site is losing (free tool): https://leads.meetcursive.com/visitor-estimate?ref=${code}`,
    },
  ]

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Your referral links</h3>
        <div className="space-y-3">
          {links.map((l) => (
            <div key={l.url} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{l.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{l.description}</p>
                  <p className="mt-2 truncate font-mono text-xs text-primary">{l.url}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50"
                    aria-label="Open link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <CopyButton text={l.url} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Swipe copy</h3>
        <div className="space-y-3">
          {swipes.map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{s.label}</p>
                <CopyButton text={s.text} />
              </div>
              <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
                {s.text}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
