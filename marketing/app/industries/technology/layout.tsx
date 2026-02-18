import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Technology Lead Generation - Identify Tech Buyers with Cursive',
  description: 'Identify companies evaluating technology solutions on your website. Convert anonymous tech buyers into pipeline with intent data and AI-powered outreach.',
  keywords: ['technology lead generation', 'tech company lead generation', 'software buyer identification', 'technology visitor identification', 'B2B technology sales'],
  canonical: 'https://www.meetcursive.com/industries/technology',
})

const technologyFAQs = [
  {
    question: 'How does Cursive help technology companies identify website visitors?',
    answer: 'Cursive identifies up to 70% of anonymous companies visiting your technology website by matching visitor behavior to its proprietary identity graph, revealing the organizations exploring your product pages, solution briefs, and pricing. Technology companies use this identification to build a warm prospect list from their existing web traffic and prioritize outreach to the highest-intent accounts.',
  },
  {
    question: 'What intent signals indicate a prospect is evaluating technology solutions?',
    answer: "Cursive's 450 billion+ intent signal database tracks behavioral signals such as researching technology vendors in your category, comparing product features across review sites, or downloading competitive analysis content. Technology companies use these signals to identify accounts that are in an active evaluation cycle and initiate outreach before a competitor establishes the relationship.",
  },
  {
    question: "How do technology companies use Cursive's AI SDR for pipeline building?",
    answer: "Cursive's AI SDR automatically crafts personalized outreach messages for each identified technology buyer based on the specific products, integrations, and use case pages they visited on your site. Technology sales teams use the AI SDR to maintain a high volume of relevant, timely outreach without proportionally increasing headcount, accelerating pipeline creation from identified website visitors.",
  },
  {
    question: 'What CRM integrations does Cursive offer for technology sales teams?',
    answer: 'Cursive integrates natively with HubSpot, Salesforce, and Pipedrive — the CRMs most commonly used by technology sales teams — so identified buyer data and intent signals flow automatically into your existing pipeline and activity tracking. Technology companies also use Cursive webhooks to connect to Outreach, Salesloft, and other sales engagement platforms for fully automated workflows.',
  },
  {
    question: 'How does Cursive compare to other B2B data tools for technology companies?',
    answer: "Unlike traditional B2B data providers that sell static contact lists, Cursive combines first-party website visitor identification (up to 70% ID rate) with real-time intent data from 450 billion+ signals to surface accounts that are actively in-market right now. This combination of live behavioral data and proprietary identity resolution gives technology companies a significant advantage over competitors relying on cold outbound lists or generic intent data alone.",
  },
  {
    question: 'What is the typical implementation timeline for technology companies?',
    answer: "Technology companies can install Cursive's JavaScript pixel and begin identifying website visitors within minutes, with CRM integrations and automated outreach workflows typically configured within the first week. Most technology sales teams see their first pipeline opportunities from Cursive-identified visitors within 30 days of going live, with full ROI typically realized within the first 60-90 days at the $1,000/month starting price.",
  },
]

export default function TechnologyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Technology', url: 'https://www.meetcursive.com/industries/technology' },
        ]),
        generateFAQSchema(technologyFAQs),
      ]} />
      {children}
    </>
  )
}
