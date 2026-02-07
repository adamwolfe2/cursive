import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Real Estate Lead Generation & Visitor Identification',
  description: 'Identify prospective buyers and sellers visiting your listings. Automate direct mail campaigns, build targeted audiences, and convert more real estate leads with Cursive.',
  keywords: ['real estate lead generation', 'real estate visitor identification', 'real estate marketing automation', 'property buyer targeting', 'real estate direct mail', 'listing visitor tracking'],
  canonical: 'https://meetcursive.com/industries/real-estate',
})

export default function RealEstateLayout({ children }: { children: React.ReactNode }) {
  return children
}
