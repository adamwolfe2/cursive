import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "7 Best Seamless.AI Alternatives & Competitors in 2026 | Cursive",
  description: "Looking for Seamless.AI alternatives? Compare the 7 best competitors for B2B contact data and prospecting. Find a cheaper, higher-quality alternative to Seamless.AI in 2026.",
  keywords: [
    "seamless.ai alternative",
    "seamless ai alternatives",
    "seamless ai competitors",
    "best alternative to seamless ai",
    "seamless ai vs cursive",
    "seamless ai replacement",
    "cheaper seamless ai alternative",
    "b2b contact data",
    "sales prospecting tools",
    "seamless ai pricing",
  ].join(", "),

  openGraph: {
    title: "7 Best Seamless.AI Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for Seamless.AI alternatives? Compare the 7 best competitors for B2B contact data and prospecting. Find a cheaper, higher-quality alternative to Seamless.AI in 2026.",
    type: "article",
    url: "https://www.meetcursive.com/blog/seamless-ai-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "7 Best Seamless.AI Alternatives & Competitors in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "7 Best Seamless.AI Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for Seamless.AI alternatives? Compare the 7 best competitors for B2B contact data and prospecting. Find a cheaper, higher-quality alternative to Seamless.AI in 2026.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/seamless-ai-alternative",
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
          { name: '7 Best Seamless.AI Alternatives & Competitors in 2026', url: 'https://www.meetcursive.com/blog/seamless-ai-alternative' },
        ]),
        generateBlogPostSchema({
          title: '7 Best Seamless.AI Alternatives & Competitors in 2026',
          description: 'Looking for Seamless.AI alternatives? Compare the 7 best competitors for B2B contact data and prospecting. Find a cheaper, higher-quality alternative to Seamless.AI in 2026.',
          url: 'https://www.meetcursive.com/blog/seamless-ai-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
