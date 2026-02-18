import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Intent Data Audiences — 60B+ Monthly Signals, Target In-Market Buyers | Cursive',
  description: 'Pre-built intent audience segments across 8 high-value verticals. Access 280M+ US profiles with 60B+ behaviors & URLs scanned weekly updated every 7 days. Target buyers actively in-market.',
  keywords: [
    'intent data audiences',
    'B2B intent signals',
    'in-market buyer targeting',
    'intent-based marketing',
    'purchase intent data',
    'buyer intent audiences',
    'intent data provider',
    'behavioral targeting',
    'b2b intent data',
    'buyer intent signals',
  ],
  canonical: 'https://www.meetcursive.com/intent-audiences',
})

const intentFAQs = [
  {
    question: 'What is intent data and how does it work?',
    answer: 'Intent data tracks online research behavior to identify people actively researching topics related to your product or service. Cursive tracks 60B+ behaviors & URLs scanned weekly across 30,000+ commercial categories — website visits, content downloads, search queries, and social interactions — to identify in-market buyers before they raise their hand.',
  },
  {
    question: 'What types of intent signals does Cursive track?',
    answer: 'Cursive tracks first-party signals (your website visitors and engagement), third-party signals (research across 30,000+ publisher websites), and behavioral signals (content consumption patterns, comparison shopping). These are combined into three intent tiers: Hot (7-day activity), Warm (14-day), and Scale (30-day).',
  },
  {
    question: 'How often are intent audiences updated?',
    answer: 'Cursive intent audiences refresh weekly. Unlike competitors that deliver monthly snapshots, our audiences are updated every 7 days so you always have access to the most current in-market buyers. Hot intent audiences refresh even more frequently based on real-time signals.',
  },
  {
    question: 'What is the difference between Hot, Warm, and Scale intent tiers?',
    answer: 'Hot intent (7-day): Highest engagement, actively researching right now — best for immediate outreach. Warm intent (14-day): Recent activity, still evaluating — great for nurture sequences. Scale intent (30-day): Broader audience showing earlier-stage interest — ideal for top-of-funnel campaigns and advertising.',
  },
  {
    question: 'How many intent categories does Cursive cover?',
    answer: 'Cursive covers 30,000+ commercial categories spanning technology, financial services, healthcare, real estate, and more. You can target buyers researching specific software, services, or business challenges most relevant to your ICP.',
  },
  {
    question: 'How does Cursive intent data compare to Bombora or 6sense?',
    answer: 'Cursive tracks 60B+ behaviors & URLs scanned weekly vs Bombora\'s 300B+, with updates every 7 days vs monthly snapshots from many providers. Unlike 6sense (which requires $50k-$200k/year enterprise contracts), Cursive\'s intent audiences are available starting at $1,000/month with no long-term commitment.',
  },
  {
    question: 'Can I combine intent data with my own CRM data?',
    answer: 'Yes. Cursive\'s clean room feature lets you match your CRM contacts against intent audiences to prioritize your existing pipeline. You can also exclude current customers and create custom suppression lists to focus only on net-new opportunities.',
  },
]

export default function IntentAudiencesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Intent Audiences', url: 'https://www.meetcursive.com/intent-audiences' },
        ]),
        generateFAQSchema(intentFAQs),
      ]} />
      {children}
    </>
  )
}
