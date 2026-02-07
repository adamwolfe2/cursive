import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'B2B Lead Marketplace - Buy Verified Leads On Demand',
  description: 'Self-serve B2B lead marketplace with verified contacts. Buy credits from $0.60/lead, filter by industry, seniority, and intent signals. Start free with 100 credits.',
  keywords: [
    'B2B lead marketplace',
    'buy leads online',
    'verified B2B contacts',
    'lead credits',
    'on-demand lead generation',
    'self-serve lead platform',
    'B2B contact database',
    'lead list marketplace',
  ],
  canonical: 'https://meetcursive.com/marketplace',
})

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children
}
