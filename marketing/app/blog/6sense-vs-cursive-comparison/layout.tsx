import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "6sense vs Cursive: $50k-$200k/yr vs $1k/mo — Intent Data Compared (2026) | Cursive",
  description: "6sense costs $50,000-$200,000/year with multi-year contracts. Cursive delivers intent data, visitor identification, and AI SDR for $1,000/month with no commitment. Full comparison inside.",
  keywords: "6sense vs cursive, 6sense alternative, visitor identification comparison, intent data platforms, abm platform comparison, cursive vs 6sense, 6sense pricing, cursive pricing, b2b intent data, account based marketing",

  openGraph: {
    title: "6sense vs Cursive: $50k-$200k/yr vs $1k/mo — Intent Data Compared (2026) | Cursive",
    description: "6sense costs $50,000-$200,000/year with multi-year contracts. Cursive delivers intent data, visitor identification, and AI SDR for $1,000/month with no commitment. Full comparison inside.",
    type: "article",
    url: "https://www.meetcursive.com/blog/6sense-vs-cursive-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "6sense vs Cursive: Complete Comparison (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "6sense vs Cursive: $50k-$200k/yr vs $1k/mo — Intent Data Compared (2026) | Cursive",
    description: "6sense costs $50,000-$200,000/year with multi-year contracts. Cursive delivers intent data, visitor identification, and AI SDR for $1,000/month with no commitment.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/6sense-vs-cursive-comparison",
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
          { name: '6sense vs Cursive: $50k-$200k/yr vs $1k/mo — Intent Data Compared (2026)', url: 'https://www.meetcursive.com/blog/6sense-vs-cursive-comparison' },
        ]),
        generateBlogPostSchema({
          title: '6sense vs Cursive: $50k-$200k/yr vs $1k/mo — Intent Data Compared (2026)',
          description: '6sense costs $50,000-$200,000/year with multi-year contracts. Cursive delivers intent data, visitor identification, and AI SDR for $1,000/month with no commitment. Full comparison inside.',
          url: 'https://www.meetcursive.com/blog/6sense-vs-cursive-comparison',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
