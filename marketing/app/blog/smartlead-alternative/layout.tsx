import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Smartlead Alternatives: Cold Email Sequencing Tools Compared (2026)",
  description: "Compare the best Smartlead alternatives for cold email sequencing. See how Cursive finds your warmest prospects before sending a single email — vs cold-only sequencers like Smartlead, Instantly AI, and lemlist.",
  keywords: "smartlead alternative, smartlead.ai alternatives, smartlead competitors, best alternative to smartlead, smartlead vs cursive, cold email sequencing tool, outbound email platform, smartlead replacement",

  openGraph: {
    title: "Best Smartlead Alternatives: Cold Email Sequencing Tools Compared (2026) | Cursive",
    description: "Compare the best Smartlead alternatives for cold email sequencing. See how Cursive finds your warmest prospects before sending a single email — vs cold-only sequencers like Smartlead, Instantly AI, and lemlist.",
    type: "article",
    url: "https://www.meetcursive.com/blog/smartlead-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Smartlead Alternatives: Cold Email Sequencing Tools Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Smartlead Alternatives: Cold Email Sequencing Tools Compared (2026) | Cursive",
    description: "Compare the best Smartlead alternatives for cold email sequencing. See how Cursive finds your warmest prospects before sending a single email — vs cold-only sequencers like Smartlead, Instantly AI, and lemlist.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/smartlead-alternative",
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
          { name: 'Best Smartlead Alternatives: Cold Email Sequencing Tools Compared (2026)', url: 'https://www.meetcursive.com/blog/smartlead-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best Smartlead Alternatives: Cold Email Sequencing Tools Compared (2026)',
          description: 'Compare the best Smartlead alternatives for cold email sequencing. See how Cursive finds your warmest prospects before sending a single email — vs cold-only sequencers like Smartlead, Instantly AI, and lemlist.',
          url: 'https://www.meetcursive.com/blog/smartlead-alternative',
          datePublished: '2026-02-20',
          dateModified: '2026-02-20',
        }),
      ]} />
      {children}
    </>
  )
}
