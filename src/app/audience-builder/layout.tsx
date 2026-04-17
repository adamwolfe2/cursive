import Image from 'next/image'
import type { Metadata } from 'next'
import { Dancing_Script } from 'next/font/google'

const dancingScript = Dancing_Script({
  variable: '--font-dancing-script',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Audience Builder — Free AI Chatbot | Cursive',
  description:
    'Describe your dream customer. Our AI matches you to 19,000+ pre-built audience segments and pulls real in-market profiles live, in seconds.',
  openGraph: {
    title: 'Describe Your Dream Customer. We\'ll Show You Real Ones.',
    description:
      'Free AI chatbot that maps your ICP to 19,000+ segments and pulls real in-market profiles. No signup.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-screen bg-white ${dancingScript.variable}`}>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a
            href="https://meetcursive.com"
            className="flex items-center"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Back to cursive.com"
          >
            <Image
              src="/cursive-logo.png"
              alt="Cursive"
              width={28}
              height={28}
              className="h-7 w-7"
            />
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
