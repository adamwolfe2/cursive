import Image from 'next/image'
import type { Metadata, Viewport } from 'next'
import './start.css'

// The root layout caps zoom at 1x; this flow is read on phones and must allow pinch zoom (WCAG 1.4.4).
export const viewport: Viewport = { maximumScale: 5 }

export const metadata: Metadata = {
  title: 'Get 25 free leads from your website | Cursive',
  description:
    'Paste your website. Cursive works out who buys from you and finds 25 people who fit, with work emails and a reason for each one. Free, no card.',
}

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fl-root min-h-screen bg-white text-[#1d2025]">
      <header className="mx-auto flex h-16 w-full max-w-[72rem] items-center px-5 sm:px-8">
        <a
          href="https://meetcursive.com"
          className="flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#007AFF]"
        >
          <Image src="/cursive-logo.png" alt="" width={28} height={28} className="h-7 w-7" priority />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Cursive</span>
        </a>
      </header>
      {children}
    </div>
  )
}
