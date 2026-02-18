import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Best Intent Data Providers Compared: 8 Platforms Ranked (2026)',
  description: 'Compare the top 8 B2B intent data providers for 2026. Find the best platform for your team based on signal volume, update frequency, pricing, and integration capabilities.',
  keywords: [
    'intent data providers',
    'best intent data providers',
    'intent data comparison',
    'B2B intent data platforms',
    'buyer intent data providers',
    'intent data providers 2026',
    'compare intent data vendors',
    'intent data software comparison',
  ],
  canonical: 'https://www.meetcursive.com/blog/intent-data-providers-comparison',
})

const intentComparisonFAQs = [
  {
    question: 'What is the best intent data provider for B2B companies in 2026?',
    answer: 'Cursive is the top pick for B2B companies that need intent data plus visitor identification and outreach automation in one platform — at $1,000/month with no long-term commitment. For enterprise ABM budgets, 6sense and Demandbase are comprehensive but require $50k-$200k/year. For pure intent data feeds, Bombora offers the largest third-party network. The best provider depends on your budget, tech stack, and whether you need intent data alone or as part of a full pipeline solution.',
  },
  {
    question: 'How much does intent data cost?',
    answer: 'Intent data pricing varies widely: Cursive includes intent data in its $1,000/month platform (no separate contract); Bombora runs $2,000-$5,000+/month for standalone intent feeds; 6sense costs $50,000-$200,000/year with enterprise contracts; TechTarget Priority Engine is $3,000-$10,000+/month. Intent data as a standalone add-on from enterprise providers typically adds $15,000-$50,000/year to your existing tech spend.',
  },
  {
    question: 'What is the difference between first-party and third-party intent data?',
    answer: 'First-party intent data comes from your own website — who visited your pricing page, downloaded a whitepaper, or watched a demo. This is the highest-quality signal because these people already know your brand. Third-party intent data tracks research behavior across a publisher network (news sites, industry publications) to identify companies researching your category before they find you. Best results combine both: first-party for high-intent follow-up, third-party for top-of-funnel discovery.',
  },
  {
    question: 'How often should intent data be updated?',
    answer: 'Weekly updates are the gold standard. Cursive\'s intent audiences refresh every 7 days. Many competitors (including some enterprise providers) only deliver monthly snapshots, which means you\'re acting on intent signals that may be 30+ days old — past the active buying window for most decisions. Look for providers that offer at minimum weekly refreshes, with real-time signals for first-party intent (website visitor identification).',
  },
  {
    question: 'What signals make up B2B intent data?',
    answer: 'B2B intent data is aggregated from multiple signals: website visits to industry publications and review sites (G2, Capterra, Trustpilot); content downloads and whitepaper consumption; search queries on topic-relevant keywords; LinkedIn activity and job change signals; comparison shopping activity across competitor pages; and webinar/event attendance. Providers aggregate and score these signals by company and topic category.',
  },
  {
    question: 'Can I use intent data with my existing CRM?',
    answer: 'Yes. Most intent data providers integrate with major CRMs. Cursive syncs directly with Salesforce, HubSpot, Pipedrive, and Close — pushing intent scores and audience membership directly into existing contact records so your sales team can prioritize without switching tools. Enterprise providers like 6sense and Demandbase also offer deep CRM integrations but require more setup and admin.',
  },
  {
    question: 'Is Bombora or 6sense better for intent data?',
    answer: 'Bombora and 6sense serve different needs. Bombora is a pure intent data provider — the largest third-party B2B intent network, feeding data to many other platforms. 6sense is a full ABM platform that incorporates Bombora intent data along with AI-driven account scoring, advertising, and sales alerting. 6sense is more comprehensive but costs $50,000-$200,000/year. Bombora standalone is available for $2,000-$5,000+/month but requires you to build your own activation layer. Cursive offers comparable intent signal volume at $1,000/month with activation built in.',
  },
]

export default function IntentDataComparisonLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'Intent Data Providers Comparison', url: 'https://www.meetcursive.com/blog/intent-data-providers-comparison' },
        ]),
        generateFAQSchema(intentComparisonFAQs),
        generateBlogPostSchema({
          title: 'Best Intent Data Providers Compared: 8 Platforms Ranked (2026)',
          description: 'Compare the top 8 B2B intent data providers for 2026. Find the best platform for your team based on signal volume, update frequency, pricing, and integration capabilities.',
          url: 'https://www.meetcursive.com/blog/intent-data-providers-comparison',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
