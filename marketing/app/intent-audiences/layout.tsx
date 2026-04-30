import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Intent Data Audiences \u2014 15M-Domain Network, ~50K Segments | Cursive',
  description: 'Pre-built intent audience segments across 8 high-value verticals. 280M+ verified consumer profiles activated through a 15M+ domain organic intent network and ~50,000 white-label segments. Closed feedback loop validated against real conversion outcomes.',
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
    answer: 'Intent data tracks online research behavior to identify people actively researching topics related to your product or service. Cursive layers a 15M+ domain organic intent network on top of standard SSP feeds (the rest of the industry pulls from the same pool of ~40,000 signal-source domains) and exposes ~50,000 white-label intent segments via a taxonomy endpoint. A closed feedback loop maps signals back to source URLs/apps/exchanges and validates against real conversion outcomes.',
  },
  {
    question: 'What types of intent signals does Cursive track?',
    answer: 'Cursive tracks first-party signals (your website visitors and engagement), third-party signals (research across the 15M+ domain organic network and standard SSP publisher pool), and behavioral signals (content consumption patterns, comparison shopping). These are combined into three intent tiers: Hot (7-day activity), Warm (14-day), and Scale (30-day).',
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
    answer: 'Cursive exposes ~50,000 white-label intent segments via a taxonomy endpoint, spanning technology, financial services, healthcare, real estate, and more. You can target buyers researching specific software, services, or business challenges most relevant to your ICP.',
  },
  {
    question: 'How does Cursive intent data compare to Bombora or 6sense?',
    answer: 'Bombora and 6sense pull from the same ~40,000 signal-source publisher domains (out of ~700,000 SSP sites) that the rest of the industry uses. Cursive layers a proprietary 15M+ domain organic network on top of those SSP feeds \u2014 the actual moat. Updates run every 7 days vs monthly snapshots from many providers. Unlike 6sense (which requires $50k-$200k/year enterprise contracts), Cursive self-serve marketplace starts at $0.60/lead, managed services from $1,000/month, and committed-tier pricing from $15K/month.',
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
