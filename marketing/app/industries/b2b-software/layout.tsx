import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'B2B Software Lead Generation - Identify SaaS Trial & Pricing Page Visitors',
  description: 'Turn anonymous SaaS website visitors into qualified leads. Identify companies viewing your pricing and product pages, then automate personalized outreach with AI.',
  keywords: ['B2B software lead generation', 'SaaS lead generation', 'SaaS visitor identification', 'software buyer intent', 'B2B website visitor tracking', 'SaaS pipeline growth', 'account based marketing'],
  canonical: 'https://www.meetcursive.com/industries/b2b-software',
})

const b2bSoftwareFAQs = [
  {
    question: 'How does Cursive help B2B SaaS companies generate leads?',
    answer: 'Cursive identifies up to 70% of anonymous B2B visitors on your SaaS website, revealing the companies and contacts browsing your pricing, trial, and product pages. Once identified, Cursive automatically triggers personalized outreach via email, LinkedIn, or direct mail so your sales team can engage in-market buyers before they convert on a competitor.',
  },
  {
    question: 'What visitor identification rate can B2B software companies expect?',
    answer: 'B2B software companies using Cursive typically identify up to 70% of their anonymous website visitors, far exceeding the industry average of 2-5% achieved through form fills alone. This identification rate applies across pricing pages, feature pages, and free trial signup flows, giving your team a complete view of in-market demand.',
  },
  {
    question: 'How does intent data help SaaS companies find in-market buyers?',
    answer: 'Cursive aggregates 450 billion+ intent signals from across the web, so you can surface companies actively researching software in your category even before they visit your site. By combining third-party intent data with first-party visitor identification, B2B SaaS teams can prioritize outreach to accounts that are genuinely in a buying cycle.',
  },
  {
    question: 'What integrations does Cursive have for B2B SaaS teams?',
    answer: 'Cursive integrates with the most popular CRMs and sales tools used by SaaS companies, including HubSpot, Salesforce, and Pipedrive, so identified leads flow directly into your existing workflows. Webhook and Zapier support allow teams to connect Cursive to virtually any other platform without engineering resources.',
  },
  {
    question: "How do B2B software companies use Cursive's AI SDR?",
    answer: "Cursive's AI SDR automatically crafts personalized outreach messages for each identified visitor based on the pages they viewed, their company profile, and real-time intent signals. SaaS teams use the AI SDR to send timely, relevant emails that reference a prospect's specific product interest, dramatically improving reply rates compared to generic sequences.",
  },
  {
    question: 'What results do B2B SaaS companies typically see with Cursive?',
    answer: 'B2B SaaS companies using Cursive report a significant increase in pipeline from their existing web traffic without increasing ad spend, with many customers attributing 20-40% of new demos booked to Cursive-identified visitors. Starting at $1,000/month, Cursive delivers a positive ROI for most SaaS teams within the first 60 days by converting previously invisible website traffic into qualified sales conversations.',
  },
]

export default function B2BSoftwareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'B2B Software', url: 'https://www.meetcursive.com/industries/b2b-software' },
        ]),
        generateFAQSchema(b2bSoftwareFAQs),
      ]} />
      {children}
    </>
  )
}
