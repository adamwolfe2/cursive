import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'FAQ - Frequently Asked Questions About Cursive',
  description: 'Get answers to common questions about visitor identification, intent data, audience building, pricing, integrations, data compliance, and how Cursive works for B2B lead generation.',
  keywords: ['Cursive FAQ', 'visitor identification FAQ', 'intent data questions', 'B2B lead generation FAQ', 'audience building questions', 'data compliance FAQ', 'pricing questions'],
  canonical: 'https://www.meetcursive.com/faq',
})

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'FAQ', url: 'https://www.meetcursive.com/faq' },
      ])} />
      {children}
    </>
  )
}
