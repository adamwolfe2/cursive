import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Cursive vs Demandbase: $1k/mo vs $50k+/yr — Full ABM Stack Compared (2026) | Cursive",
  description: "Compare Cursive and Demandbase for account-based marketing. Demandbase costs $50k+/year with long implementation. Cursive delivers ABM-like capabilities at $1k/mo with 5-minute setup.",
  keywords: "cursive vs demandbase, demandbase alternative, demandbase pricing, affordable abm platform, account based marketing tools, abm for smb, visitor identification, intent data platform, demandbase competitor, b2b marketing platform",

  openGraph: {
    title: "Cursive vs Demandbase: $1k/mo vs $50k+/yr — Full ABM Stack Compared (2026) | Cursive",
    description: "Compare Cursive and Demandbase for account-based marketing. Demandbase costs $50k+/year with long implementation. Cursive delivers ABM-like capabilities at $1k/mo with 5-minute setup.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-demandbase",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs Demandbase: Affordable ABM Alternative (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs Demandbase: $1k/mo vs $50k+/yr — Full ABM Stack Compared (2026) | Cursive",
    description: "Compare Cursive and Demandbase for account-based marketing. Demandbase costs $50k+/year with long implementation. Cursive delivers ABM-like capabilities at $1k/mo with 5-minute setup.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-demandbase",
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
          { name: 'Cursive vs Demandbase: $1k/mo vs $50k+/yr — Full ABM Stack Compared (2026)', url: 'https://www.meetcursive.com/blog/cursive-vs-demandbase' },
        ]),
        generateBlogPostSchema({
          title: 'Cursive vs Demandbase: $1k/mo vs $50k+/yr — Full ABM Stack Compared (2026)',
          description: 'Compare Cursive and Demandbase for account-based marketing. Demandbase costs $50k+/year with long implementation. Cursive delivers ABM-like capabilities at $1k/mo with 5-minute setup.',
          url: 'https://www.meetcursive.com/blog/cursive-vs-demandbase',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
