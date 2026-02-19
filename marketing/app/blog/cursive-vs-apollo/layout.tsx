import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026) | Cursive",
  description: "Compare Cursive and Apollo.io for B2B sales. Apollo has 250M+ contacts for cold outreach at $49/user/mo. Cursive identifies 70% of YOUR website visitors and automates warm, personalized outreach at $1k/mo — no cold lists needed.",
  keywords: "cursive vs apollo, apollo alternative, apollo.io comparison, visitor identification vs prospecting, b2b sales tools, apollo pricing, cursive pricing, cold outreach vs warm outreach, website visitor identification, sales engagement platform",

  openGraph: {
    title: "Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026) | Cursive",
    description: "Apollo has 250M+ contacts for cold outreach at $49/user/mo. Cursive identifies 70% of YOUR website visitors and automates warm, personalized outreach at $1k/mo — no cold lists needed.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-apollo",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs Apollo: Visitor ID vs Prospecting Database (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026) | Cursive",
    description: "Apollo has 250M+ contacts for cold outreach at $49/user/mo. Cursive identifies 70% of YOUR website visitors and automates warm, personalized outreach at $1k/mo — no cold lists needed.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-apollo",
  },

  robots: {
    index: true,
    follow: true,
  },
}

const faqs = [
  {
    question: "What is the fundamental difference between Cursive and Apollo?",
    answer: "Apollo is a prospecting database with 200M+ contacts designed for cold outbound outreach. You search for contacts matching your ICP, build lists, and send cold sequences. Cursive is a visitor identification platform that identifies the specific people visiting YOUR website and automates warm, personalized outreach based on their behavior. Apollo helps you find strangers who might be interested. Cursive identifies people who have already shown interest by visiting your site."
  },
  {
    question: "Is Apollo cheaper than Cursive?",
    answer: "Apollo's entry-level pricing is lower, with a free tier and paid plans starting at $49/user/month. However, when you factor in the tools you need alongside Apollo to match Cursive's capabilities (visitor ID, intent data, AI personalization, direct mail), the total stack cost typically exceeds Cursive's $499-999/month all-in-one pricing."
  },
  {
    question: "Can I use both Apollo and Cursive together?",
    answer: "Yes, and many teams do. The most effective approach is using Cursive as your primary pipeline source for warm visitor outreach (70% of pipeline) and Apollo for supplemental cold outbound to accounts that have not visited your website yet (30% of pipeline). This dual-channel strategy maximizes coverage while prioritizing high-intent prospects for the best response rates."
  },
  {
    question: "Does Apollo identify website visitors?",
    answer: "Apollo offers basic company-level visitor tracking through its website tracking feature, but it does not identify individual visitors. You see that 'someone from Acme Corp' visited your site, but not who specifically. Cursive identifies 70%+ of visitors at the person level with name, email, title, company, LinkedIn, and complete behavioral data, then automates personalized outreach to those individuals."
  },
  {
    question: "What reply rates can I expect from each platform?",
    answer: "Cold email reply rates from databases like Apollo typically run 1-3% for well-optimized sequences. Cursive outreach to identified website visitors consistently runs 20-30% reply rates because the prospects are already warm — they visited your site, they know your brand, and they were actively researching your category when they arrived. The lift comes from targeting people in an active buying window rather than spraying a database of contacts who have no current interest."
  },
  {
    question: "Can Cursive also do cold outreach like Apollo?",
    answer: "Cursive includes access to a 420M+ verified B2B profile database used for enrichment and contact lookup. While Cursive's core workflow is warm visitor identification and outreach, it also provides cold contact access for prospecting. Many teams use Cursive's database to supplement their warm visitor pipeline with targeted cold outreach — all from one platform."
  },
  {
    question: "Which is better for a startup with limited budget?",
    answer: "It depends on your website traffic. If you have minimal traffic (under 500 visitors/month), Apollo's free tier is a great starting point for cold outbound. If you have 1,000+ monthly visitors, Cursive will generate significantly more pipeline per dollar because warm outreach converts at 10-15x higher rates. Most startups with decent website traffic see better ROI from Cursive within the first month."
  },
  {
    question: "Does Apollo have direct mail capabilities?",
    answer: "Apollo does not include direct mail automation. Apollo focuses on email sequences, phone dialing, and LinkedIn tasks. Cursive includes automated direct mail — physical postcards and letters sent to identified visitors — as part of its multi-channel outreach platform. Direct mail combined with email creates a significantly higher conversion rate for high-value prospects."
  }
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026)', url: 'https://www.meetcursive.com/blog/cursive-vs-apollo' },
        ]),
        generateFAQSchema(faqs),
        generateBlogPostSchema({
          title: 'Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026)',
          description: 'Compare Cursive and Apollo.io for B2B sales. Apollo has 250M+ contacts for cold outreach at $49/user/mo. Cursive identifies 70% of YOUR website visitors and automates warm, personalized outreach at $1k/mo — no cold lists needed.',
          url: 'https://www.meetcursive.com/blog/cursive-vs-apollo',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
