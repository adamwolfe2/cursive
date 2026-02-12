// Structured Data Components
// JSON-LD for rich search results

import { Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList } from 'schema-dts'

/**
 * Organization structured data
 */
export function OrganizationSchema() {
  const schema: Organization = {
    '@type': 'Organization',
    '@id': 'https://meetcursive.com/#organization',
    name: 'Cursive',
    url: 'https://meetcursive.com',
    logo: 'https://meetcursive.com/cursive-logo.png',
    description:
      'B2B intent lead intelligence platform that identifies companies actively researching specific topics',
    sameAs: [
      'https://twitter.com/meetcursive',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'hey@meetcursive.com',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Website structured data
 */
export function WebsiteSchema() {
  const schema: WebSite = {
    '@type': 'WebSite',
    '@id': 'https://meetcursive.com/#website',
    url: 'https://meetcursive.com',
    name: 'Cursive',
    description: 'B2B Intent Lead Intelligence Platform',
    publisher: {
      '@id': 'https://meetcursive.com/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://meetcursive.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    } as any,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Software Application structured data
 */
export function SoftwareApplicationSchema() {
  const schema: SoftwareApplication = {
    '@type': 'SoftwareApplication',
    name: 'Cursive',
    operatingSystem: 'Web Browser',
    applicationCategory: 'BusinessApplication',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '50',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '50',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * FAQ structured data
 */
export function FAQSchema(faqs: Array<{ question: string; answer: string }>) {
  const schema: FAQPage = {
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Breadcrumb structured data
 */
export function BreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const schema: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
