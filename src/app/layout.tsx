import type { Metadata, Viewport } from 'next'
import { SkipLink } from '@/components/ui/skip-link'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cursive - Buyer-Intent Lead Generation',
  description: 'Get buyer-intent leads from enrichment platforms delivered to your dashboard. Auto-routed by location and industry.',
  keywords: ['lead generation', 'buyer intent', 'service industry leads', 'HVAC leads', 'roofing leads', 'plumbing leads'],
  authors: [{ name: 'Cursive' }],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7c3aed',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
