const SITE_URL = 'https://www.meetcursive.com'

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Cursive',
    url: SITE_URL,
    logo: `${SITE_URL}/cursive-logo.png`,
    description: 'Cursive finds your buyers, reaches them for you, and gives you the system to run it.',
    sameAs: [
      'https://linkedin.com/company/cursive',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Sales',
      url: 'https://cal.com/cursiveteam/30min',
      email: 'hey@meetcursive.com',
    },
  }
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Cursive',
    url: SITE_URL,
    description: 'Get 25 free B2B leads from your website. Cursive finds your buyers, reaches them for you, and gives you the system to run it.',
    inLanguage: 'en-US',
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

interface PricedOffer {
  name: string
  price: string
  /** Billed monthly when true; otherwise a one-off price. */
  monthly: boolean
}

/** Approved list prices (pivot spec, 2026-10-01). Keep in step with /pricing. */
export const PUBLISHED_OFFERS: PricedOffer[] = [
  { name: 'Free: 25 leads', price: '0', monthly: false },
  { name: 'Starter', price: '197', monthly: true },
  { name: 'Growth', price: '497', monthly: true },
  { name: 'LinkedIn outreach', price: '1497', monthly: true },
  { name: 'LinkedIn and email outreach', price: '2497', monthly: true },
  { name: 'Visitor Pixel add-on', price: '97', monthly: true },
]

function offerSchema(offer: PricedOffer) {
  return {
    '@type': 'Offer',
    name: offer.name,
    price: offer.price,
    priceCurrency: 'USD',
    ...(offer.monthly
      ? {
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: offer.price,
            priceCurrency: 'USD',
            referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitCode: 'MON' },
          },
        }
      : {}),
  }
}

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cursive',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    offers: PUBLISHED_OFFERS.map(offerSchema),
    description: 'Paste your website and get 25 free B2B leads with checked work emails. Then credits or a plan for more, done-for-you LinkedIn and email outreach, and a custom operating-system dashboard.',
    featureList: [
      'Free 25 leads from your website',
      'Lead credits and weekly plans',
      'Done-for-you LinkedIn and email outreach',
      'Custom company dashboard',
      'Visitor Pixel add-on',
    ],
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
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

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateProductSchema(product: {
  name: string
  description: string
  price: string
  currency: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: 'https://schema.org/InStock',
    },
  }
}

export function generateBlogPostSchema(post: {
  title: string
  description: string
  url?: string
  datePublished?: string
  dateModified?: string
  author?: string
  publishDate?: string
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    ...(post.url ? { url: post.url, mainEntityOfPage: { '@type': 'WebPage', '@id': post.url } } : {}),
    ...(post.datePublished || post.publishDate ? { datePublished: post.datePublished || post.publishDate } : {}),
    ...(post.dateModified ? { dateModified: post.dateModified } : {}),
    ...(post.author ? { author: { '@type': 'Person', name: post.author } } : { author: { '@type': 'Organization', name: 'Cursive' } }),
    ...(post.image ? { image: post.image } : {}),
  }
}
