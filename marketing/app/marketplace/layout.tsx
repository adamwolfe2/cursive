import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Lead Marketplace - Browse & Buy Verified B2B Leads Instantly',
  description: 'Self-serve marketplace for verified B2B leads. Browse 50k+ leads, filter by industry, seniority, and intent. Buy with credits starting at $99. Get 100 free credits on signup.',
  keywords: ['B2B lead marketplace', 'buy leads online', 'verified leads', 'lead credits', 'self-serve leads', 'B2B contact data'],
  canonical: 'https://meetcursive.com/marketplace',
})

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children
}
