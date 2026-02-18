import { generateMetadata as genMeta } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = genMeta({
  title: 'What is Account-Based Marketing (ABM)? Complete Guide (2026)',
  description: 'Learn how account-based marketing works, ABM types (one-to-one, one-to-few, one-to-many), the ABM framework, tech stack, measuring success, and implementation strategies for B2B revenue teams.',
  keywords: [
    'account-based marketing',
    'ABM strategy',
    'account-based marketing guide',
    'ABM framework',
    'B2B account targeting',
    'ABM technology stack',
    'ABM campaigns',
    'account-based sales',
    'ABM measurement',
    'ABM implementation',
  ],
  canonical: 'https://www.meetcursive.com/what-is-account-based-marketing',
})

const abmFAQs = [
  {
    question: 'What is account-based marketing (ABM)?',
    answer: 'Account-based marketing (ABM) is a B2B go-to-market strategy where sales and marketing align to treat specific target accounts as markets of one. Rather than casting a wide net and nurturing all leads, ABM focuses resources on a defined list of high-value accounts with personalized campaigns tailored to each account\'s specific business challenges, stakeholders, and buying stage.',
  },
  {
    question: 'What are the three types of ABM?',
    answer: 'ABM comes in three tiers: (1) One-to-one ABM (Strategic ABM) — deeply personalized campaigns for 5-50 named accounts, typically $1M+ deal size; (2) One-to-few ABM (ABM Lite) — clustered campaigns for 50-500 accounts grouped by industry or challenge, for $100k-$1M deals; (3) One-to-many ABM (Programmatic ABM) — scaled, personalized campaigns for 500-10,000 accounts using automation and intent data, for $10k-$100k deals. Most companies run all three tiers simultaneously.',
  },
  {
    question: 'What is the difference between ABM and demand generation?',
    answer: 'Demand generation casts a wide net — creating awareness and generating inbound leads from a broad audience. ABM is outbound and account-specific — targeting a pre-defined list of ideal accounts with personalized campaigns. Demand gen optimizes for lead volume; ABM optimizes for deal quality and win rate within target accounts. The best B2B programs use both: ABM for strategic accounts, demand gen to fill the broader funnel.',
  },
  {
    question: 'What technology do I need for ABM?',
    answer: 'A modern ABM tech stack includes: (1) Account intelligence — intent data and visitor identification to know which accounts are active (Cursive, Bombora, 6sense); (2) CRM — to manage account data and track deal progress (Salesforce, HubSpot); (3) Sales engagement — to execute personalized outreach sequences (Outreach, Salesloft); (4) Ad platform — for account-targeted advertising (LinkedIn Campaign Manager, Demandbase); (5) Direct mail — for physical touchpoints to stand out (Cursive Pipeline). The minimum viable ABM stack is intent data + CRM + email sequencing.',
  },
  {
    question: 'How do I measure ABM success?',
    answer: 'ABM metrics differ from traditional demand gen: account engagement rate (% of target accounts with 2+ touchpoints), pipeline coverage (value of opportunities created from target accounts), average deal size (should be 2-5x non-ABM deals), account win rate (typically 2x higher for ABM vs non-ABM), and time to close (typically shorter due to multi-stakeholder nurturing). Avoid measuring ABM with lead volume — success is account penetration and deal quality, not quantity.',
  },
  {
    question: 'How do I identify which accounts to target for ABM?',
    answer: 'Start with your Ideal Customer Profile (ICP): define your best current customers by industry, company size, revenue, tech stack, and growth stage. Then identify accounts that match but aren\'t yet customers — use a combination of static firmographic filters and dynamic intent signals to prioritize. Accounts showing active buying intent (researching your category this week) should be top priority. Tools like Cursive\'s intent audiences help identify 280M+ in-market profiles matching your ICP.',
  },
  {
    question: 'What is account-based advertising?',
    answer: 'Account-based advertising serves targeted ads only to people within your named account list, across LinkedIn, Google Display, and programmatic networks. Rather than demographic targeting, ABM advertising uses IP-based targeting, CRM uploads, and matched audiences to ensure your ads are shown only to decision-makers at your exact target accounts. This dramatically reduces ad waste — instead of reaching thousands of irrelevant viewers, 100% of your ad spend reaches in-profile contacts.',
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'What is Account-Based Marketing?', url: 'https://www.meetcursive.com/what-is-account-based-marketing' },
        ]),
        generateFAQSchema(abmFAQs),
      ]} />
      {children}
    </>
  )
}
