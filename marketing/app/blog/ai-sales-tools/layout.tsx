import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "The 15 Best AI Sales Tools to Dominate in 2026 | Cursive",
  description: "Compare the 15 best AI sales tools for 2026. Covers lead generation, outreach automation, conversation intelligence, and CRM-native AI with pricing and use cases.",
  keywords: "ai sales tools, best ai sales tools 2026, ai sales software, ai tools for sales teams, ai prospecting tools, ai lead generation, sales automation tools",

  openGraph: {
    title: "The 15 Best AI Sales Tools to Dominate in 2026 | Cursive",
    description: "Compare the 15 best AI sales tools for 2026. Covers lead generation, outreach automation, conversation intelligence, and CRM-native AI with pricing and use cases.",
    type: "article",
    url: "https://www.meetcursive.com/blog/ai-sales-tools",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The 15 Best AI Sales Tools to Dominate in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "The 15 Best AI Sales Tools to Dominate in 2026 | Cursive",
    description: "Compare the 15 best AI sales tools for 2026. Covers lead generation, outreach automation, conversation intelligence, and CRM-native AI with pricing and use cases.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/ai-sales-tools",
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
          { name: 'The 15 Best AI Sales Tools to Dominate in 2026', url: 'https://www.meetcursive.com/blog/ai-sales-tools' },
        ]),
        generateBlogPostSchema({
          title: 'The 15 Best AI Sales Tools to Dominate in 2026',
          description: 'Compare the 15 best AI sales tools for 2026. Covers lead generation, outreach automation, conversation intelligence, and CRM-native AI with pricing and use cases.',
          url: 'https://www.meetcursive.com/blog/ai-sales-tools',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
