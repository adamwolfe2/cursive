import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'B2B Software Lead Generation - Identify SaaS Trial & Pricing Page Visitors',
  description: 'Turn anonymous SaaS website visitors into qualified leads. Identify companies viewing your pricing and product pages, then automate personalized outreach with AI.',
  keywords: ['B2B software lead generation', 'SaaS lead generation', 'SaaS visitor identification', 'software buyer intent', 'B2B website visitor tracking', 'SaaS pipeline growth', 'account based marketing'],
  canonical: 'https://meetcursive.com/industries/b2b-software',
})

export default function B2BSoftwareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'B2B Software', url: 'https://meetcursive.com/industries/b2b-software' },
      ])} />
      {children}
    </>
  )
}
