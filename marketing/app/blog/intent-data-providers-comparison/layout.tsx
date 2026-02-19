import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Intent Data Providers Compared (2026): 6sense, Bombora, Demandbase, G2, Cursive | Cursive",
  description: "Compare the top B2B intent data providers: 6sense, Bombora, Demandbase, G2 Buyer Intent, TechTarget, and Cursive. Pricing, data sources, accuracy, and use cases ranked for 2026.",
  keywords: "intent data providers comparison, best intent data 2026, b2b intent data, bombora vs 6sense, buyer intent data tools, intent data pricing, 6sense alternative, demandbase alternative",

  openGraph: {
    title: "Best Intent Data Providers Compared (2026): 6sense, Bombora, Demandbase, G2, Cursive | Cursive",
    description: "Every major intent data provider ranked: pricing, data sources, accuracy, and which use cases each wins. Includes Bombora, 6sense, Demandbase, G2 Buyer Intent, TechTarget, and Cursive.",
    type: "article",
    url: "https://www.meetcursive.com/blog/intent-data-providers-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Intent Data Providers Comparison 2026: 6sense vs Bombora vs Demandbase vs Cursive",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Intent Data Providers Compared (2026) | Cursive",
    description: "6sense, Bombora, Demandbase, G2 Buyer Intent, TechTarget, and Cursive — every intent data provider ranked by price, accuracy, and use case.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/intent-data-providers-comparison",
  },

  robots: {
    index: true,
    follow: true,
  },
}

const faqs = [
  {
    question: "What is intent data and how does it work?",
    answer: "Intent data is behavioral signal data that reveals which companies or individuals are actively researching a topic, product category, or vendor. First-party intent data comes from your own website — who visited, what pages they viewed, how long they stayed. Third-party intent data is aggregated from across the web: publisher networks, review sites, content syndication platforms, and data co-ops that share signals about what companies are researching off your site. Intent data providers collect, clean, and deliver these signals so sales and marketing teams can prioritize outreach to accounts in an active buying cycle."
  },
  {
    question: "What is the difference between first-party and third-party intent data?",
    answer: "First-party intent data comes from your own digital properties — website visits, content downloads, email opens, form submissions. It is the highest-quality intent signal because it reflects direct engagement with your brand. Third-party intent data is collected from external sources: review sites (G2, Capterra), publisher networks (Bombora co-op), and content syndication platforms. Third-party data reveals what accounts are researching across the internet, not just on your site. The best intent data strategies combine both: third-party to identify accounts in-market, first-party to prioritize who is furthest along in the buying journey."
  },
  {
    question: "How accurate is intent data?",
    answer: "Intent data accuracy varies significantly by provider and data source. First-party intent data via a tool like Cursive is the most accurate because it reflects real engagement with your brand. Third-party co-op data from Bombora is generally reliable for B2B account-level intent. Review site intent from G2 Buyer Intent is highly actionable because it identifies accounts actively comparing vendors. Programmatic intent signals are the least reliable because they represent passive exposure, not active research. The closer to a direct buying action, the more reliable the signal."
  },
  {
    question: "Which intent data provider is best for small and mid-market B2B teams?",
    answer: "For small to mid-market B2B teams under 200 employees, Cursive offers the strongest combination of accuracy, actionability, and cost. It provides first-party website visitor identification at 70% person-level accuracy plus automated outreach built in. G2 Buyer Intent is a strong complement if you have significant G2 presence. Bombora and 6sense are priced for enterprise teams and require dedicated RevOps to operationalize."
  },
  {
    question: "How much does intent data cost?",
    answer: "Intent data pricing varies widely: Cursive starts at $1,000/month for first-party visitor identification plus outreach automation. Bombora ranges from $20,000 to $50,000+ per year. 6sense costs $50,000-$200,000 per year. Demandbase runs $50,000-$150,000 per year. G2 Buyer Intent ranges from $5,000-$20,000 per year. TechTarget Priority Engine is $15,000-$40,000+ per year. Enterprise packages from any provider require annual contracts."
  },
  {
    question: "Can I use multiple intent data providers together?",
    answer: "Yes — many enterprise teams layer multiple intent data sources. A typical stack combines: first-party visitor data (Cursive) for on-site intent, third-party co-op data (Bombora) for off-site research signals, and review site intent (G2 Buyer Intent) for bottom-funnel vendor comparison signals. When all three signal types appear for the same account simultaneously, that account is in an active buying cycle and should receive immediate sales attention."
  }
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'Best Intent Data Providers Compared (2026)', url: 'https://www.meetcursive.com/blog/intent-data-providers-comparison' },
        ]),
        generateFAQSchema(faqs),
        generateBlogPostSchema({
          title: 'Best Intent Data Providers Compared (2026): 6sense, Bombora, Demandbase, G2, Cursive',
          description: 'Compare the top B2B intent data providers: pricing, data sources, accuracy, and use cases for 2026.',
          url: 'https://www.meetcursive.com/blog/intent-data-providers-comparison',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
