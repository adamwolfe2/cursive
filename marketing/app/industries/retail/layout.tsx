import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'B2B Retail Lead Generation - Identify Wholesale Buyers with Cursive',
  description: 'Identify B2B retail buyers and wholesale accounts visiting your site. Convert anonymous traffic into retail partnerships with AI-powered outreach and direct mail.',
  keywords: ['B2B retail lead generation', 'wholesale buyer leads', 'retail visitor identification', 'retail B2B sales', 'wholesale account generation'],
  canonical: 'https://www.meetcursive.com/industries/retail',
})

const retailFAQs = [
  {
    question: 'How does Cursive help B2B retail companies identify wholesale buyers?',
    answer: 'Cursive identifies up to 70% of anonymous companies visiting your B2B retail or wholesale website, revealing which buyers, purchasing managers, and retail chains are researching your product lines and wholesale pricing. Your sales team can then reach out proactively with personalized account proposals, turning anonymous web traffic into identified wholesale opportunities.',
  },
  {
    question: 'What visitor identification rate can retail companies expect?',
    answer: 'B2B retail and wholesale companies using Cursive typically identify up to 70% of their anonymous website visitors, providing a continuous pipeline of warm buyer prospects far beyond what contact forms alone can generate. This high identification rate ensures your sales team always has a rich list of engaged accounts to work, even from modest amounts of monthly website traffic.',
  },
  {
    question: "How do retail companies use Cursive's intent data for buyer targeting?",
    answer: "Cursive's 450 billion+ intent signal database surfaces retail buyers and purchasing managers that are actively researching wholesale suppliers, private label manufacturers, or product categories relevant to your business, even before they visit your website. Retail sales teams use this intent data to proactively identify and engage accounts that are in an active vendor evaluation, dramatically improving outreach timing and conversion rates.",
  },
  {
    question: 'Can Cursive integrate with retail-specific CRM platforms?',
    answer: 'Cursive integrates with HubSpot, Salesforce, and Pipedrive — the most widely used CRMs in B2B retail and wholesale — so identified buyer leads flow automatically into your existing sales pipeline. Webhook support also enables integration with retail-specific platforms and ERP systems for seamless lead routing to the right account manager.',
  },
  {
    question: "How does Cursive's direct mail work for retail B2B outreach?",
    answer: "Cursive triggers personalized direct mail to identified retail buyers who don't engage with digital outreach, sending physical line sheets, product catalogs, or wholesale offer packages with 95%+ deliverability to verified business addresses. This multi-channel approach — combining email, AI-driven outreach, and direct mail — significantly increases response rates from wholesale buyers who receive high volumes of digital communication.",
  },
  {
    question: 'What results do retail companies see with Cursive?',
    answer: 'B2B retail and wholesale companies using Cursive report a consistent increase in new account acquisitions from their existing website traffic, with many attributing significant wholesale revenue to Cursive-identified buyer outreach. Starting at $1,000/month, Cursive delivers compelling ROI for retail brands where a single new wholesale account can represent tens of thousands of dollars in recurring annual revenue.',
  },
]

export default function RetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Retail', url: 'https://www.meetcursive.com/industries/retail' },
        ]),
        generateFAQSchema(retailFAQs),
      ]} />
      {children}
    </>
  )
}
