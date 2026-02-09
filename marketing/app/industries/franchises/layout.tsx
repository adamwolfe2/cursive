import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Franchise Lead Generation & Visitor Identification',
  description: 'Identify website visitors across franchise locations. Generate territory-specific leads at scale with AI-powered outreach, multi-location visitor tracking, and automated local prospecting.',
  keywords: ['franchise lead generation', 'franchise visitor identification', 'multi-location lead gen', 'territory-based prospecting', 'franchise website tracking', 'local franchise marketing', 'franchise customer acquisition'],
  canonical: 'https://meetcursive.com/industries/franchises',
})

export default function FranchisesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Franchises', url: 'https://meetcursive.com/industries/franchises' },
      ])} />
      {children}
    </>
  )
}
