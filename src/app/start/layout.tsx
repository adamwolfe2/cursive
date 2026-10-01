import Image from 'next/image'
import type { Metadata, Viewport } from 'next'
import { BOOKING_URL } from '@/lib/free-leads/contract'
import { scriptFont } from './_components/script-font'
import './start.css'


// The root layout caps zoom at 1x; this flow is read on phones and must allow pinch zoom (WCAG 1.4.4).
export const viewport: Viewport = { maximumScale: 5 }

export const metadata: Metadata = {
  title: 'Get 25 free leads from your website | Cursive',
  description:
    'Paste your website. Cursive works out who buys from you and finds 25 people who fit, with work emails and a reason for each one. Free, no card.',
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#007AFF]'

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`fl-root ${scriptFont.variable} min-h-screen bg-white text-[#111827]`}>
      <header className="sticky top-0 z-30 border-b border-[#e5e7eb]/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[72rem] items-center justify-between gap-4 px-5 sm:px-8">
          <a href="https://meetcursive.com" className={`flex items-center gap-2.5 rounded-md ${FOCUS}`}>
            <Image src="/cursive-logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px]" priority />
            <span className="text-[16px] font-medium tracking-[-0.01em]">Cursive</span>
          </a>
          <nav aria-label="Cursive" className="flex items-center gap-1 sm:gap-2">
            <a
              href="https://meetcursive.com/pricing"
              className={`hidden min-h-11 items-center rounded-md px-3 text-[15px] text-[#4b5563] transition-colors hover:text-[#111827] sm:inline-flex ${FOCUS}`}
            >
              Pricing
            </a>
            <a
              href={BOOKING_URL}
              className={`inline-flex h-10 items-center rounded-lg border border-[#d1d5db] px-4 text-[15px] text-[#111827] transition-colors hover:border-[#9ca3af] hover:bg-[#f9fafb] ${FOCUS}`}
            >
              Book a call
            </a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
