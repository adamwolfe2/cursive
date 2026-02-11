import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Retail Lead Generation & Visitor Identification',
  description: 'Identify anonymous shoppers browsing your online store. Turn website visitors into in-store and online customers with AI-powered outreach, consumer intent data, and cross-channel activation.',
  keywords: ['retail lead generation', 'retail visitor identification', 'online store visitor tracking', 'retail customer acquisition', 'shopper identification', 'retail website tracking', 'omnichannel retail marketing'],
  canonical: 'https://www.meetcursive.com/industries/retail',
})

export default function RetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Retail', url: 'https://www.meetcursive.com/industries/retail' },
      ])} />
      {children}
    </>
  )
}
