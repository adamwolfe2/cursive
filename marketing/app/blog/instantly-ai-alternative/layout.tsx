import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Instantly AI Alternatives: Cold Email Tools Compared (2026)",
  description: "Compare the best Instantly AI alternatives for cold email outreach. See how Cursive identifies warm prospects first, then automates outreach — vs pure cold-sending tools like Instantly, Smartlead, and lemlist.",
  keywords: "instantly ai alternative, instantly.ai alternatives, instantly ai competitors, best alternative to instantly ai, instantly ai vs cursive, cold email tool, outbound email platform, instantly ai replacement",

  openGraph: {
    title: "Best Instantly AI Alternatives: Cold Email Tools Compared (2026) | Cursive",
    description: "Compare the best Instantly AI alternatives for cold email outreach. See how Cursive identifies warm prospects first, then automates outreach — vs pure cold-sending tools like Instantly, Smartlead, and lemlist.",
    type: "article",
    url: "https://www.meetcursive.com/blog/instantly-ai-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Instantly AI Alternatives: Cold Email Tools Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Instantly AI Alternatives: Cold Email Tools Compared (2026) | Cursive",
    description: "Compare the best Instantly AI alternatives for cold email outreach. See how Cursive identifies warm prospects first, then automates outreach — vs pure cold-sending tools like Instantly, Smartlead, and lemlist.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/instantly-ai-alternative",
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
          { name: 'Best Instantly AI Alternatives: Cold Email Tools Compared (2026)', url: 'https://www.meetcursive.com/blog/instantly-ai-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best Instantly AI Alternatives: Cold Email Tools Compared (2026)',
          description: 'Compare the best Instantly AI alternatives for cold email outreach. See how Cursive identifies warm prospects first, then automates outreach — vs pure cold-sending tools like Instantly, Smartlead, and lemlist.',
          url: 'https://www.meetcursive.com/blog/instantly-ai-alternative',
          datePublished: '2026-02-20',
          dateModified: '2026-02-20',
        }),
      ]} />
      {children}
    </>
  )
}
