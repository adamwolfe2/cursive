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

const APP = 'https://leads.meetcursive.com'

export function LinksClient({ code }: { code: string }) {
  const links: LinkItem[] = [
    {
      label: 'VSL offer (primary)',
      description: 'Self-serve checkout for the $97/$197/$247 plans. Your best converter.',
      url: `${APP}/get-leads?ref=${code}`,
    },
    {
      label: 'Lead magnet — Visitor Estimate',
      description: 'Free calculator showing how many leads a site is losing. Great top-of-funnel.',
      url: `${APP}/visitor-estimate?ref=${code}`,
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

  // Direct-to-Stripe checkout links. Each one sends the prospect straight to
  // the Stripe checkout page for a specific offer with YOUR code baked in — the
  // code rides into Stripe metadata and credits you on every recurring payment.
  const checkout: LinkItem[] = [
    {
      label: 'Pixel — $97/mo',
      description: 'Person + company identification pixel. Lowest entry point — best for cold traffic.',
      url: `${APP}/api/funnel/checkout-redirect?offer=pixel_97&ref=${code}`,
    },
    {
      label: 'Pixel + Audience combo — $247/mo',
      description: 'Full stack: identification pixel + enriched audience targeting. Your highest commission per sale.',
      url: `${APP}/api/funnel/checkout-redirect?offer=bundle_247&ref=${code}`,
    },
    {
      label: 'Audience — $197/mo',
      description: 'Enriched audience data + targeting without the pixel. For teams that already have traffic.',
      url: `${APP}/api/funnel/checkout-redirect?offer=audience_197&ref=${code}`,
    },
  ]

  const swipes = [
    {
      label: 'Cold email',
      text: `Subject: the leads your site is quietly losing\n\nHi {{first_name}},\n\nMost B2B sites can identify 60–70% of anonymous visitors — by company AND person — but almost nobody turns that on. Cursive installs in 60 seconds and turns that traffic into contactable leads.\n\nQuick way to see what you're missing (free, no signup): ${APP}/visitor-estimate?ref=${code}\n\nIf the number looks big, the pixel is $97/mo: ${APP}/api/funnel/checkout-redirect?offer=pixel_97&ref=${code}\n\n— {{your_name}}`,
    },
    {
      label: 'LinkedIn post',
      text: `Your website knows more about your visitors than your CRM does — you're just not capturing it.\n\nCursive identifies 60–70% of anonymous B2B traffic (company + person), installs in 60 seconds, and syncs straight to your pipeline.\n\nSee how many leads your site is losing (free tool): ${APP}/visitor-estimate?ref=${code}`,
    },
    {
      label: 'Short DM / Twitter',
      text: `Quick one — most B2B sites can ID 60–70% of their anonymous visitors (company + person) and almost nobody turns it on.\n\nCursive does it in a 60-sec install. Free check on what your site's losing: ${APP}/visitor-estimate?ref=${code}`,
    },
    {
      label: 'Follow-up email (bump)',
      text: `Subject: re: the leads your site is losing\n\nHi {{first_name}},\n\nFloating this back up. The free estimate takes ~20 seconds and shows exactly how many identifiable visitors your site had last month: ${APP}/visitor-estimate?ref=${code}\n\nIf it's worth acting on, the pixel's $97/mo and installs in 60 seconds: ${APP}/api/funnel/checkout-redirect?offer=pixel_97&ref=${code}\n\nHappy to send a 2-min Loom if that's easier.\n\n— {{your_name}}`,
    },
    {
      label: 'SMS / text',
      text: `{{first_name}} — your site can probably ID 60–70% of its anonymous visitors and turn them into leads. Free 20-sec check: ${APP}/visitor-estimate?ref=${code}`,
    },
  ]

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Your referral links</h3>
        <div className="space-y-3">
          {links.map((l) => (
            <LinkCard key={l.url} item={l} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900">Direct checkout links</h3>
        <p className="mb-3 mt-1 text-xs leading-relaxed text-gray-500">
          Send a prospect straight to the Stripe checkout for a specific plan — your code rides into
          Stripe with the order, so it&apos;s tracked and credited to you on every recurring payment, the
          same as a referral-link signup. Use these when someone&apos;s ready to buy and you don&apos;t need
          the landing page.
        </p>
        <div className="space-y-3">
          {checkout.map((l) => (
            <LinkCard key={l.url} item={l} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900">Swipe copy</h3>
        <p className="mb-3 mt-1 text-xs leading-relaxed text-gray-500">
          Five angles to test. Don&apos;t send the same line to everyone — rotate them: pick one per
          channel (email, LinkedIn, DM, SMS), run it for a week, and keep whichever pulls the most
          clicks. Every link already has your code, so watch <span className="font-medium text-gray-700">Clicks → Signups → Conversions</span>{' '}
          on your Overview to see which variant actually converts, then lean into the winner. Swap{' '}
          <span className="font-mono">{'{{first_name}}'}</span> and{' '}
          <span className="font-mono">{'{{your_name}}'}</span> before sending.
        </p>
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

function LinkCard({ item }: { item: LinkItem }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{item.label}</p>
          <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
          <p className="mt-2 truncate font-mono text-xs text-primary">{item.url}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50"
            aria-label="Open link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <CopyButton text={item.url} />
        </div>
      </div>
    </div>
  )
}
