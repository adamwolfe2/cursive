import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Overloop Alternatives: Cold Email Tools vs Cursive Self-Serve Plans (2026)",
  description: "Compare top Overloop alternatives for sales automation and cold email. See why B2B teams are switching from Overloop's per-seat pricing to Cursive's warm-lead AI outreach platform.",
  keywords: "overloop alternative, overloop alternatives, overloop competitors, sales automation alternative, cold email alternative, overloop io alternative, b2b outreach alternative",

  openGraph: {
    title: "Best Overloop Alternatives: Cold Email Tools vs Cursive Self-Serve Plans (2026) | Cursive",
    description: "Compare top Overloop alternatives for sales automation and cold email. See why B2B teams are switching from Overloop's per-seat pricing to Cursive's warm-lead AI outreach platform.",
    type: "article",
    url: "https://www.meetcursive.com/blog/overloop-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Overloop Alternatives: Cold Email Tools vs AI-Powered Outreach (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Overloop Alternatives: Cold Email Tools vs Cursive Self-Serve Plans (2026) | Cursive",
    description: "Compare top Overloop alternatives for sales automation and cold email. See why B2B teams are switching from Overloop's per-seat pricing to Cursive's warm-lead AI outreach platform.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/overloop-alternative",
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
          { name: 'Best Overloop Alternatives: Cold Email Tools vs AI-Powered Outreach (2026)', url: 'https://www.meetcursive.com/blog/overloop-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best Overloop Alternatives: Cold Email Tools vs Cursive Self-Serve Plans (2026)',
          description: 'Compare top Overloop alternatives for sales automation and cold email. See why B2B teams are switching from Overloop\'s per-seat pricing to Cursive\'s warm-lead AI outreach platform.',
          url: 'https://www.meetcursive.com/blog/overloop-alternative',
          datePublished: '2026-02-19',
          dateModified: '2026-02-19',
        }),
      ]} />
      {children}
    </>
  )
}
