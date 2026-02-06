import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Pricing - Transparent Plans for Every Growth Stage',
  description: 'Explore Cursive pricing plans for visitor identification, AI outreach, audience building, and direct mail. Transparent pricing starting at $1,000/month with no hidden fees. Compare plans and find your fit.',
  keywords: ['Cursive pricing', 'visitor identification pricing', 'lead generation pricing', 'B2B data pricing', 'intent data pricing', 'AI outreach pricing', 'marketing platform pricing'],
  canonical: 'https://www.meetcursive.com/pricing',
})

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
