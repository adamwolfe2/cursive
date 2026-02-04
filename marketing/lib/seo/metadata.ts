import { Metadata } from 'next'

interface PageMetadata {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  noindex?: boolean
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = '/og-image.png',
  noindex = false,
}: PageMetadata): Metadata {
  const baseUrl = 'https://meetcursive.com'
  const fullTitle = `${title} | Cursive`

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),

    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url: canonical || baseUrl,
      siteName: 'Cursive',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: 'en_US',
      type: 'website',
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: '@meetcursive',
    },

    // Canonical
    alternates: canonical ? { canonical } : undefined,

    // Robots
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
  }
}
