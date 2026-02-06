import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Services - Monthly Lead Lists, AI Outreach & Data Solutions',
  description: 'Explore Cursive services: monthly verified lead lists, AI-powered outreach campaigns, audience building, direct mail automation, and custom data solutions for B2B and B2C companies.',
  keywords: ['Cursive services', 'lead generation services', 'AI outreach', 'monthly lead lists', 'data services', 'B2B marketing services', 'direct mail services', 'audience building services'],
  canonical: 'https://www.meetcursive.com/services',
})

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children
}
