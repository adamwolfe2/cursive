import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Website Visitor Tracking Pixel - Identify Anonymous Traffic',
  description: 'Install Cursive\'s lightweight tracking pixel to match 40\u201360% of anonymous website visitors deterministically against an offline-rooted identity graph of 280M+ verified consumer profiles. Get company names, decision-maker contacts, and page-level behavior data.',
  keywords: [
    'website tracking pixel',
    'visitor identification pixel',
    'anonymous visitor tracking',
    'B2B website pixel',
    'visitor tracking script',
    'website visitor intelligence',
    'real-time visitor identification',
    'done-for-you pixel setup',
  ],
  canonical: 'https://www.meetcursive.com/pixel',
})

export default function PixelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Visitor Pixel', url: 'https://www.meetcursive.com/pixel' },
      ])} />
      {children}
    </>
  )
}
