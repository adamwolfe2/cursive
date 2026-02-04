import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Retail Marketing Solutions',
  description: 'Drive foot traffic and online sales with location-based targeting and consumer intent data.',
  keywords: ['retail marketing', 'store traffic', 'retail customer acquisition', 'location based marketing', 'retail analytics'],
  canonical: 'https://meetcursive.com/industries/retail',
})

export default function RetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
