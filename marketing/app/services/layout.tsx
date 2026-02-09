import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Done-For-You Lead Generation Services',
  description: 'Let Cursive handle your lead generation. Three tiers: Cursive Data ($1k/mo), Cursive Outbound ($2.5k/mo), and Cursive Pipeline ($5k/mo). AI-powered campaigns that book meetings.',
  keywords: [
    'done-for-you lead generation',
    'AI outbound',
    'managed campaigns',
    'B2B lead gen services',
    'AI SDR service',
    'outsourced lead generation',
    'managed outbound',
    'lead generation agency',
  ],
  canonical: 'https://meetcursive.com/services',
})

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Services', url: 'https://meetcursive.com/services' },
      ])} />
      {children}
    </>
  )
}
