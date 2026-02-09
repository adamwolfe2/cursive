import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Media & Advertising Lead Generation & Visitor Identification',
  description: 'Identify advertisers and brands visiting your media properties. Turn anonymous website traffic into qualified sales leads for publishers, ad networks, and media companies with AI-powered outreach.',
  keywords: ['media lead generation', 'advertising visitor identification', 'publisher lead gen', 'media sales prospecting', 'ad network visitor tracking', 'media company website tracking', 'advertising audience data'],
  canonical: 'https://meetcursive.com/industries/media-advertising',
})

export default function MediaAdvertisingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Media & Advertising', url: 'https://meetcursive.com/industries/media-advertising' },
      ])} />
      {children}
    </>
  )
}
