// SEO Configuration
// Default SEO settings for the entire application

import { DefaultSeoProps } from 'next-seo'

const SEO_CONFIG: DefaultSeoProps = {
  defaultTitle: 'Cursive - B2B Intent Lead Intelligence Platform',
  titleTemplate: '%s | Cursive',
  description:
    'Identify companies actively researching your topics. Get enriched B2B lead data delivered automatically. Track intent signals and convert research into revenue.',

  canonical: 'https://meetcursive.com',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://meetcursive.com',
    siteName: 'Cursive',
    title: 'Cursive - B2B Intent Lead Intelligence Platform',
    description:
      'Identify companies actively researching your topics. Get enriched B2B lead data delivered automatically.',
    images: [
      {
        url: 'https://meetcursive.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cursive - B2B Intent Lead Intelligence',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    handle: '@meetcursive',
    site: '@meetcursive',
    cardType: 'summary_large_image',
  },

  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'keywords',
      content:
        'B2B leads, intent data, lead generation, sales intelligence, company research, lead enrichment, contact data, buyer intent, sales leads, marketing leads',
    },
    {
      name: 'author',
      content: 'Cursive',
    },
    {
      httpEquiv: 'x-ua-compatible',
      content: 'IE=edge',
    },
  ],

  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  ],
}

export default SEO_CONFIG

/**
 * Generate dynamic page SEO
 */
export function generatePageSEO(props: {
  title: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
}) {
  return {
    title: props.title,
    description: props.description,
    canonical: props.path ? `https://meetcursive.com${props.path}` : undefined,
    noindex: props.noIndex || false,
    nofollow: props.noIndex || false,
    openGraph: {
      title: props.title,
      description: props.description,
      url: props.path ? `https://meetcursive.com${props.path}` : undefined,
      images: props.image
        ? [
            {
              url: props.image,
              width: 1200,
              height: 630,
              alt: props.title,
            },
          ]
        : undefined,
    },
    twitter: {
      cardType: 'summary_large_image' as const,
      title: props.title,
      description: props.description,
      image: props.image,
    },
  }
}
