/**
 * Marketing Site Layout
 * LeadMe Platform
 *
 * Simple layout for marketing pages.
 */

import Link from 'next/link'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export const metadata = {
  title: {
    default: 'LeadMe - B2B Lead Intelligence Platform',
    template: '%s | LeadMe',
  },
  description: 'Find companies actively researching your solution. Get enriched contact data delivered to your inbox daily.',
  keywords: ['B2B leads', 'lead generation', 'intent data', 'sales intelligence'],
}

function SimpleNavigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-lg text-zinc-900">LeadMe</span>
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
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
            >
              Get Started
            </Link>
          </div>

          <Link
            href="/signup"
            className="md:hidden px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
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
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-zinc-900">LeadMe</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <Link href="/pricing" className="hover:text-zinc-900">Pricing</Link>
            <Link href="/login" className="hover:text-zinc-900">Sign In</Link>
            <Link href="/signup" className="hover:text-zinc-900">Sign Up</Link>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} LeadMe. All rights reserved.
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
