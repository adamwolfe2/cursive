import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Contact Cursive — Book a Demo or Get a Free Visitor ID Audit',
  description: 'Book a demo, get a free visitor identification audit, or reach out to the Cursive team. See how our deterministic pixel resolves 40–60% of your anonymous B2B website visitors (vs 2–5% for cookies, 10–15% for IP databases) and automates personalized outreach.',
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
