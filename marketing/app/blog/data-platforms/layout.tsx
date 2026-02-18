import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Choosing a B2B Data Platform: Comparison, Features, and Data Quality Guide (2026) | Cursive",
  description: "How to choose the right B2B data platform for your sales and marketing team. Compare approaches to contact enrichment, data quality management, and integration strategies. Covers CDPs, enrichment tools, and unified data platforms.",
  keywords: "B2B data platform, contact data enrichment, business intelligence data, customer data platform, data quality, B2B contact database, firmographic data, data enrichment tools, sales intelligence platform, B2B data providers, data quality management, CRM data enrichment",

  openGraph: {
    title: "Choosing a B2B Data Platform: Comparison, Features, and Data Quality Guide (2026) | Cursive",
    description: "How to choose the right B2B data platform for your sales and marketing team. Compare approaches to contact enrichment, data quality management, and integration strategies. Covers CDPs, enrichment tools, and unified data platforms.",
    type: "article",
    url: "https://www.meetcursive.com/blog/data-platforms",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Choosing a B2B Data Platform: Comparison, Features, and Data Quality Guide",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Choosing a B2B Data Platform: Comparison, Features, and Data Quality Guide (2026) | Cursive",
    description: "How to choose the right B2B data platform for your sales and marketing team. Compare approaches to contact enrichment, data quality management, and integration strategies. Covers CDPs, enrichment tools, and unified data platforms.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/data-platforms",
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
          { name: 'Choosing a B2B Data Platform: Comparison, Features, and Data Quality Guide (2026)', url: 'https://www.meetcursive.com/blog/data-platforms' },
        ]),
        generateBlogPostSchema({
          title: 'Choosing a B2B Data Platform: Comparison, Features, and Data Quality Guide (2026)',
          description: 'How to choose the right B2B data platform for your sales and marketing team. Compare approaches to contact enrichment, data quality management, and integration strategies. Covers CDPs, enrichment tools, and unified data platforms.',
          url: 'https://www.meetcursive.com/blog/data-platforms',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
