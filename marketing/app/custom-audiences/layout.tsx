import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Custom Audiences | Bespoke B2B Lead Lists Built to Your Spec',
  description: 'A fresh weekly list of in-market B2B buyers built to your exact ICP, delivered to Google Sheets. First audience within 24 hours. $197/mo flat, month-to-month, cancel anytime.',
  keywords: ['custom audiences', 'custom lead lists', 'bespoke B2B data', 'targeted lead generation', 'custom audience builder', 'verified lead lists', 'B2B contact lists'],
  canonical: 'https://www.meetcursive.com/custom-audiences',
})

export default function CustomAudiencesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Custom Audiences', url: 'https://www.meetcursive.com/custom-audiences' },
      ])} />
      {children}
    </>
  )
}
