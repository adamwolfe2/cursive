import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Franchise Marketing Solutions',
  description: 'Local marketing at scale for franchise systems. Target franchisees with territory-specific campaigns.',
  keywords: ['franchise marketing', 'local marketing automation', 'franchise lead generation', 'territory marketing', 'multi-location marketing'],
  canonical: 'https://meetcursive.com/industries/franchises',
})

export default function FranchisesLayout({ children }: { children: React.ReactNode }) {
  return children
}
