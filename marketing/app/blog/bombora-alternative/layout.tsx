import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Bombora Alternatives: Intent Data Tools Compared — $97/mo vs $25k+/yr (2026)",
  description: "Compare the top Bombora alternatives for B2B intent data. Find tools with person-level identification, self-serve pricing, and built-in outreach automation — without Bombora's $25k+ enterprise contracts.",
  keywords: "bombora alternative, bombora alternatives, bombora competitors, intent data alternative to bombora, bombora vs cursive, company surge alternative, b2b intent data tools, intent data platform",

  openGraph: {
    title: "Best Bombora Alternatives: Intent Data Tools Compared — $97/mo vs $25k+/yr (2026) | Cursive",
    description: "Compare the top Bombora alternatives for B2B intent data. Find tools with person-level identification, self-serve pricing, and built-in outreach automation — without Bombora's $25k+ enterprise contracts.",
    type: "article",
    url: "https://www.meetcursive.com/blog/bombora-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Bombora Alternatives: Intent Data Tools Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Bombora Alternatives: Intent Data Tools Compared — $97/mo vs $25k+/yr (2026) | Cursive",
    description: "Compare the top Bombora alternatives for B2B intent data. Find tools with person-level identification, self-serve pricing, and built-in outreach automation — without Bombora's $25k+ enterprise contracts.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/bombora-alternative",
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
          { name: 'Best Bombora Alternatives: Intent Data Tools Compared (2026)', url: 'https://www.meetcursive.com/blog/bombora-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best Bombora Alternatives: Intent Data Tools Compared — $97/mo vs $25k+/yr (2026)',
          description: 'Compare the top Bombora alternatives for B2B intent data. Find tools with person-level identification, self-serve pricing, and built-in outreach automation — without Bombora\'s $25k+ enterprise contracts.',
          url: 'https://www.meetcursive.com/blog/bombora-alternative',
          datePublished: '2026-02-19',
          dateModified: '2026-02-19',
        }),
      ]} />
      {children}
    </>
  )
}
