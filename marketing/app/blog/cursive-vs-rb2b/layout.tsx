import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Cursive vs RB2B: 70% vs 50-60% ID Rate — Full Comparison (2026) | Cursive",
  description: "Cursive identifies 70% of US B2B visitors vs RB2B's 50-60%. Plus Cursive adds AI outreach, intent data, and direct mail — not just identification. Compare features and pricing inside.",
  keywords: "cursive vs rb2b, rb2b alternative, rb2b competitor, visitor identification tools, website visitor identification, b2b visitor tracking, person-level identification, rb2b pricing, rb2b review, best visitor id tool 2026",

  openGraph: {
    title: "Cursive vs RB2B: 70% vs 50-60% ID Rate — Full Comparison (2026) | Cursive",
    description: "Cursive identifies 70% of US B2B visitors vs RB2B's 50-60%. Plus Cursive adds AI outreach, intent data, and direct mail — not just identification. Compare features and pricing.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-rb2b",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs RB2B: Which Visitor ID Tool is Better? (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs RB2B: 70% vs 50-60% ID Rate — Full Comparison (2026) | Cursive",
    description: "Cursive identifies 70% of US B2B visitors vs RB2B's 50-60%. Plus Cursive adds AI outreach, intent data, and direct mail — not just identification.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-rb2b",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'Cursive vs RB2B: 70% vs 50-60% ID Rate — Full Comparison (2026)', url: 'https://www.meetcursive.com/blog/cursive-vs-rb2b' },
        ]),
        generateBlogPostSchema({
          title: 'Cursive vs RB2B: 70% vs 50-60% ID Rate — Full Comparison (2026)',
          description: 'Cursive identifies 70% of US B2B visitors vs RB2B\'s 50-60%. Plus Cursive adds AI outreach, intent data, and direct mail — not just identification. Compare features and pricing inside.',
          url: 'https://www.meetcursive.com/blog/cursive-vs-rb2b',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
