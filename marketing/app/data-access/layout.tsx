import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Direct Data Access - B2B & B2C Database',
  description: 'Access 220M+ consumer profiles, 140M+ business profiles, and 30,000+ intent categories. API access, bulk exports, and real-time lookups.',
  keywords: ['B2B data', 'B2C data', 'business database', 'consumer database', 'contact data API'],
  canonical: 'https://meetcursive.com/data-access',
})

export default function DataAccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
