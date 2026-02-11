import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Real Estate Lead Generation & Visitor Identification',
  description: 'Identify prospective buyers and sellers visiting your listings. Automate direct mail campaigns, build targeted audiences, and convert more real estate leads with Cursive.',
  keywords: ['real estate lead generation', 'real estate visitor identification', 'real estate marketing automation', 'property buyer targeting', 'real estate direct mail', 'listing visitor tracking'],
  canonical: 'https://www.meetcursive.com/industries/real-estate',
})

export default function RealEstateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Real Estate', url: 'https://www.meetcursive.com/industries/real-estate' },
      ])} />
      {children}
    </>
  )
}
