import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Cursive vs Clearbit: Best Clearbit Replacement After HubSpot Acquisition (2026) | Cursive",
  description: "Clearbit was acquired by HubSpot — standalone Clearbit is being sunset. Cursive delivers 70% visitor ID (vs Clearbit's 30-40%) with AI outreach, intent data, and no HubSpot dependency.",
  keywords: "cursive vs clearbit, clearbit alternative, clearbit replacement, clearbit hubspot acquisition, clearbit sunset, visitor identification, b2b data enrichment, clearbit pricing, clearbit review 2026, best clearbit alternative",

  openGraph: {
    title: "Cursive vs Clearbit: Best Clearbit Replacement After HubSpot Acquisition (2026) | Cursive",
    description: "Clearbit was acquired by HubSpot — standalone Clearbit is being sunset. Cursive delivers 70% visitor ID (vs Clearbit's 30-40%) with AI outreach, intent data, and no HubSpot dependency.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-clearbit",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs Clearbit: The Best Clearbit Replacement (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs Clearbit: Best Clearbit Replacement After HubSpot Acquisition (2026) | Cursive",
    description: "Clearbit was acquired by HubSpot — standalone Clearbit is being sunset. Cursive delivers 70% visitor ID (vs Clearbit's 30-40%) with AI outreach and intent data.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-clearbit",
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
          { name: 'Cursive vs Clearbit: Best Clearbit Replacement After HubSpot Acquisition (2026)', url: 'https://www.meetcursive.com/blog/cursive-vs-clearbit' },
        ]),
        generateBlogPostSchema({
          title: 'Cursive vs Clearbit: Best Clearbit Replacement After HubSpot Acquisition (2026)',
          description: 'Clearbit was acquired by HubSpot — standalone Clearbit is being sunset. Cursive delivers 70% visitor ID (vs Clearbit\'s 30-40%) with AI outreach, intent data, and no HubSpot dependency.',
          url: 'https://www.meetcursive.com/blog/cursive-vs-clearbit',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
