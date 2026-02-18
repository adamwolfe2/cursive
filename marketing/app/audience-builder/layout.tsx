import { generateMetadata } from '@/lib/seo/metadata'
import { Metadata } from 'next'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = generateMetadata({
  title: 'B2B Audience Builder - 280M Profiles & Intent Signals',
  description: 'Build custom B2B audiences from 280M consumer profiles, 140M+ business profiles, and 60B+ behaviors & URLs scanned weekly. Filter by firmographic, demographic, and behavioral criteria.',
  keywords: [
    'B2B audience builder',
    'intent data audiences',
    'custom audience targeting',
    'lead list builder',
    'B2B prospecting tool',
    'firmographic filtering',
    'intent signal targeting',
    'audience segmentation',
  ],
  canonical: 'https://www.meetcursive.com/audience-builder',
})

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://www.meetcursive.com/audience-builder#product",
  "name": "Cursive Audience Builder",
  "description": "Build unlimited B2B and B2C audiences with 280M US consumer profiles and 140M+ business profiles. Filter by demographics, firmographics, and 60B+ behaviors & URLs scanned weekly.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "brand": { "@type": "Brand", "name": "Cursive" },
  "offers": {
    "@type": "Offer",
    "url": "https://www.meetcursive.com/audience-builder",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}

const audienceBuilderFAQs = [
  { question: 'How large is your B2B and B2C database?', answer: 'Cursive provides access to 280M US consumer profiles and 140M+ business profiles across the United States. Our database is updated in real-time with fresh intent signals and verified contact information.' },
  { question: 'Are there limits on audience size?', answer: 'No. Unlike other data providers, Cursive has no caps on audience size, exports, or activations. Build audiences as large or as targeted as you need for your campaigns.' },
  { question: 'How fresh is your intent data?', answer: 'Our intent signals are updated in real-time. We track 60B+ behaviors & URLs scanned weekly across 30,000+ categories, so you\'re always reaching prospects at the right moment.' },
  { question: 'Can I filter audiences by intent signals?', answer: 'Yes. Cursive lets you filter audiences by specific topics, keywords, and behaviors. Build segments of people actively researching solutions like yours.' },
  { question: 'How do I activate audiences once I build them?', answer: 'One-click activation to 200+ platforms including Facebook Ads, Google Ads, LinkedIn Ads, email platforms, and CRMs. Audiences sync automatically to your connected tools.' },
  { question: 'Is the data GDPR and CCPA compliant?', answer: 'Yes. All data honors opt-outs and complies with GDPR, CCPA, and regional privacy regulations. We use consent-aware activation and hashed identifiers.' },
  { question: 'Can I build lookalike audiences?', answer: 'Absolutely. Upload your customer list and Cursive will find similar prospects based on firmographics, demographics, technographics, and behavioral patterns.' },
  { question: 'What types of filters are available?', answer: 'Filter by company size, industry, revenue, location, job title, seniority, technologies used, intent signals, and dozens of other attributes. Combine filters for precise targeting.' },
  { question: 'Can I share audiences with partners?', answer: 'Yes. Cursive includes a data clean room for secure audience sharing with partners while maintaining privacy compliance.' },
  { question: 'How quickly can I build an audience?', answer: 'Most audiences are built in minutes. Apply your filters, preview the results, and activate immediately. No waiting for batch processing or manual approvals.' },
]

export default function AudienceBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={[
        softwareSchema,
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Audience Builder', url: 'https://www.meetcursive.com/audience-builder' },
        ]),
        generateFAQSchema(audienceBuilderFAQs),
      ]} />
      {children}
    </>
  )
}
