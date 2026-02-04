import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'B2B Software Marketing Solutions',
  description: 'Lead generation for SaaS and B2B software companies. Identify in-market buyers and accelerate pipeline growth.',
  keywords: ['B2B software marketing', 'SaaS lead generation', 'software buyer intent', 'account based marketing', 'technographic data'],
  canonical: 'https://meetcursive.com/industries/b2b-software',
})

export default function B2BSoftwareLayout({ children }: { children: React.ReactNode }) {
  return children
}
