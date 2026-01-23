/**
 * Marketing Site Layout
 * OpenInfo Platform
 *
 * Root layout for all marketing pages.
 */

import { Navigation } from '@/components/marketing/layout/navigation'
import { Footer } from '@/components/marketing/layout/footer'

export const metadata = {
  title: {
    default: 'OpenInfo - AI-Powered Team Management Platform',
    template: '%s | OpenInfo',
  },
  description: 'The all-in-one platform for teams to manage tasks, track progress, and collaborate with AI-powered insights. Get real-time updates and end-of-day reports.',
  keywords: ['team management', 'task tracking', 'AI', 'productivity', 'collaboration', 'enterprise'],
  authors: [{ name: 'OpenInfo' }],
  creator: 'OpenInfo',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://openinfo.app',
    siteName: 'OpenInfo',
    title: 'OpenInfo - AI-Powered Team Management Platform',
    description: 'The all-in-one platform for teams to manage tasks, track progress, and collaborate with AI-powered insights.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenInfo Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenInfo - AI-Powered Team Management Platform',
    description: 'The all-in-one platform for teams to manage tasks, track progress, and collaborate with AI-powered insights.',
    images: ['/og-image.png'],
    creator: '@openinfo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
