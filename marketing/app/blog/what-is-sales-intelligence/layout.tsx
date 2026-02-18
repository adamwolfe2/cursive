import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'What Is Sales Intelligence? B2B Guide to Data-Driven Selling (2026)',
  description: 'Sales intelligence gives sales teams the data and insights to identify, prioritize, and engage the right prospects at the right time. Learn what types of data it includes, how it differs from CRM, and how to use it.',
  keywords: [
    'what is sales intelligence',
    'sales intelligence definition',
    'sales intelligence data',
    'b2b sales intelligence',
    'sales intelligence tools',
    'firmographic data',
    'technographic data',
    'sales intelligence vs crm',
    'intent data sales',
    'sales intelligence platform',
  ],
  canonical: 'https://www.meetcursive.com/blog/what-is-sales-intelligence',
})

const salesIntelligenceFAQs = [
  {
    question: 'What is sales intelligence?',
    answer: 'Sales intelligence is the collection of data, insights, and signals that help sales teams identify the right prospects, understand their context, prioritize outreach, and personalize engagement. It goes far beyond a contact name and email — sales intelligence includes firmographic data (company size, revenue, industry), technographic data (technology stack), intent signals (what prospects are actively researching), and relationship intelligence (mutual connections, prior interactions). The goal is to give sales reps the context they need to have relevant, timely conversations that convert.',
  },
  {
    question: 'What types of data does sales intelligence include?',
    answer: 'Sales intelligence data falls into five categories: (1) Firmographic data — company size, industry, annual revenue, employee count, funding stage, headquarters location, and growth rate; (2) Technographic data — the software, cloud infrastructure, and tools a company uses, which reveals budget, sophistication, and integration requirements; (3) Intent data — behavioral signals showing what topics, vendors, and solutions a prospect is actively researching right now; (4) Contact data — verified name, work email, direct phone, LinkedIn URL, and job title for individual decision-makers; (5) Relationship intelligence — mutual LinkedIn connections, prior email interactions, and shared communities that can warm up cold outreach.',
  },
  {
    question: 'How is sales intelligence different from CRM data?',
    answer: 'CRM data is static and historical — it captures what your team has recorded about past interactions. Sales intelligence is real-time and external — it tells you what is happening in the market right now. A CRM might show that you spoke to a prospect two years ago. Sales intelligence tells you that the same prospect just visited your pricing page, downloaded a competitor trial, and is actively researching your category on G2. CRM data reflects your relationship history; sales intelligence reflects current market reality. The best revenue teams combine both: CRM for relationship context, sales intelligence for real-time prioritization.',
  },
  {
    question: 'What are the best sales intelligence tools?',
    answer: 'The leading sales intelligence tools in 2026 are: Cursive ($1,000/month) — combines website visitor identification (70% ID rate), 60B+ behaviors & URLs scanned weekly, and 250M+ contact profiles in one platform; ZoomInfo ($15,000-$50,000/year) — largest contact database with technographic data, best for large enterprise teams; Apollo.io ($99-$499/month) — affordable contact database with email sequences, popular with SMB sales teams; Demandbase — intent data and ABM platform for enterprise accounts; 6sense — AI-powered intent and account engagement platform at enterprise pricing. The right tool depends on team size, budget, and whether you need person-level or account-level intelligence.',
  },
  {
    question: 'How much does sales intelligence cost?',
    answer: 'Sales intelligence pricing ranges from $99/month for basic contact databases to $50,000+/year for enterprise intent platforms. ZoomInfo contracts typically run $15,000-$50,000/year for mid-market teams. Apollo.io starts at $99/month per user for contact data and sequences. 6sense and Demandbase are priced for enterprise teams at $50,000-$200,000/year. Cursive provides website visitor identification, intent data, and 250M+ contact profiles for $1,000/month — making it one of the most cost-effective full-stack sales intelligence solutions for growing B2B teams.',
  },
  {
    question: 'What is technographic data in sales intelligence?',
    answer: 'Technographic data reveals which software, cloud services, and technology infrastructure a company uses. This is valuable for sales because technology choices signal budget, sophistication, integration requirements, and competitive displacement opportunities. For example, if you sell a Salesforce integration, technographic data tells you which prospects already use Salesforce — so you can target them specifically. If a prospect uses a competitor product, technographic data reveals the displacement opportunity. Sources of technographic data include job postings (which mention required tools), website source code analysis (tracking scripts, chat widgets), and aggregated data from integration marketplaces.',
  },
  {
    question: 'How does sales intelligence improve win rates?',
    answer: 'Sales intelligence improves win rates through four mechanisms: (1) Better targeting — reaching accounts that fit your ICP instead of spraying cold outreach broadly; (2) Intent-based timing — contacting prospects when they are actively in a buying window, not months before or after; (3) Personalized messaging — using firmographic and technographic context to write outreach that addresses specific pain points and tech stack; (4) Faster follow-up — identifying high-intent prospects who visited your site or engaged with content so sales can follow up while interest is peak. Studies consistently show that responding to in-market signals within the first hour produces 7x higher conversion rates than waiting 24+ hours.',
  },
]

export default function WhatIsSalesIntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'What Is Sales Intelligence?', url: 'https://www.meetcursive.com/blog/what-is-sales-intelligence' },
        ]),
        generateFAQSchema(salesIntelligenceFAQs),
        generateBlogPostSchema({
          title: 'What Is Sales Intelligence? B2B Guide to Data-Driven Selling (2026)',
          description: 'Sales intelligence gives sales teams the data and insights to identify, prioritize, and engage the right prospects at the right time. Learn what types of data it includes, how it differs from CRM, and how to use it.',
          url: 'https://www.meetcursive.com/blog/what-is-sales-intelligence',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
