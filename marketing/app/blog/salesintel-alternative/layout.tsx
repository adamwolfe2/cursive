import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best SalesIntel Alternatives: 7 B2B Data Providers Compared (2026)",
  description: "Looking for SalesIntel alternatives? Compare the 7 best competitors for B2B data, prospecting, visitor identification, and outbound automation. Find a cheaper, more flexible alternative to SalesIntel in 2026.",
  keywords: "salesintel alternative, salesintel.io alternatives, salesintel competitors, best alternative to salesintel, salesintel replacement, b2b contact data tools, sales intelligence platforms, salesintel pricing",

  openGraph: {
    title: "Best SalesIntel Alternatives: 7 B2B Data Providers Compared (2026) | Cursive",
    description: "Looking for SalesIntel alternatives? Compare the 7 best competitors for B2B data, prospecting, visitor identification, and outbound automation. Find a cheaper, more flexible alternative to SalesIntel in 2026.",
    type: "article",
    url: "https://www.meetcursive.com/blog/salesintel-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best SalesIntel Alternatives: 7 B2B Data Providers Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best SalesIntel Alternatives: 7 B2B Data Providers Compared (2026) | Cursive",
    description: "Looking for SalesIntel alternatives? Compare the 7 best competitors for B2B data, prospecting, visitor identification, and outbound automation. Find a cheaper, more flexible alternative to SalesIntel in 2026.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/salesintel-alternative",
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
          { name: 'Best SalesIntel Alternatives: 7 B2B Data Providers Compared (2026)', url: 'https://www.meetcursive.com/blog/salesintel-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best SalesIntel Alternatives: 7 B2B Data Providers Compared (2026)',
          description: 'Looking for SalesIntel alternatives? Compare the 7 best competitors for B2B data, prospecting, visitor identification, and outbound automation. Find a cheaper, more flexible alternative to SalesIntel in 2026.',
          url: 'https://www.meetcursive.com/blog/salesintel-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
