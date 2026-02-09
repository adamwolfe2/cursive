import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Interactive Demos - Experience Cursive',
  description: 'Explore 12 interactive demos showcasing visitor tracking, intent signals, audience building, AI campaigns, and more. See Cursive in action.',
  keywords: ['product demo', 'interactive demo', 'lead generation demo', 'B2B software demo', 'visitor tracking demo'],
  canonical: 'https://meetcursive.com/demos',
})

export default function DemosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Demos', url: 'https://meetcursive.com/demos' },
      ])} />
      {children}
    </>
  )
}
