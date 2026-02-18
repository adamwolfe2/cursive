import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Opensend Alternatives & Competitors in 2026 | Cursive",
  description: "Looking for Opensend alternatives? Compare the best competitors for website visitor identification and B2B outreach automation. See why Cursive delivers a 70% ID rate vs Opensend.",
  keywords: [
    "opensend alternative",
    "opensend alternatives",
    "opensend competitors",
    "best alternative to opensend",
    "opensend vs cursive",
    "opensend replacement",
    "visitor identification tools",
    "website visitor id",
    "opensend pricing",
    "b2b visitor tracking",
  ].join(", "),

  openGraph: {
    title: "Best Opensend Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for Opensend alternatives? Compare the best competitors for website visitor identification and B2B outreach automation. See why Cursive delivers a 70% ID rate vs Opensend.",
    type: "article",
    url: "https://www.meetcursive.com/blog/opensend-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Opensend Alternatives & Competitors in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Opensend Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for Opensend alternatives? Compare the best competitors for website visitor identification and B2B outreach automation. See why Cursive delivers a 70% ID rate vs Opensend.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/opensend-alternative",
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
          { name: 'Best Opensend Alternatives & Competitors in 2026', url: 'https://www.meetcursive.com/blog/opensend-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best Opensend Alternatives & Competitors in 2026',
          description: 'Looking for Opensend alternatives? Compare the best competitors for website visitor identification and B2B outreach automation. See why Cursive delivers a 70% ID rate vs Opensend.',
          url: 'https://www.meetcursive.com/blog/opensend-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
