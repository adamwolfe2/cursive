import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'What Is Demand Generation? Complete B2B Guide (2026)',
  description: 'Demand generation creates awareness and interest before buyers are ready to purchase. Learn how it differs from lead gen, which channels work best, and how intent data supercharges your demand gen programs.',
  keywords: [
    'what is demand generation',
    'demand generation definition',
    'demand gen vs lead gen',
    'demand generation channels',
    'demand generation metrics',
    'b2b demand generation',
    'demand generation funnel',
    'demand gen strategy',
    'demand generation intent data',
    'demand generation pipeline',
  ],
  canonical: 'https://www.meetcursive.com/blog/what-is-demand-generation',
})

const demandGenFAQs = [
  {
    question: 'What is demand generation?',
    answer: 'Demand generation is a marketing strategy focused on creating awareness and interest in your product or service before buyers are actively ready to purchase. It encompasses all activities that build brand recognition, educate your target market, and nurture prospects through the early stages of the buying journey — so that when they are ready to buy, your brand is top of mind. Demand gen is broader than lead gen: it includes content marketing, SEO, paid social, events, webinars, and podcasts that plant seeds long before a purchase decision.',
  },
  {
    question: 'How is demand generation different from lead generation?',
    answer: 'Demand generation creates demand where none existed — it educates and builds awareness among buyers who are not yet actively looking. Lead generation captures existing demand from buyers already in-market — collecting contact info via forms, trials, or demos. Think of it this way: demand gen warms the market, lead gen harvests it. Most B2B companies need both: demand gen fills the top of the funnel with educated prospects, while lead gen converts them into pipeline. Demand gen is measured by pipeline influenced and brand awareness; lead gen is measured by volume of leads and MQL-to-SQL conversion.',
  },
  {
    question: 'What are the key metrics for demand generation?',
    answer: 'The most important demand generation metrics are: (1) Pipeline influenced — how much revenue pipeline was touched by demand gen content or programs; (2) Cost per pipeline dollar — demand gen spend divided by pipeline created, ideally under $0.10; (3) MQL-to-SQL rate — the percentage of marketing-qualified leads that sales accepts, ideally 20-40%; (4) Time to pipeline — how long it takes demand gen touches to produce a sales opportunity; (5) Brand search volume — increasing organic branded searches signal growing awareness; (6) Content-assisted deals — deals where prospects engaged with content before closing. Avoid optimizing demand gen purely on MQL volume, which incentivizes quantity over quality.',
  },
  {
    question: 'What channels work best for demand generation?',
    answer: 'The best demand generation channels depend on your audience, but the highest-ROI channels for B2B are: (1) SEO and content marketing — evergreen demand gen that compounds over time; (2) LinkedIn paid social — best for reaching specific job titles and companies at scale; (3) Webinars and virtual events — high-engagement format that builds trust and collects intent signals; (4) Podcasts — growing channel for reaching buyers during commutes and workouts; (5) Thought leadership and PR — positions your brand as the category authority. The most effective demand gen programs use 3-4 channels together so prospects encounter your brand across multiple touchpoints before entering the buying process.',
  },
  {
    question: 'How much does demand generation cost?',
    answer: 'Demand generation budgets vary widely by company size and channel mix. Early-stage startups typically spend $5,000-$20,000/month on demand gen, primarily in content and limited paid social. Mid-market B2B companies spend $20,000-$100,000/month when including paid media, events, and content production. Enterprise companies allocate $500,000+ annually on demand gen programs. The most important metric is not spend but efficiency: aim for a pipeline-to-spend ratio of at least 10:1. Tools like Cursive help you squeeze more pipeline from demand gen budgets by identifying which demand gen visitors are actually in-market — so you follow up on the right traffic.',
  },
  {
    question: 'How does intent data help demand generation?',
    answer: 'Intent data supercharges demand generation by telling you which of your demand gen visitors are actually in-market right now. Without intent data, you send the same nurture sequence to everyone who downloads a whitepaper — whether they are casually browsing or actively evaluating vendors. With intent data, you can identify the 20% of demand gen touches that come from buyers who are also researching competitors and solutions — and prioritize immediate sales follow-up on those accounts. Cursive combines website visitor identification (70% identification rate) with 60B+ behaviors & URLs scanned weekly refreshed weekly, so you know not just who visited your demand gen content but what else they are actively researching.',
  },
  {
    question: 'What is a demand generation funnel?',
    answer: 'A demand generation funnel maps the stages buyers move through from first awareness to sales-ready. The typical B2B demand gen funnel has four stages: (1) Awareness — buyer discovers your brand through content, social, or events; (2) Education — buyer engages with deeper content like webinars, case studies, and comparison guides; (3) Consideration — buyer visits your site, pricing page, or requests more information; (4) Intent — buyer is actively evaluating vendors, requesting demos, or trialing competitors. Most demand gen programs focus on stages 1-2, but the highest-value intervention is identifying buyers at stages 3-4 — when they are on your site but have not yet raised their hand. Visitor identification tools like Cursive surface these high-intent visitors so sales can engage before competitors do.',
  },
]

export default function WhatIsDemandGenerationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'What Is Demand Generation?', url: 'https://www.meetcursive.com/blog/what-is-demand-generation' },
        ]),
        generateFAQSchema(demandGenFAQs),
        generateBlogPostSchema({
          title: 'What Is Demand Generation? Complete B2B Guide (2026)',
          description: 'Demand generation creates awareness and interest before buyers are ready to purchase. Learn how it differs from lead gen, which channels work best, and how intent data supercharges your demand gen programs.',
          url: 'https://www.meetcursive.com/blog/what-is-demand-generation',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
