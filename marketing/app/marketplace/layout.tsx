import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'B2B Lead Marketplace — Verified Leads from $0.60/Lead | Cursive',
  description: 'Self-serve B2B lead marketplace with verified contacts. Buy credits from $0.60/lead, filter by industry, seniority, and intent signals. Start free with 100 credits. No contracts.',
  keywords: [
    'B2B lead marketplace',
    'buy leads online',
    'verified B2B contacts',
    'lead credits',
    'on-demand lead generation',
    'self-serve lead platform',
    'B2B contact database',
    'lead list marketplace',
    'buy b2b leads',
    'b2b leads for sale',
  ],
  canonical: 'https://www.meetcursive.com/marketplace',
})

const marketplaceFAQs = [
  {
    question: 'How much do leads cost in the Cursive marketplace?',
    answer: 'Lead credits start at $0.60 per lead. New accounts receive 100 free credits (up to $60 value) with no credit card required. Bulk credit packages are available at volume discounts. Each credit unlocks one lead record with full verified contact information.',
  },
  {
    question: 'What information is included with each lead?',
    answer: 'Each lead includes: full name, verified email address, job title, company name, company size, industry, LinkedIn profile URL, location, and phone number (where available). B2B leads may also include company revenue, technologies used, and intent signal data.',
  },
  {
    question: 'How are leads verified?',
    answer: 'All leads in the Cursive marketplace go through multi-step verification: email syntax validation, MX record verification, SMTP verification, and real-time deliverability scoring. We maintain 95%+ email deliverability across all marketplace leads.',
  },
  {
    question: 'Can I filter leads by specific criteria?',
    answer: 'Yes. Filter marketplace leads by industry, company size, revenue range, job title, seniority level, geographic location, technologies used, and intent signals. Combine multiple filters to build highly targeted lead lists for your specific ICP.',
  },
  {
    question: 'Do credits expire?',
    answer: 'No. Cursive marketplace credits never expire. Once purchased, you can use them at any time. There are no monthly minimums or use-it-or-lose-it policies.',
  },
  {
    question: 'How many leads can I buy at once?',
    answer: 'There are no limits. You can purchase as few as 1 lead or as many as tens of thousands at once. Bulk export is available with CSV download directly from the marketplace.',
  },
  {
    question: 'Can I preview leads before buying?',
    answer: 'Yes. The marketplace shows you a preview of each lead\'s company, title, and location before you spend credits. This lets you evaluate lead quality and relevance before committing.',
  },
]

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Marketplace', url: 'https://www.meetcursive.com/marketplace' },
        ]),
        generateFAQSchema(marketplaceFAQs),
      ]} />
      {children}
    </>
  )
}
