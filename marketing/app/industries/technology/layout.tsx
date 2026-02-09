import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Technology Industry Lead Generation & ABM Solutions',
  description: 'Accelerate pipeline growth for technology companies. Identify in-market buyers with intent signals, deanonymize website visitors, and activate ABM campaigns across channels.',
  keywords: ['technology lead generation', 'tech industry ABM', 'SaaS visitor identification', 'technology buyer intent', 'B2B tech marketing', 'technology sales pipeline'],
  canonical: 'https://meetcursive.com/industries/technology',
})

export default function TechnologyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Technology', url: 'https://meetcursive.com/industries/technology' },
      ])} />
      {children}
    </>
  )
}
