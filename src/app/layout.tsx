import type { Metadata, Viewport } from 'next'
import { SkipLink } from '@/components/ui/skip-link'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'LeadMe - B2B Lead Intelligence Platform',
  description: 'Identify companies actively researching specific topics',
  keywords: ['B2B', 'lead intelligence', 'sales intelligence', 'company research'],
  authors: [{ name: 'LeadMe' }],
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#18181b',
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
