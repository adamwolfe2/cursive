import type { Metadata, Viewport } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { SkipLink } from '@/components/ui/skip-link'
import { Providers } from '@/components/providers'
import { CrispChat } from '@/components/crisp-chat'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://leads.meetcursive.com'),
  title: 'Cursive - AI Intent Systems That Never Sleep',
  description:
    'Cursive identifies real people actively searching for your service, enriches them with verified contact data, and activates them through automated outbound.',
  keywords: [
    'lead generation',
    'AI intent',
    'buyer intent',
    'automated outbound',
    'lead enrichment',
    'sales automation',
    'service industry leads',
    'HVAC leads',
    'roofing leads',
    'plumbing leads',
  ],
  authors: [{ name: 'Cursive' }],
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/cursive-logo.png',
    shortcut: '/cursive-logo.png',
    apple: '/cursive-logo.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://meetcursive.com',
    title: 'Cursive - AI Intent Systems That Never Sleep',
    description:
      'Cursive identifies real people actively searching for your service, enriches them with verified contact data, and activates them through automated outbound.',
    siteName: 'Cursive',
    images: [
      {
        url: '/cursive-logo.png',
        width: 1200,
        height: 630,
        alt: 'Cursive - AI Intent Systems',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursive - AI Intent Systems That Never Sleep',
    description:
      'Cursive identifies real people actively searching for your service, enriches them with verified contact data, and activates them through automated outbound.',
    images: ['/cursive-logo.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#007AFF',
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
          <main id="main-content">
            {children}
          </main>
        </Providers>
        <CrispChat />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
