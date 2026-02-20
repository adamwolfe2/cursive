import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Apollo.io vs ZoomInfo: Head-to-Head Comparison (2026) — And Why Cursive Is Better Than Both",
  description: "Apollo.io vs ZoomInfo compared head-to-head on contact data, pricing, and B2B prospecting. Plus why Cursive's real-time warm visitor identification outperforms both static contact databases.",
  keywords: "apollo.io vs zoominfo, apollo vs zoominfo comparison, apollo vs zoominfo 2026, zoominfo vs apollo, best b2b contact database, apollo zoominfo alternative, cursive vs apollo, cursive vs zoominfo",

  openGraph: {
    title: "Apollo.io vs ZoomInfo: Head-to-Head Comparison (2026) | Cursive",
    description: "Apollo.io vs ZoomInfo compared head-to-head on contact data, pricing, and B2B prospecting. Plus why Cursive's real-time warm visitor identification outperforms both static contact databases.",
    type: "article",
    url: "https://www.meetcursive.com/blog/apollo-io-vs-zoominfo",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Apollo.io vs ZoomInfo: Head-to-Head Comparison (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Apollo.io vs ZoomInfo: Head-to-Head Comparison (2026) | Cursive",
    description: "Apollo.io vs ZoomInfo compared head-to-head on contact data, pricing, and B2B prospecting. Plus why Cursive's real-time warm visitor identification outperforms both static contact databases.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/apollo-io-vs-zoominfo",
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
          { name: 'Apollo.io vs ZoomInfo: Head-to-Head Comparison (2026)', url: 'https://www.meetcursive.com/blog/apollo-io-vs-zoominfo' },
        ]),
        generateBlogPostSchema({
          title: 'Apollo.io vs ZoomInfo: Head-to-Head Comparison (2026) — And Why Cursive Is Better Than Both',
          description: 'Apollo.io vs ZoomInfo compared head-to-head on contact data, pricing, and B2B prospecting. Plus why Cursive real-time warm visitor identification outperforms both static contact databases.',
          url: 'https://www.meetcursive.com/blog/apollo-io-vs-zoominfo',
          datePublished: '2026-02-20',
          dateModified: '2026-02-20',
        }),
      ]} />
      {children}
    </>
  )
}
