import { generateMetadata } from '@/lib/seo/metadata'
import { Metadata } from 'next'

const baseMetadata = generateMetadata({
  title: 'Audience Builder | Build Unlimited B2B & B2C Audiences | No Caps',
  description: 'Build unlimited audiences with 220M+ consumer and 140M+ business profiles. Filter by demographics, firmographics, and 450B+ monthly intent signals. No size limits, no export caps.',
  keywords: ['audience builder', 'B2B audience builder', 'B2C audience targeting', 'intent-based targeting', 'audience segmentation', 'lookalike audiences', 'custom audience builder'],
  canonical: 'https://meetcursive.com/audience-builder',
})

export const metadata: Metadata = {
  ...baseMetadata,
  other: {
    'script:ld+json:software': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": "https://meetcursive.com/audience-builder#product",
      "name": "Cursive Audience Builder",
      "description": "Build unlimited B2B and B2C audiences with 220M+ consumer profiles and 140M+ business profiles. Filter by demographics, firmographics, and 450B+ monthly intent signals.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "brand": {
        "@type": "Brand",
        "name": "Cursive"
      },
      "offers": {
        "@type": "Offer",
        "url": "https://meetcursive.com/audience-builder",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }
    }),
    'script:ld+json:breadcrumb': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://meetcursive.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Audience Builder",
          "item": "https://meetcursive.com/audience-builder"
        }
      ]
    }),
    'script:ld+json:faq': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How large is your B2B and B2C database?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Cursive provides access to 220M+ consumer profiles and 140M+ business profiles across the United States. Our database is updated in real-time with fresh intent signals and verified contact information."
          }
        },
        {
          "@type": "Question",
          "name": "Are there limits on audience size?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Unlike other data providers, Cursive has no caps on audience size, exports, or activations. Build audiences as large or as targeted as you need for your campaigns."
          }
        },
        {
          "@type": "Question",
          "name": "How fresh is your intent data?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our intent signals are updated in real-time. We track 450B+ monthly signals across 30,000+ categories, so you're always reaching prospects at the right moment."
          }
        },
        {
          "@type": "Question",
          "name": "Can I filter audiences by intent signals?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Cursive lets you filter audiences by specific topics, keywords, and behaviors. Build segments of people actively researching solutions like yours."
          }
        },
        {
          "@type": "Question",
          "name": "How do I activate audiences once I build them?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "One-click activation to 200+ platforms including Facebook Ads, Google Ads, LinkedIn Ads, email platforms, and CRMs. Audiences sync automatically to your connected tools."
          }
        },
        {
          "@type": "Question",
          "name": "Is the data GDPR and CCPA compliant?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. All data honors opt-outs and complies with GDPR, CCPA, and regional privacy regulations. We use consent-aware activation and hashed identifiers."
          }
        },
        {
          "@type": "Question",
          "name": "Can I build lookalike audiences?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely. Upload your customer list and Cursive will find similar prospects based on firmographics, demographics, technographics, and behavioral patterns."
          }
        },
        {
          "@type": "Question",
          "name": "What types of filters are available?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Filter by company size, industry, revenue, location, job title, seniority, technologies used, intent signals, and dozens of other attributes. Combine filters for precise targeting."
          }
        },
        {
          "@type": "Question",
          "name": "Can I share audiences with partners?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Cursive includes a data clean room for secure audience sharing with partners while maintaining privacy compliance."
          }
        },
        {
          "@type": "Question",
          "name": "How quickly can I build an audience?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most audiences are built in minutes. Apply your filters, preview the results, and activate immediately. No waiting for batch processing or manual approvals."
          }
        }
      ]
    })
  }
}

export default function AudienceBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
