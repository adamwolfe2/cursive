import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Audience Builder — Free AI Chatbot | Cursive',
  description:
    'Find the perfect audience for your next outbound campaign. Our AI chatbot maps your ICP to 19,000+ pre-built audience segments in seconds. No signup required.',
  openGraph: {
    title: 'Find Your Perfect Audience — Free AI Tool',
    description:
      'Describe your ideal customer. Get matched to 19,000+ pre-built segments instantly.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a
            href="https://meetcursive.com"
            className="flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/cursive-logo.png"
              alt="Cursive"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-sm font-semibold text-[#0F172A]">Cursive</span>
          </a>
          <a
            href="https://meetcursive.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 transition-colors hover:text-slate-900"
          >
            Back to cursive.com →
          </a>
        </div>
      </header>
      {children}
    </div>
  )
}
