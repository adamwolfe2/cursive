import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best LeadIQ Alternatives: B2B Prospecting Tools Compared (2026)",
  description: "Compare the top LeadIQ alternatives for B2B prospecting. Find tools with visitor identification, unlimited contacts, AI outreach automation, and better value than LeadIQ's credit-based model.",
  keywords: "leadiq alternative, leadiq alternatives, leadiq competitors, better than leadiq, leadiq vs cursive, leadiq replacement, b2b prospecting tools, sales intelligence tools, linkedin prospecting alternative",

  openGraph: {
    title: "Best LeadIQ Alternatives: B2B Prospecting Tools Compared (2026) | Cursive",
    description: "Compare the top LeadIQ alternatives for B2B prospecting. Find tools with visitor identification, unlimited contacts, AI outreach automation, and better value than LeadIQ's credit-based model.",
    type: "article",
    url: "https://www.meetcursive.com/blog/leadiq-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best LeadIQ Alternatives: B2B Prospecting Tools Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best LeadIQ Alternatives: B2B Prospecting Tools Compared (2026) | Cursive",
    description: "Compare the top LeadIQ alternatives for B2B prospecting. Find tools with visitor identification, unlimited contacts, AI outreach automation, and better value than LeadIQ's credit-based model.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/leadiq-alternative",
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
          { name: 'Best LeadIQ Alternatives: B2B Prospecting Tools Compared (2026)', url: 'https://www.meetcursive.com/blog/leadiq-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best LeadIQ Alternatives: B2B Prospecting Tools Compared (2026)',
          description: 'Compare the top LeadIQ alternatives for B2B prospecting. Find tools with visitor identification, unlimited contacts, AI outreach automation, and better value than LeadIQ\'s credit-based model.',
          url: 'https://www.meetcursive.com/blog/leadiq-alternative',
          datePublished: '2026-02-19',
          dateModified: '2026-02-19',
        }),
      ]} />
      {children}
    </>
  )
}
