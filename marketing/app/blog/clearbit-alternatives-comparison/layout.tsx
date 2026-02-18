import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Clearbit Alternatives After HubSpot Acquisition: 10 Tools Compared (2026) | Cursive",
  description: "Clearbit was acquired by HubSpot in 2023 — its standalone features are being sunset. We compared 10 alternatives for B2B enrichment, visitor identification, and lead intelligence.",
  keywords: "clearbit alternatives, clearbit competitors, b2b data enrichment, visitor identification tools, lead intelligence software, company data api, intent data platforms, clearbit vs competitors, b2b prospecting tools, contact enrichment software",

  openGraph: {
    title: "Best Clearbit Alternatives After HubSpot Acquisition: 10 Tools Compared (2026) | Cursive",
    description: "Clearbit was acquired by HubSpot in 2023 — its standalone features are being sunset. We compared 10 alternatives for B2B enrichment, visitor identification, and lead intelligence.",
    type: "article",
    url: "https://www.meetcursive.com/blog/clearbit-alternatives-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Clearbit Alternatives: 10 Tools Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Clearbit Alternatives After HubSpot Acquisition: 10 Tools Compared (2026) | Cursive",
    description: "Clearbit was acquired by HubSpot in 2023 — its standalone features are being sunset. We compared 10 alternatives for B2B enrichment, visitor identification, and lead intelligence.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/clearbit-alternatives-comparison",
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
          { name: 'Best Clearbit Alternatives After HubSpot Acquisition: 10 Tools Compared (2026)', url: 'https://www.meetcursive.com/blog/clearbit-alternatives-comparison' },
        ]),
        generateBlogPostSchema({
          title: 'Best Clearbit Alternatives After HubSpot Acquisition: 10 Tools Compared (2026)',
          description: 'Clearbit was acquired by HubSpot in 2023 — its standalone features are being sunset. We compared 10 alternatives for B2B enrichment, visitor identification, and lead intelligence.',
          url: 'https://www.meetcursive.com/blog/clearbit-alternatives-comparison',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
