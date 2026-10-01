import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Contact Cursive | Book a Call or Get 25 Free Leads',
  description: 'Book a call or message the Cursive team. Or skip the call: paste your website and get 25 leads with work emails, free, no card.',
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
