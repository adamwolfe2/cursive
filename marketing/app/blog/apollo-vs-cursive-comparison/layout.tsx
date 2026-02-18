import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Apollo vs Cursive: Cold Database vs Warm Visitor ID — Which Wins? (2026) | Cursive",
  description: "Apollo gives you a 200M+ contact database for cold outreach. Cursive identifies YOUR visitors (70% rate) and automates warm outreach. Different tools, different outcomes. Compare here.",
  keywords: "apollo vs cursive, apollo.io alternative, visitor identification, sales engagement platform, b2b prospecting tools, cursive vs apollo, apollo pricing, cursive pricing, sales intelligence comparison, outreach automation",

  openGraph: {
    title: "Apollo vs Cursive: Cold Database vs Warm Visitor ID — Which Wins? (2026) | Cursive",
    description: "Apollo gives you a 200M+ contact database for cold outreach. Cursive identifies YOUR visitors (70% rate) and automates warm outreach. Different tools, different outcomes.",
    type: "article",
    url: "https://www.meetcursive.com/blog/apollo-vs-cursive-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Apollo vs Cursive: Complete Comparison (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Apollo vs Cursive: Cold Database vs Warm Visitor ID — Which Wins? (2026) | Cursive",
    description: "Apollo gives you a 200M+ contact database for cold outreach. Cursive identifies YOUR visitors (70% rate) and automates warm outreach. Different tools, different outcomes.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/apollo-vs-cursive-comparison",
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
          { name: 'Apollo vs Cursive: Cold Database vs Warm Visitor ID — Which Wins? (2026)', url: 'https://www.meetcursive.com/blog/apollo-vs-cursive-comparison' },
        ]),
        generateBlogPostSchema({
          title: 'Apollo vs Cursive: Cold Database vs Warm Visitor ID — Which Wins? (2026)',
          description: 'Apollo gives you a 200M+ contact database for cold outreach. Cursive identifies YOUR visitors (70% rate) and automates warm outreach. Different tools, different outcomes. Compare here.',
          url: 'https://www.meetcursive.com/blog/apollo-vs-cursive-comparison',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
