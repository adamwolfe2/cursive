import { generateMetadata as genMeta } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = genMeta({
  title: 'What is B2B Intent Data? Complete Guide (2026)',
  description: 'Learn what B2B intent data is, how it works, types of intent signals (first-party, second-party, third-party), scoring models, use cases, and how to choose the right intent data provider.',
  keywords: [
    'B2B intent data',
    'intent data',
    'buyer intent signals',
    'intent-based marketing',
    'purchase intent data',
    'B2B buying signals',
    'intent data providers',
    'sales intent signals',
    'account-based intent',
    'intent scoring',
  ],
  canonical: 'https://www.meetcursive.com/what-is-b2b-intent-data',
})

const intentDataFAQs = [
  {
    question: 'What is B2B intent data?',
    answer: 'B2B intent data tracks online research behavior to identify companies and individuals who are actively researching topics related to your product or service — before they contact you. Intent signals include website visits to relevant content, search queries, content downloads, review site comparisons, and social media engagement. When a prospect is "in-market," their intent signals spike, alerting sales teams to reach out at exactly the right moment.',
  },
  {
    question: 'What are the types of B2B intent data?',
    answer: 'There are three main types: (1) First-party intent data — signals from your own website (visitor identification, form fills, email opens, page visits); (2) Second-party intent data — signals shared by partner networks (review sites like G2 and Capterra, partner content); (3) Third-party intent data — signals aggregated from publisher networks, tracking research behavior across thousands of websites. Best results come from combining all three types.',
  },
  {
    question: 'How do intent data providers collect and aggregate signals?',
    answer: 'Third-party intent data providers partner with publisher networks (news sites, industry publications, content hubs) and place tracking pixels across their network. When a reader researches topics related to specific product categories, those signals are recorded, aggregated by company and topic, and scored. Cursive processes 450B+ monthly intent signals across 30,000+ commercial categories, updated weekly.',
  },
  {
    question: 'How accurate is B2B intent data?',
    answer: 'Intent data accuracy varies by provider and use case. Third-party intent identifies accounts researching a topic but can have false positives (the researcher may be a student, not a buyer). First-party intent (your own website visitor behavior) is the highest-quality signal. The best approach: combine intent signals with other signals like job title, company size, and CRM status to score overall opportunity quality. Look for providers who refresh data weekly, not monthly.',
  },
  {
    question: 'What is the difference between first-party and third-party intent data?',
    answer: 'First-party intent: signals from your own website — who visited your pricing page, downloaded a whitepaper, or watched a demo. This is the highest-quality, most actionable intent data because these people know your brand. Third-party intent: research behavior across the broader web — people reading competitor reviews, searching for solutions in your category. This is useful for identifying in-market buyers who haven\'t found you yet. First-party intent converts at 3-5x higher rates than third-party.',
  },
  {
    question: 'How do sales teams use intent data?',
    answer: 'Common intent data use cases: (1) Prioritize outreach to accounts showing buying signals this week; (2) Trigger personalized outreach when a target account visits a competitor\'s review page; (3) Suppress outreach to accounts not showing any activity (focus budget on in-market buyers); (4) Identify new accounts in-market that aren\'t yet in your CRM; (5) Accelerate pipeline by alerting AEs when current opportunities show spikes in research activity.',
  },
  {
    question: 'How much does B2B intent data cost?',
    answer: 'Intent data pricing varies widely by provider and scale. Enterprise platforms like Bombora and 6sense can cost $50,000-$200,000/year. Mid-market solutions range from $1,000-$5,000/month. Cursive\'s intent audiences are included in the $1,000/month platform plan, covering 280M+ US profiles with 450B+ monthly intent signals across 30,000+ categories — no separate contract required.',
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'What is B2B Intent Data?', url: 'https://www.meetcursive.com/what-is-b2b-intent-data' },
        ]),
        generateFAQSchema(intentDataFAQs),
      ]} />
      {children}
    </>
  )
}
