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
  ogImage = '/cursive-social-preview.png',
  noindex = false,
}: PageMetadata): Metadata {
  const baseUrl = 'https://meetcursive.com'
  const fullTitle = `${title} | Cursive`
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`

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
      images: [
        {
          url: fullOgImage,
          width: 1314,
          height: 1129,
          alt: 'Cursive - Turn Website Visitors Into Booked Meetings - Full-stack lead generation platform',
        }
      ],
      locale: 'en_US',
      type: 'website',
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullOgImage],
      creator: '@meetcursive',
      site: '@meetcursive',
    },

    // Canonical
    alternates: canonical ? { canonical } : undefined,

    // Robots
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
  }
}
