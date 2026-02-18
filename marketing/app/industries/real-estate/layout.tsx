import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Real Estate Lead Generation - Identify CRE Prospects with Cursive',
  description: 'Identify companies researching commercial real estate on your site. Turn anonymous visitors into qualified CRE leads with intent data and AI-powered outreach.',
  keywords: ['commercial real estate lead generation', 'CRE lead generation', 'real estate investor leads', 'real estate visitor identification', 'property management leads'],
  canonical: 'https://www.meetcursive.com/industries/real-estate',
})

const realEstateFAQs = [
  {
    question: 'How does Cursive help commercial real estate firms generate leads?',
    answer: 'Cursive identifies up to 70% of anonymous companies visiting your commercial real estate website, revealing which tenants, investors, and buyers are researching your listings, market reports, and investment opportunities. Your brokerage or development team can then reach out proactively with personalized proposals, shortening the sales cycle and increasing deal flow from your existing web traffic.',
  },
  {
    question: 'Can Cursive identify which properties visitors are researching?',
    answer: "Yes — Cursive's visitor identification technology captures not only who is visiting your site but also which listing pages, property types, and market sections they are exploring. This page-level behavioral data allows CRE teams to tailor outreach with specific references to the properties or investment opportunities a prospect was researching, making follow-up conversations immediately relevant.",
  },
  {
    question: "How do real estate investment firms use Cursive's intent data?",
    answer: "Cursive's 450 billion+ intent signal database surfaces companies and family offices that are actively researching commercial real estate investment, specific property sectors, or geographic markets, giving investment firms an early signal of where LP or JV interest may be building. Real estate investment firms use these intent signals to identify and engage potential capital partners before they formally enter the market.",
  },
  {
    question: 'What CRM integrations work best for real estate with Cursive?',
    answer: 'Cursive integrates with HubSpot, Salesforce, and Pipedrive, which are widely used across commercial real estate brokerage and investment firms. For teams using real estate-specific CRMs, Cursive's webhook support enables integration with platforms like Buildout, ClientLook, and others so identified prospects flow seamlessly into existing deal management workflows.',
  },
  {
    question: "How does Cursive's direct mail work for real estate outreach?",
    answer: "Cursive can trigger personalized direct mail to identified prospects who don't respond to digital outreach, sending property brochures, market reports, or investment summaries with 95%+ deliverability to verified business addresses. For high-value CRE transactions where relationship building is essential, this physical touchpoint creates a memorable impression that digital-only outreach cannot replicate.",
  },
  {
    question: 'What results do real estate firms see with Cursive?',
    answer: 'Commercial real estate firms using Cursive report a meaningful increase in qualified meetings and deal flow generated from their website traffic, with identified visitors converting into tenant tours, investor calls, and listing inquiries. Starting at $1,000/month, Cursive delivers strong ROI for CRE firms where a single transaction can generate hundreds of thousands of dollars in fees.',
  },
]

export default function RealEstateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Real Estate', url: 'https://www.meetcursive.com/industries/real-estate' },
        ]),
        generateFAQSchema(realEstateFAQs),
      ]} />
      {children}
    </>
  )
}
