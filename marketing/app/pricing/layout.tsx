import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Pricing - Self-Serve Credits & Done-For-You Services',
  description: 'Flexible B2B lead generation pricing. Self-serve marketplace credits from $0.60/lead or done-for-you services starting at $1,000/month. Start free with 100 credits.',
  keywords: [
    'B2B lead generation pricing',
    'lead marketplace credits',
    'done-for-you lead gen',
    'outbound pricing',
    'AI SDR pricing',
    'lead generation cost',
    'B2B data pricing',
    'self-serve lead credits',
  ],
  canonical: 'https://meetcursive.com/pricing',
})

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
