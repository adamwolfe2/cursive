import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Custom Audiences | Bespoke B2B Lead Lists Built to Your Spec',
  description: 'Tell us exactly who you need to reach. We deliver a verified, custom-built audience list starting with a free 25-lead sample in 48 hours. Starts at $0.50/lead.',
  keywords: ['custom audiences', 'custom lead lists', 'bespoke B2B data', 'targeted lead generation', 'custom audience builder', 'verified lead lists', 'B2B contact lists'],
  canonical: 'https://meetcursive.com/custom-audiences',
})

export default function CustomAudiencesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Custom Audiences', url: 'https://meetcursive.com/custom-audiences' },
      ])} />
      {children}
    </>
  )
}
