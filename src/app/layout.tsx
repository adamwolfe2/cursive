import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SkipLink } from '@/components/ui/skip-link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenInfo - B2B Lead Intelligence Platform',
  description: 'Identify companies actively researching specific topics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        {children}
      </body>
    </html>
  )
}
