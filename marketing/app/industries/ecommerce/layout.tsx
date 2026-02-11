import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'eCommerce & DTC Lead Generation & Visitor Identification',
  description: 'Identify anonymous online shoppers browsing your products. Turn cart abandoners and window shoppers into customers with AI-powered retargeting and personalized outreach across email, SMS, and direct mail.',
  keywords: ['ecommerce lead generation', 'DTC visitor identification', 'online store visitor tracking', 'cart abandonment recovery', 'ecommerce retargeting', 'shopper identification', 'ecommerce customer acquisition'],
  canonical: 'https://www.meetcursive.com/industries/ecommerce',
})

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Ecommerce', url: 'https://www.meetcursive.com/industries/ecommerce' },
      ])} />
      {children}
    </>
  )
}
