import { generateMetadata } from '@/lib/seo/metadata'
import { Metadata } from 'next'

const baseMetadata = generateMetadata({
  title: 'Website Visitor Identification - Identify Anonymous B2B Traffic',
  description: 'Identify up to 70% of anonymous website visitors at the company and individual level. Get decision-maker contacts, pages viewed, and intent scores in real-time.',
  keywords: [
    'website visitor identification',
    'anonymous visitor tracking',
    'B2B visitor ID',
    'visitor deanonymization',
    'website visitor tracking',
    'identify website visitors',
    'reverse IP lookup',
    'B2B website intelligence',
  ],
  canonical: 'https://meetcursive.com/visitor-identification',
})

export const metadata: Metadata = {
  ...baseMetadata,
  other: {
    'script:ld+json:product': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": "https://meetcursive.com/visitor-identification#product",
      "name": "Cursive Visitor Identification",
      "description": "Identify up to 70% of anonymous website visitors in real-time. Turn unknown traffic into qualified leads with company and individual-level data.",
      "brand": {
        "@type": "Brand",
        "name": "Cursive"
      },
      "offers": {
        "@type": "Offer",
        "url": "https://meetcursive.com/visitor-identification",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "category": "Visitor Identification Software"
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
          "name": "Visitor Identification",
          "item": "https://meetcursive.com/visitor-identification"
        }
      ]
    }),
    'script:ld+json:faq': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How accurate is visitor identification?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Cursive identifies up to 70% of B2B website traffic—significantly higher than the industry average of 20-30%. We use multiple data sources and real-time enrichment to maximize accuracy."
          }
        },
        {
          "@type": "Question",
          "name": "How quickly can you identify visitors?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Visitors are identified in real-time within seconds of landing on your site. Unlike batch processing tools, Cursive enriches data instantly so you can act on hot leads immediately."
          }
        },
        {
          "@type": "Question",
          "name": "Is visitor identification GDPR compliant?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Cursive is built with privacy compliance at its core. We honor all opt-outs, use hashed identifiers, and comply with GDPR, CCPA, and regional privacy regulations."
          }
        },
        {
          "@type": "Question",
          "name": "What data do you provide for each visitor?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For B2B traffic, we provide company name, industry, size, location, revenue, technologies used, and contact information. For individuals, we include job title, seniority, department, and verified email addresses."
          }
        },
        {
          "@type": "Question",
          "name": "How does visitor identification integrate with my CRM?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Cursive offers native integrations with 200+ platforms including Salesforce, HubSpot, Marketo, and major ad platforms. Identified visitors sync automatically to your existing tools with one-click setup."
          }
        },
        {
          "@type": "Question",
          "name": "Can I filter out existing customers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Cursive includes intelligent filtering to exclude existing customers, internal traffic, bots, and other non-prospects. This ensures your sales team focuses only on new opportunities."
          }
        },
        {
          "@type": "Question",
          "name": "How long does setup take?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Installation takes about 5 minutes. Simply add our JavaScript pixel to your website, and you'll start identifying visitors immediately. No complex configuration required."
          }
        },
        {
          "@type": "Question",
          "name": "What's the difference between company-level and individual-level identification?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Company-level identification reveals which businesses visited your site. Individual-level identification goes deeper to show specific people, their roles, and contact information. Cursive provides both."
          }
        },
        {
          "@type": "Question",
          "name": "Can I see which pages visitors viewed?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely. Cursive tracks page-level behavior so you can see exactly which content each visitor engaged with—pricing pages, feature pages, blog posts, and more. This helps prioritize your outreach."
          }
        },
        {
          "@type": "Question",
          "name": "How much does visitor identification cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pricing varies based on your website traffic volume and activation needs. Book a demo to get a custom quote for your specific use case."
          }
        }
      ]
    })
  }
}

export default function VisitorIdentificationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
