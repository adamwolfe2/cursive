import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'B2B Data Access - 220M+ Consumer & 140M+ Business Profiles',
  description: 'Direct access to 220M+ consumer profiles and 140M+ business profiles. Query, filter, and export verified contact data on demand via API, bulk exports, or real-time lookups.',
  keywords: [
    'B2B data access',
    'contact data API',
    'business profile database',
    'lead data provider',
    'verified contact data',
    'B2B data enrichment',
    'bulk data export',
    'real-time data lookup',
  ],
  canonical: 'https://meetcursive.com/data-access',
})

export default function DataAccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
