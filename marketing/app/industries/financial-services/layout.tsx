import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Financial Services Marketing Solutions',
  description: 'Custom data strategies for banks & financial institutions. Accelerate prospecting, cut CAC, and prove attribution with verified B2B data.',
  keywords: ['financial services marketing', 'bank lead generation', 'financial services data', 'investor targeting', 'borrower targeting'],
  canonical: 'https://meetcursive.com/industries/financial-services',
})

export default function FinancialServicesLayout({ children }: { children: React.ReactNode }) {
  return children
}
