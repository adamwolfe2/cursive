/**
 * SEO Utilities
 * OpenInfo Platform Marketing Site
 *
 * Helpers for generating SEO metadata and structured data.
 */

import type { Metadata } from 'next'

// ============================================
// SITE CONFIG
// ============================================

export const siteConfig = {
  name: 'OpenInfo',
  title: 'OpenInfo - AI-Powered Team Management Platform',
  description:
    'Transform how your team works with intelligent task management, automated reporting, and AI-powered insights. Track progress, boost productivity, and make data-driven decisions.',
  url: 'https://openinfo.io',
  ogImage: 'https://openinfo.io/og-image.png',
  twitterHandle: '@openinfo',
  links: {
    twitter: 'https://twitter.com/openinfo',
    github: 'https://github.com/openinfo',
    linkedin: 'https://linkedin.com/company/openinfo',
  },
  author: {
    name: 'OpenInfo Team',
    url: 'https://openinfo.io/about',
  },
}

// ============================================
// METADATA GENERATORS
// ============================================

interface PageMetadataOptions {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
  canonical?: string
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  keywords?: string[]
}

/**
 * Generate metadata for a page
 */
export function generatePageMetadata(
  options: PageMetadataOptions = {}
): Metadata {
  const {
    title,
    description = siteConfig.description,
    image = siteConfig.ogImage,
    noIndex = false,
    canonical,
    publishedTime,
    modifiedTime,
    authors = [siteConfig.author.name],
    keywords = [],
  } = options

  const pageTitle = title
    ? `${title} | ${siteConfig.name}`
    : siteConfig.title

  const metadata: Metadata = {
    title: pageTitle,
    description,
    keywords: [
      'team management',
      'task tracking',
      'productivity',
      'AI insights',
      'end of day reports',
      'team collaboration',
      ...keywords,
    ],
    authors: authors.map((name) => ({ name })),
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonical || undefined,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteConfig.url,
      title: pageTitle,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title || siteConfig.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [image],
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  }

  // Add article metadata for blog posts
  if (publishedTime) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime,
      modifiedTime: modifiedTime || publishedTime,
      authors,
    }
  }

  return metadata
}

/**
 * Generate metadata for blog posts
 */
export function generateBlogPostMetadata(post: {
  title: string
  description: string
  image?: string
  publishedAt: string
  updatedAt?: string
  author: string
  slug: string
  tags?: string[]
}): Metadata {
  return generatePageMetadata({
    title: post.title,
    description: post.description,
    image: post.image,
    canonical: `${siteConfig.url}/blog/${post.slug}`,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    authors: [post.author],
    keywords: post.tags,
  })
}

// ============================================
// STRUCTURED DATA (JSON-LD)
// ============================================

/**
 * Organization schema for the site
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.linkedin,
      siteConfig.links.github,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-800-OPENINFO',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  }
}

/**
 * Software application schema
 */
export function generateSoftwareSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: siteConfig.description,
    url: siteConfig.url,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '99',
      priceCurrency: 'USD',
      offerCount: '3',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
  }
}

/**
 * FAQ schema for FAQ sections
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Blog post schema
 */
export function generateBlogPostSchema(post: {
  title: string
  description: string
  image?: string
  publishedAt: string
  updatedAt?: string
  author: { name: string; url?: string }
  slug: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image || siteConfig.ogImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: post.author.url || siteConfig.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${post.slug}`,
    },
  }
}

/**
 * Breadcrumb schema
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Pricing page schema
 */
export function generatePricingSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: siteConfig.name,
    description: siteConfig.description,
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        description: 'Perfect for individuals and small projects',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '29',
        priceCurrency: 'USD',
        description: 'For growing teams that need more power',
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '99',
        priceCurrency: 'USD',
        description: 'For large organizations with custom needs',
      },
    ],
  }
}

// ============================================
// JSON-LD COMPONENT HELPER
// ============================================

/**
 * Create JSON-LD script element content
 */
export function jsonLdScriptProps(data: object) {
  return {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data),
    },
  }
}
