import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SkipLink } from '@/components/ui/skip-link'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'OpenInfo - B2B Lead Intelligence Platform',
  description: 'Identify companies actively researching specific topics',
  keywords: ['B2B', 'lead intelligence', 'sales intelligence', 'company research'],
  authors: [{ name: 'OpenInfo' }],
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb', // Primary color
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
