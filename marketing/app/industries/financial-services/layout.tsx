import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Financial Services Lead Generation & Visitor Identification',
  description: 'Identify prospects researching financial products on your website. Turn anonymous visitors into qualified leads for banking, insurance, wealth management, and fintech with AI-powered outreach.',
  keywords: ['financial services lead generation', 'bank visitor identification', 'fintech lead gen', 'insurance lead generation', 'financial advisor prospecting', 'wealth management leads', 'financial services website tracking'],
  canonical: 'https://meetcursive.com/industries/financial-services',
})

export default function FinancialServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Financial Services', url: 'https://meetcursive.com/industries/financial-services' },
      ])} />
      {children}
    </>
  )
}
