import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'What Is Buyer Intent Data? Complete B2B Guide (2026)',
  description: 'Buyer intent data captures behavioral signals showing when a prospect is actively researching a purchase. Learn first-party vs third-party intent, how intent data is collected, and how to act on buying signals before competitors do.',
  keywords: [
    'what is buyer intent data',
    'buyer intent data definition',
    'first party intent data',
    'third party intent data',
    'buyer intent signals',
    'intent data b2b',
    'buying signals',
    'purchase intent data',
    'intent data providers',
    'buyer intent data accuracy',
  ],
  canonical: 'https://www.meetcursive.com/blog/what-is-buyer-intent',
})

const buyerIntentFAQs = [
  {
    question: 'What is buyer intent data?',
    answer: 'Buyer intent data is behavioral information that signals a prospect is actively researching a purchase decision. It captures patterns of online activity — the pages visited, content consumed, searches conducted, and reviews read — that indicate someone is moving through a buying journey rather than casually browsing. Intent data helps sales and marketing teams identify in-market buyers before they raise their hand by filling out a form or requesting a demo, enabling earlier and more relevant outreach when the buying window is open.',
  },
  {
    question: 'What is the difference between first-party and third-party intent data?',
    answer: 'First-party intent data comes from your own digital properties — website visits, pricing page views, demo requests, email link clicks, webinar attendance, and content downloads. You own this data and it is the most accurate because it is directly tied to your brand. Third-party intent data comes from activity outside your owned channels — research on review sites like G2 and Capterra, reading industry publications, viewing competitor websites, and consuming content about your category across the broader web. Third-party intent reveals buyers who are researching your category but have not yet discovered your brand — giving you the ability to reach them before competitors do.',
  },
  {
    question: 'How is intent data collected?',
    answer: 'Intent data is collected through several mechanisms: (1) Website tracking pixels and JavaScript snippets capture first-party signals when visitors browse your own site; (2) Data co-ops aggregate anonymized browsing data from thousands of publisher websites to build third-party intent profiles; (3) Review site partnerships — platforms like G2, Capterra, and TrustRadius share category research signals with intent data providers; (4) IP resolution maps network traffic to company locations; (5) Device fingerprinting creates probabilistic identifiers for individual researchers across sessions. Providers like Cursive combine website visitor identification (matching device signals to 250M+ professional profiles) with third-party intent co-op data to provide person-level and company-level buying signals.',
  },
  {
    question: 'How accurate is intent data?',
    answer: 'Intent data accuracy varies significantly by provider and data type. First-party intent data (your own website) is highly accurate because it directly records real interactions with your brand — though it requires website visitor identification to associate activity with specific people. Third-party intent data ranges from 60-80% accurate depending on the provider's data sources and methodology. Account-level intent (company X is researching topic Y) is more reliable than person-level intent. Weekly-refreshed intent data is significantly more accurate than monthly data because buying windows open and close quickly. Cursive refreshes intent signals weekly and achieves 70% person-level identification rates, making its intent data among the most accurate available.',
  },
  {
    question: 'How long does a buying window last?',
    answer: 'A buying window — the period when a prospect is actively evaluating vendors — typically lasts 30-90 days for B2B software purchases, though this varies by deal size and complexity. Enterprise deals may involve 6-12 month evaluation periods with multiple buying windows at different stages. SMB software decisions often compress into 2-4 weeks. The critical insight is that intent signals peak near the start of active evaluation and fade as the decision is made — meaning stale intent data (60-90 days old) has significantly less value. Teams that act on intent signals within the first week of detection consistently outperform those relying on monthly data refreshes.',
  },
  {
    question: 'How do you use intent data for outreach?',
    answer: 'The most effective intent data workflows follow a four-step process: (1) Detect — identify accounts or individuals showing intent signals through website visitor identification or third-party intent feeds; (2) Qualify — cross-reference intent signals with ICP criteria (company size, industry, tech stack) to focus on high-fit accounts; (3) Route — send high-intent, high-fit accounts to sales for immediate personalized outreach, typically within 24-48 hours of signal detection; (4) Personalize — reference the specific intent signal in outreach (e.g., "I noticed your team has been exploring visitor identification solutions") to dramatically improve response rates. Avoid using intent signals as a blunt outreach trigger — not every intent signal warrants immediate sales contact. Combine intent with ICP fit for the highest conversion rates.',
  },
  {
    question: 'What are the best intent data providers?',
    answer: 'The leading intent data providers in 2026 are: Cursive ($1,000/month) — combines website visitor identification (70% ID rate) with 60B+ third-party intent signals and 250M+ contact profiles, ideal for teams wanting first-party and third-party intent in one platform; Bombora — the largest third-party intent co-op with company-level topic surge data, enterprise pricing; G2 Buyer Intent — captures intent signals directly from G2 review pages, best for software companies; 6sense — AI-powered account intent and predictive scoring at enterprise pricing ($50,000+/year); TechTarget — intent data from IT buyer research, strong for technology vendors. For most growing B2B teams, Cursive provides the best balance of intent data quality, visitor identification, and cost.',
  },
]

export default function WhatIsBuyerIntentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'What Is Buyer Intent Data?', url: 'https://www.meetcursive.com/blog/what-is-buyer-intent' },
        ]),
        generateFAQSchema(buyerIntentFAQs),
        generateBlogPostSchema({
          title: 'What Is Buyer Intent Data? Complete B2B Guide (2026)',
          description: 'Buyer intent data captures behavioral signals showing when a prospect is actively researching a purchase. Learn first-party vs third-party intent, how intent data is collected, and how to act on buying signals before competitors do.',
          url: 'https://www.meetcursive.com/blog/what-is-buyer-intent',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
