import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Cursive vs Demandbase: $1k/mo Person-Level ID vs $50k-$150k/yr Account ABM (2026) | Cursive",
  description: "Compare Cursive and Demandbase for B2B lead generation. Demandbase costs $50,000-$150,000/year with complex implementation. Cursive delivers 70% person-level visitor ID, AI outreach, and direct mail for $1,000/month with 24-hour setup.",
  keywords: "cursive vs demandbase, demandbase alternative, demandbase pricing, demandbase cost, account based marketing alternative, visitor identification, b2b lead generation 2026",

  openGraph: {
    title: "Cursive vs Demandbase: $1k/mo Person-Level ID vs $50k-$150k/yr Account ABM (2026) | Cursive",
    description: "Demandbase costs $50k-$150k/year and identifies companies, not people. Cursive delivers 70% person-level visitor ID + AI outreach + direct mail for $1,000/month, live in 24 hours.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-demandbase",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs Demandbase: Person-Level vs Account-Level B2B Lead Generation (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs Demandbase: $1k/mo Person-Level ID vs $50k-$150k/yr Account ABM (2026) | Cursive",
    description: "Demandbase costs $50k-$150k/year and only identifies companies. Cursive identifies the actual people visiting your site for $1,000/month.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-demandbase",
  },

  robots: {
    index: true,
    follow: true,
  },
}

const faqs = [
  {
    question: "What is the main difference between Cursive and Demandbase?",
    answer: "The most important difference is what each platform actually identifies. Demandbase identifies companies visiting your website — you learn that 'Acme Corp' visited, but not who from Acme Corp. Cursive identifies individual people: you learn that John Smith, VP of Sales at Acme Corp, visited your pricing page at 2:14pm on Tuesday, and you can reach him directly with a personalized email within hours. Demandbase also costs $50,000-$150,000 per year with a complex multi-month implementation. Cursive costs $1,000/month and goes live in 24 hours."
  },
  {
    question: "How much does Demandbase actually cost?",
    answer: "Demandbase does not publish public pricing. Based on customer reports and industry analysis, Demandbase contracts typically range from $50,000 to $150,000+ per year depending on the modules purchased, number of seats, and account volume. Enterprise deployments with advertising activation, full ABM capabilities, and advanced analytics commonly exceed $100,000 annually. Annual contracts are required. Cursive is $1,000/month with no annual commitment."
  },
  {
    question: "Does Demandbase show you individual person names or just company names?",
    answer: "Demandbase primarily provides company-level identification — it tells you which businesses visited your site but does not reliably identify the individual people who visited. To get individual contact information, you need to connect Demandbase data to a separate contact database and match the accounts manually, adding cost and complexity. Cursive identifies individual decision-makers directly: name, verified work email, job title, company, and pages viewed — delivered automatically with no additional enrichment step needed."
  },
  {
    question: "How long does Demandbase take to implement?",
    answer: "A full Demandbase implementation typically takes 3-6 months. This includes enterprise sales cycles, CRM and marketing automation integration, training your marketing and sales team, configuring account-based advertising workflows, and mapping intent data to your sales process. Dedicated RevOps or marketing operations resources are required. Cursive requires adding a tracking pixel (5 minutes), setting your ICP criteria (15 minutes), and approving your first AI outreach sequences — typically live within 24 hours of signing up."
  },
  {
    question: "Is Demandbase worth it for companies under $10M ARR?",
    answer: "Demandbase is generally not cost-effective for companies under $10M ARR. The platform is built for enterprise teams with dedicated ABM programs, marketing operations staff, and budgets that support $50,000-$150,000/year in tooling. Without the organizational infrastructure to act on account-level signals, you end up paying enterprise prices for insights you cannot operationalize. Cursive is designed for B2B teams of 5-200 people: self-service setup, AI-automated outreach, and immediate pipeline impact without a dedicated ABM team."
  },
  {
    question: "Does Cursive have account-based marketing capabilities like Demandbase?",
    answer: "Cursive focuses on person-level identification and automated outreach rather than traditional ABM advertising. Within Cursive, you can segment identified visitors by company, industry, company size, and intent score — which gives you the core account targeting capability. Where Demandbase excels is in its advertising activation layer (serving ads to target accounts across channels). If your primary need is identifying who is visiting your site and engaging those people with personalized outreach, Cursive delivers better results at a fraction of the cost."
  },
  {
    question: "What does Cursive offer that Demandbase does not?",
    answer: "Cursive offers person-level identification (vs company-level), built-in AI email outreach sequences, direct mail automation (physical postcards and letters to identified visitors), and month-to-month pricing — all of which Demandbase does not include at comparable pricing. Cursive's all-in-one approach means visitor identification, AI outreach, and direct mail flow through one platform. With Demandbase, you pay separately for the identification layer, then need additional tools like Outreach, Salesloft, or HubSpot to execute any outreach."
  }
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'Cursive vs Demandbase: $1k/mo Person-Level ID vs $50k-$150k/yr Account ABM (2026)', url: 'https://www.meetcursive.com/blog/cursive-vs-demandbase' },
        ]),
        generateFAQSchema(faqs),
        generateBlogPostSchema({
          title: 'Cursive vs Demandbase: $1k/mo Person-Level ID vs $50k-$150k/yr Account ABM (2026)',
          description: 'Compare Cursive and Demandbase for B2B lead generation. Demandbase costs $50,000-$150,000/year with complex implementation. Cursive delivers 70% person-level visitor ID, AI outreach, and direct mail for $1,000/month with 24-hour setup.',
          url: 'https://www.meetcursive.com/blog/cursive-vs-demandbase',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
