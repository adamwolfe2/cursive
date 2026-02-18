import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "7 Best Cognism Alternatives & Competitors in 2026 | Cursive",
  description: "Looking for Cognism alternatives? Compare the 7 best competitors for B2B data, prospecting, and outbound automation. Find a cheaper, more flexible alternative to Cognism in 2026.",
  keywords: [
    "cognism alternative",
    "cognism alternatives",
    "cognism competitors",
    "best alternative to cognism",
    "cognism vs cursive",
    "cognism replacement",
    "cheaper cognism alternative",
    "b2b data providers",
    "sales intelligence platforms",
    "cognism pricing",
  ].join(", "),

  openGraph: {
    title: "7 Best Cognism Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for Cognism alternatives? Compare the 7 best competitors for B2B data, prospecting, and outbound automation. Find a cheaper, more flexible alternative to Cognism in 2026.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cognism-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "7 Best Cognism Alternatives & Competitors in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "7 Best Cognism Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for Cognism alternatives? Compare the 7 best competitors for B2B data, prospecting, and outbound automation. Find a cheaper, more flexible alternative to Cognism in 2026.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cognism-alternative",
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
          { name: '7 Best Cognism Alternatives & Competitors in 2026', url: 'https://www.meetcursive.com/blog/cognism-alternative' },
        ]),
        generateBlogPostSchema({
          title: '7 Best Cognism Alternatives & Competitors in 2026',
          description: 'Looking for Cognism alternatives? Compare the 7 best competitors for B2B data, prospecting, and outbound automation. Find a cheaper, more flexible alternative to Cognism in 2026.',
          url: 'https://www.meetcursive.com/blog/cognism-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
