import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Lusha Alternatives: 7 B2B Contact Data Tools Compared (2026)",
  description: "Compare the top Lusha alternatives for B2B contact data and prospecting. Find tools with more credits, visitor identification, AI outreach automation, and better value than Lusha.",
  keywords: "lusha alternative, lusha alternatives, lusha competitors, best alternative to lusha, lusha vs cursive, lusha replacement, b2b contact data tools, sales prospecting tools",

  openGraph: {
    title: "Best Lusha Alternatives: 7 B2B Contact Data Tools Compared (2026) | Cursive",
    description: "Compare the top Lusha alternatives for B2B contact data and prospecting. Find tools with more credits, visitor identification, AI outreach automation, and better value than Lusha.",
    type: "article",
    url: "https://www.meetcursive.com/blog/lusha-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Lusha Alternatives: 7 B2B Contact Data Tools Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Lusha Alternatives: 7 B2B Contact Data Tools Compared (2026) | Cursive",
    description: "Compare the top Lusha alternatives for B2B contact data and prospecting. Find tools with more credits, visitor identification, AI outreach automation, and better value than Lusha.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/lusha-alternative",
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
          { name: 'Best Lusha Alternatives: 7 B2B Contact Data Tools Compared (2026)', url: 'https://www.meetcursive.com/blog/lusha-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best Lusha Alternatives: 7 B2B Contact Data Tools Compared (2026)',
          description: 'Compare the top Lusha alternatives for B2B contact data and prospecting. Find tools with more credits, visitor identification, AI outreach automation, and better value than Lusha.',
          url: 'https://www.meetcursive.com/blog/lusha-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
