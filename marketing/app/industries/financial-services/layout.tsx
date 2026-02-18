import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Financial Services Lead Generation - Identify Qualified Prospects with Cursive',
  description: 'Identify companies and advisors researching financial services on your website. Turn anonymous visitors into qualified leads with compliant, AI-powered outreach.',
  keywords: ['financial services lead generation', 'financial advisor lead generation', 'fintech lead generation', 'financial services visitor identification', 'wealth management leads'],
  canonical: 'https://www.meetcursive.com/industries/financial-services',
})

const financialServicesFAQs = [
  {
    question: 'How does Cursive help financial services firms generate qualified leads?',
    answer: 'Cursive identifies up to 70% of anonymous companies and contacts visiting your financial services website, revealing which businesses are researching your advisory services, fintech products, or investment solutions. Your team can then engage these warm prospects with personalized outreach at the moment of peak interest, significantly improving conversion rates compared to cold prospecting.',
  },
  {
    question: 'Is Cursive compliant with financial services regulations?',
    answer: 'Cursive identifies B2B business contacts — company names, professional email addresses, and firmographic data — for use in sales and marketing outreach, which falls within standard B2B marketing practices. Financial services firms should consult with their compliance teams when incorporating any new data provider, and Cursive provides data processing agreements and privacy documentation to support those reviews.',
  },
  {
    question: 'How do financial advisors use visitor identification?',
    answer: 'Financial advisors and RIAs use Cursive to see which business owners, plan sponsors, and corporate finance teams are visiting their website and what services they are exploring. This insight allows advisors to reach out with timely, relevant messaging that speaks directly to the prospect's area of interest, dramatically shortening the sales cycle.',
  },
  {
    question: 'What intent signals indicate someone is looking for financial services?',
    answer: "Cursive's 450 billion+ intent signal database tracks signals such as researching business banking providers, comparing commercial lending rates, evaluating financial planning software, or exploring 401(k) plan administrators. Financial services firms use these signals to surface in-market prospects before competitors and initiate outreach at the optimal moment in the buying journey.",
  },
  {
    question: 'How does Cursive handle data privacy for financial services clients?',
    answer: 'Cursive processes B2B contact data in accordance with applicable privacy laws including CCPA and GDPR, and provides standard data processing agreements for clients who require them. All visitor identification data is limited to professional business information and is used solely for B2B outreach purposes, keeping financial services clients on solid footing with their privacy obligations.',
  },
  {
    question: 'What results do financial services firms see with Cursive?',
    answer: 'Financial services firms using Cursive report a significant uplift in qualified meetings and pipeline from their website traffic, with many customers converting previously anonymous visitors into new client relationships. Starting at $1,000/month, Cursive helps financial services firms maximize the return on their marketing spend by turning every website visit into an identifiable, actionable sales opportunity.',
  },
]

export default function FinancialServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Financial Services', url: 'https://www.meetcursive.com/industries/financial-services' },
        ]),
        generateFAQSchema(financialServicesFAQs),
      ]} />
      {children}
    </>
  )
}
