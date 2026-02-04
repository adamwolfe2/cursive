import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Marketing Agency Solutions',
  description: 'White-label data solutions for marketing agencies. Scale your services with verified B2B and B2C data.',
  keywords: ['agency marketing platform', 'white label marketing', 'agency lead generation', 'multi-client management', 'agency data solutions'],
  canonical: 'https://meetcursive.com/industries/agencies',
})

export default function AgenciesLayout({ children }: { children: React.ReactNode }) {
  return children
}
