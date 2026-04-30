import { generateMetadata } from '@/lib/seo/metadata'
import { Metadata } from 'next'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = generateMetadata({
  title: 'Website Visitor Identification - Deterministic B2B Traffic Match',
  description: 'Match 40\u201360% of anonymous website visitors deterministically against an offline-rooted identity graph of 280M+ verified consumer profiles, refreshed every 30 days against NCOA. Decision-maker contacts, pages viewed, and intent scores in real-time.',
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
  canonical: 'https://www.meetcursive.com/visitor-identification',
})

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://www.meetcursive.com/visitor-identification#product",
  "name": "Cursive Visitor Identification",
  "description": "Match 40\u201360% of anonymous website visitors deterministically against an offline-rooted identity graph of 280M+ verified consumer profiles refreshed every 30 days against NCOA. Turn unknown traffic into qualified leads with company and individual-level data.",
  "brand": { "@type": "Brand", "name": "Cursive" },
  "offers": {
    "@type": "Offer",
    "url": "https://www.meetcursive.com/visitor-identification",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "category": "Visitor Identification Software"
}

const visitorIdFAQs = [
  { question: 'How accurate is visitor identification?', answer: 'Cursive\u2019s pixel achieves a 40\u201360% match rate on US B2B traffic\u2014deterministic, not modeled. By way of comparison, cookie-sync providers average 2\u20135% and IP-only databases sit around 10\u201315%. Pixel-level accuracy on a matched record is 60\u201380%, driven by geo-framing methodology and an offline-rooted identity graph of 280M+ verified consumer profiles refreshed every 30 days against NCOA.' },
  { question: 'How quickly can you identify visitors?', answer: 'Visitors are identified in real-time within seconds of landing on your site. Unlike batch processing tools, Cursive enriches data instantly so you can act on hot leads immediately.' },
  { question: 'Is visitor identification GDPR compliant?', answer: 'Yes. Cursive is built with privacy compliance at its core. We honor all opt-outs, use hashed identifiers, and comply with GDPR, CCPA, and regional privacy regulations.' },
  { question: 'What data do you provide for each visitor?', answer: 'For B2B traffic, we provide company name, industry, size, location, revenue, technologies used, and contact information. For individuals, we include job title, seniority, department, and verified email addresses.' },
  { question: 'How does visitor identification integrate with my CRM?', answer: 'Cursive offers native integrations with 200+ platforms including Salesforce, HubSpot, Marketo, and major ad platforms. Identified visitors sync automatically to your existing tools with one-click setup.' },
  { question: 'Can I filter out existing customers?', answer: 'Yes. Cursive includes intelligent filtering to exclude existing customers, internal traffic, bots, and other non-prospects. This ensures your sales team focuses only on new opportunities.' },
  { question: 'How long does setup take?', answer: 'Installation takes about 5 minutes. Simply add our JavaScript pixel to your website, and you\'ll start identifying visitors immediately. No complex configuration required.' },
  { question: 'What\'s the difference between company-level and individual-level identification?', answer: 'Company-level identification reveals which businesses visited your site. Individual-level identification goes deeper to show specific people, their roles, and contact information. Cursive provides both.' },
  { question: 'Can I see which pages visitors viewed?', answer: 'Absolutely. Cursive tracks page-level behavior so you can see exactly which content each visitor engaged with—pricing pages, feature pages, blog posts, and more. This helps prioritize your outreach.' },
  { question: 'How much does visitor identification cost?', answer: 'Pricing varies based on your website traffic volume and activation needs. Book a demo to get a custom quote for your specific use case.' },
]

export default function VisitorIdentificationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={[
        productSchema,
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Visitor Identification', url: 'https://www.meetcursive.com/visitor-identification' },
        ]),
        generateFAQSchema(visitorIdFAQs),
      ]} />
      {children}
    </>
  )
}
