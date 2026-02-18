import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Cursive vs 6sense: $1k/mo All-In vs $50k-$200k/yr Enterprise (2026) | Cursive",
  description: "Compare Cursive and 6sense for B2B revenue intelligence. 6sense costs $50,000-$200,000/year with 6-12 month implementation. Cursive delivers visitor ID, AI outreach, and direct mail for $1,000/month with 24-hour setup.",
  keywords: "cursive vs 6sense, 6sense alternative, 6sense pricing, 6sense cost, 6sense implementation, b2b revenue intelligence, account based marketing, visitor identification, ai outreach, cursive pricing 2026",

  openGraph: {
    title: "Cursive vs 6sense: $1k/mo All-In vs $50k-$200k/yr Enterprise (2026) | Cursive",
    description: "6sense costs $50k-$200k/year with 6-12 month implementation and enterprise sales cycles. Cursive delivers visitor ID + AI outreach + direct mail for $1,000/month, live in 24 hours.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-6sense",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs 6sense: SMB-Friendly vs Enterprise ABM Platform (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs 6sense: $1k/mo All-In vs $50k-$200k/yr Enterprise (2026) | Cursive",
    description: "6sense costs $50k-$200k/year with 6-12 month implementation. Cursive delivers visitor ID + AI outreach + direct mail for $1,000/month, live in 24 hours.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-6sense",
  },

  robots: {
    index: true,
    follow: true,
  },
}

const faqs = [
  {
    question: "What is the main difference between Cursive and 6sense?",
    answer: "6sense is an enterprise ABM and revenue intelligence platform designed for large organizations with dedicated demand generation teams, marketing ops, and six-figure budgets. It offers predictive account scoring, buying stage prediction, and deep CRM integrations — but requires 6-12 months to implement and costs $50,000-$200,000 per year. Cursive is an all-in-one visitor identification and automated outreach platform for B2B teams of all sizes. It installs in 24 hours, costs $1,000/month, and begins generating pipeline from day one without a dedicated RevOps team to manage it."
  },
  {
    question: "How much does 6sense actually cost?",
    answer: "6sense does not publish public pricing but enterprise contracts typically range from $50,000 to $200,000+ per year depending on the number of seats, data volume, and modules purchased. Many companies also pay additional fees for advanced features like the 6sense Data Cloud, conversational email, and advertising integrations. Contracts are typically multi-year annual commitments. Cursive is priced at $1,000/month with month-to-month flexibility and no annual lock-in."
  },
  {
    question: "Is 6sense worth the cost for mid-market companies?",
    answer: "6sense is generally not cost-effective for companies with fewer than 100 employees or annual recurring revenue below $10M. The platform requires a dedicated marketing operations team or RevOps function to configure, maintain, and act on its insights. Without that infrastructure, you pay enterprise prices for capabilities you cannot fully utilize. Cursive is designed to deliver immediate ROI for teams of 5-200 employees without requiring dedicated ops staff."
  },
  {
    question: "How long does 6sense take to implement?",
    answer: "A full 6sense implementation typically takes 6-12 months from contract signing to active use. This includes data integration with your CRM and marketing automation, training your team on the platform, configuring account scoring models, and building out the advertising and outreach workflows. Many teams spend additional months tuning the AI models to accurately reflect their ICP. Cursive installs in 24 hours: add a tracking pixel, connect your CRM, and outreach sequences start running immediately."
  },
  {
    question: "Does Cursive have predictive AI like 6sense?",
    answer: "Cursive uses AI to score visitor intent, personalize outreach messaging, and prioritize which identified visitors receive immediate sales attention versus automated nurture sequences. While Cursive's AI is focused on outreach personalization and conversion rather than long-range predictive account scoring, it delivers the capabilities most B2B teams actually need: knowing who is on your site right now and automatically engaging them with the right message. 6sense's predictive models are more sophisticated but require significantly more data history and operational investment to deliver value."
  },
  {
    question: "Can a small team actually use Cursive effectively?",
    answer: "Yes — Cursive is specifically designed for lean B2B teams. A two-person sales team can install Cursive in a morning, and by afternoon the platform is identifying visitors and triggering AI-personalized outreach automatically. There is no playbook to configure, no ops team to hire, and no training bootcamp. Most Cursive customers see their first replies from identified visitors within the first week of activation. This is the opposite of 6sense, which requires months of onboarding before generating pipeline."
  },
  {
    question: "What does Cursive include that 6sense does not?",
    answer: "Cursive includes direct mail automation — physical postcards and letters sent to identified visitors — which 6sense does not offer. Cursive also includes automated email outreach sequences built into the platform, while 6sense requires a separate email platform (like Outreach or Salesloft) to execute sequences. Cursive's all-in-one approach means your visitor identification, intent scoring, email outreach, and direct mail all flow through one platform at $1,000/month rather than requiring a stack of tools totaling $50,000+/year."
  }
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'Cursive vs 6sense: $1k/mo All-In vs $50k-$200k/yr Enterprise (2026)', url: 'https://www.meetcursive.com/blog/cursive-vs-6sense' },
        ]),
        generateFAQSchema(faqs),
        generateBlogPostSchema({
          title: 'Cursive vs 6sense: $1k/mo All-In vs $50k-$200k/yr Enterprise (2026)',
          description: 'Compare Cursive and 6sense for B2B revenue intelligence. 6sense costs $50,000-$200,000/year with 6-12 month implementation. Cursive delivers visitor ID, AI outreach, and direct mail for $1,000/month with 24-hour setup.',
          url: 'https://www.meetcursive.com/blog/cursive-vs-6sense',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
