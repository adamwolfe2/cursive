export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cursive',
    url: 'https://meetcursive.com',
    logo: 'https://meetcursive.com/cursive-logo.png',
    description: 'AI-powered B2B lead generation and outbound automation. Identify 70% of anonymous website visitors and automate personalized outreach.',
    sameAs: [
      'https://twitter.com/meetcursive',
      'https://linkedin.com/company/cursive',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Sales',
      url: 'https://cal.com/cursive/30min',
      email: 'hello@meetcursive.com',
    },
  }
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cursive',
    url: 'https://meetcursive.com',
    description: 'AI-powered visitor identification and outbound automation platform for B2B companies.',
    publisher: {
      '@type': 'Organization',
      name: 'Cursive',
      url: 'https://meetcursive.com',
    },
  }
}

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cursive',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '1000',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '1000.00',
        priceCurrency: 'USD',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitCode: 'MON',
        },
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    description: 'AI-powered B2B lead generation platform that identifies anonymous website visitors and automates multi-channel outreach.',
    featureList: [
      'Visitor Identification',
      'AI-Powered Outreach',
      'Intent Data',
      'Audience Builder',
      'CRM Integration',
      'Direct Mail Automation',
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
  author: string
  publishDate: string
  image: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    datePublished: post.publishDate,
    image: post.image,
  }
}
