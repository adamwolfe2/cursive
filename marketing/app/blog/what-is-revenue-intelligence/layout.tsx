import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'What Is Revenue Intelligence? Complete Guide for B2B Sales Teams (2026)',
  description: 'Revenue intelligence combines AI analysis of sales activities, customer interactions, and market signals to give revenue teams actionable insights. Learn how it works, what tools are involved, and how to use it.',
  keywords: [
    'what is revenue intelligence',
    'revenue intelligence',
    'revenue intelligence software',
    'revenue intelligence platform',
    'sales intelligence vs revenue intelligence',
    'conversation intelligence',
    'deal intelligence',
    'pipeline intelligence',
    'b2b revenue intelligence tools',
    'revenue intelligence 2026',
  ],
  canonical: 'https://www.meetcursive.com/blog/what-is-revenue-intelligence',
})

const revenueIntelFAQs = [
  {
    question: 'What is revenue intelligence?',
    answer: 'Revenue intelligence is the use of AI and data analysis to capture, analyze, and act on all signals across the revenue process — including sales calls, emails, CRM data, website behavior, and market intent signals. It gives revenue teams a unified view of pipeline health, deal risk, and buyer intent so they can prioritize the right accounts and take the right actions at the right time. Key capabilities include conversation intelligence (call analysis), deal intelligence (pipeline forecasting), and market intelligence (intent data and visitor identification).',
  },
  {
    question: 'What is the difference between revenue intelligence and sales intelligence?',
    answer: 'Sales intelligence focuses on prospecting data — contact information, company data, and technographics used to identify and reach out to potential buyers. Revenue intelligence is broader: it analyzes what happens after a prospect enters your pipeline — how calls go, which deals are at risk, how pipeline is trending, and what buyers are doing between your touchpoints. Revenue intelligence platforms like Gong and Clari analyze your internal sales activities, while sales intelligence tools like ZoomInfo and Apollo provide external contact and company data.',
  },
  {
    question: 'What are the main components of a revenue intelligence platform?',
    answer: 'Revenue intelligence platforms typically include: (1) Conversation intelligence — AI analysis of sales calls and emails to identify talk tracks, objections, and coaching opportunities; (2) Deal intelligence — pipeline health scoring, deal risk detection, and forecast accuracy; (3) Activity intelligence — tracking all rep activities (calls, emails, meetings) automatically; (4) Market intelligence — intent data, visitor identification, and external signals about buyer behavior. Leading platforms combine multiple layers, but many teams assemble a stack (e.g., Gong for conversation intelligence + Cursive for market/visitor intelligence).',
  },
  {
    question: 'What tools are used for revenue intelligence?',
    answer: 'Leading revenue intelligence tools include: Gong (conversation and deal intelligence), Clari (pipeline and forecast intelligence), People.ai (activity intelligence and CRM automation), Chorus.ai (conversation intelligence, acquired by ZoomInfo), Salesforce Einstein (native CRM intelligence), and Cursive (market and visitor intelligence — identifying website visitors and triggering automated outreach based on intent signals). Most enterprise revenue teams use a combination of 2-3 tools covering different intelligence layers.',
  },
  {
    question: 'How does visitor identification fit into revenue intelligence?',
    answer: 'Visitor identification is the market intelligence layer of revenue intelligence. When a prospect visits your pricing page, reads your case studies, or returns for the third time in a week — that is a buying signal. Revenue intelligence platforms that only analyze internal data (calls, emails, CRM) miss this critical signal. Tools like Cursive add the external layer: identifying who is on your website right now, scoring their intent, and feeding that signal into your revenue intelligence stack so sales can act on it immediately.',
  },
  {
    question: 'How much do revenue intelligence platforms cost?',
    answer: 'Revenue intelligence pricing varies widely by capability and scale. Gong pricing starts at approximately $1,200/user/year for conversation intelligence. Clari starts at around $1,500/user/year for pipeline intelligence. Full enterprise revenue intelligence stacks can cost $50,000-$200,000+ per year. Cursive adds the market and visitor intelligence layer starting at $1,000/month — giving teams intent data and visitor identification to complement their conversation and deal intelligence tools.',
  },
  {
    question: 'Do I need a revenue intelligence platform if I have a CRM?',
    answer: 'A CRM like Salesforce or HubSpot stores your data but does not analyze it intelligently. Revenue intelligence platforms sit on top of your CRM to surface insights you would otherwise miss: which deals are at risk based on engagement patterns, which accounts are showing buying intent before they contact you, which talk tracks lead to closed-won deals. For teams that want to move beyond manual data entry and gut-feel forecasting, revenue intelligence is the next layer that makes your CRM data actionable.',
  },
]

export default function WhatIsRevenueIntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'What Is Revenue Intelligence?', url: 'https://www.meetcursive.com/blog/what-is-revenue-intelligence' },
        ]),
        generateFAQSchema(revenueIntelFAQs),
        generateBlogPostSchema({
          title: 'What Is Revenue Intelligence? Complete Guide for B2B Sales Teams (2026)',
          description: 'Revenue intelligence combines AI analysis of sales activities, customer interactions, and market signals to give revenue teams actionable insights. Learn how it works, what tools are involved, and how to use it.',
          url: 'https://www.meetcursive.com/blog/what-is-revenue-intelligence',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
