import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

/* Breadcrumb only. Metadata lives on the page; the FAQ schema comes from FAQSection (same answers visitors see). */
export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Pricing', url: 'https://www.meetcursive.com/pricing' },
        ])}
      />
      {children}
    </>
  )
}
