import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "The 25 Best Lead Generation Software Tools for 2026 | Cursive",
  description: "Compare the 25 best B2B lead generation software tools for 2026. Covers visitor identification, contact databases, enrichment, and AI-powered outreach platforms with pricing and features.",
  keywords: "lead generation software, lead gen tools, B2B lead generation, lead generation platform, visitor identification, sales lead generation, lead capture software, best lead gen tools 2026",

  openGraph: {
    title: "The 25 Best Lead Generation Software Tools for 2026 | Cursive",
    description: "Compare the 25 best B2B lead generation software tools for 2026. Covers visitor identification, contact databases, enrichment, and AI-powered outreach platforms with pricing and features.",
    type: "article",
    url: "https://www.meetcursive.com/blog/lead-generation-software",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The 25 Best Lead Generation Software Tools for 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "The 25 Best Lead Generation Software Tools for 2026 | Cursive",
    description: "Compare the 25 best B2B lead generation software tools for 2026. Covers visitor identification, contact databases, enrichment, and AI-powered outreach platforms with pricing and features.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/lead-generation-software",
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
          { name: 'The 25 Best Lead Generation Software Tools for 2026', url: 'https://www.meetcursive.com/blog/lead-generation-software' },
        ]),
        generateBlogPostSchema({
          title: 'The 25 Best Lead Generation Software Tools for 2026',
          description: 'Compare the 25 best B2B lead generation software tools for 2026. Covers visitor identification, contact databases, enrichment, and AI-powered outreach platforms with pricing and features.',
          url: 'https://www.meetcursive.com/blog/lead-generation-software',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
