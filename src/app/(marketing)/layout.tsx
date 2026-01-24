/**
 * Marketing Site Layout
 * Cursive Platform
 *
 * Simple layout for marketing pages.
 */

import Link from 'next/link'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export const metadata = {
  title: {
    default: 'Cursive - Buyer-Intent Lead Generation',
    template: '%s | Cursive',
  },
  description: 'Get buyer-intent leads from enrichment platforms delivered to your dashboard. Auto-routed by location and industry for service businesses.',
  keywords: ['lead generation', 'buyer intent', 'service industry leads', 'HVAC leads', 'roofing leads', 'plumbing leads', 'real estate leads'],
}

function CursiveLogo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  )
}

function SimpleNavigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <CursiveLogo />
            <span className="font-semibold text-lg text-zinc-900">Cursive</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-zinc-600 hover:text-zinc-900">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all"
            >
              Get Started
            </Link>
          </div>

          <Link
            href="/signup"
            className="md:hidden px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  )
}

function SimpleFooter() {
  return (
    <footer className="bg-zinc-50 border-t border-zinc-200 py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <CursiveLogo />
            <span className="font-semibold text-zinc-900">Cursive</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <Link href="/pricing" className="hover:text-zinc-900">Pricing</Link>
            <Link href="/login" className="hover:text-zinc-900">Sign In</Link>
            <Link href="/signup" className="hover:text-zinc-900">Sign Up</Link>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Cursive. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <SimpleNavigation />
      <main className="pt-16">{children}</main>
      <SimpleFooter />
    </div>
  )
}
