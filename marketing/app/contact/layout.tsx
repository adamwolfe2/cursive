import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Contact Us - Get in Touch with Cursive',
  description: 'Contact the Cursive team for questions about visitor identification, audience building, direct mail, and data solutions. Book a demo or reach out via email, phone, or chat.',
  keywords: ['contact Cursive', 'get in touch', 'book a demo', 'sales inquiry', 'customer support', 'B2B lead generation contact'],
  canonical: 'https://www.meetcursive.com/contact',
})

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Contact', url: 'https://www.meetcursive.com/contact' },
      ])} />
      {children}
    </>
  )
}
