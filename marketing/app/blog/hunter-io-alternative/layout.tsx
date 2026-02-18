import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Hunter.io Alternatives: 7 Email Finding & B2B Data Tools Compared (2026)",
  description: "Looking for Hunter.io alternatives? Compare the 7 best email finding and B2B data tools with phone numbers, visitor identification, AI outreach, and more. Find the best alternative to Hunter.io in 2026.",
  keywords: "hunter.io alternative, hunter alternatives, hunter.io competitors, best alternative to hunter.io, email finder alternative to hunter, hunter.io replacement, email finding tools, b2b prospecting tools",

  openGraph: {
    title: "Best Hunter.io Alternatives: 7 Email Finding & B2B Data Tools Compared (2026) | Cursive",
    description: "Looking for Hunter.io alternatives? Compare the 7 best email finding and B2B data tools with phone numbers, visitor identification, AI outreach, and more. Find the best alternative to Hunter.io in 2026.",
    type: "article",
    url: "https://www.meetcursive.com/blog/hunter-io-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Hunter.io Alternatives: 7 Email Finding & B2B Data Tools Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Hunter.io Alternatives: 7 Email Finding & B2B Data Tools Compared (2026) | Cursive",
    description: "Looking for Hunter.io alternatives? Compare the 7 best email finding and B2B data tools with phone numbers, visitor identification, AI outreach, and more. Find the best alternative to Hunter.io in 2026.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/hunter-io-alternative",
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
          { name: 'Best Hunter.io Alternatives: 7 Email Finding & B2B Data Tools Compared (2026)', url: 'https://www.meetcursive.com/blog/hunter-io-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best Hunter.io Alternatives: 7 Email Finding & B2B Data Tools Compared (2026)',
          description: 'Looking for Hunter.io alternatives? Compare the 7 best email finding and B2B data tools with phone numbers, visitor identification, AI outreach, and more. Find the best alternative to Hunter.io in 2026.',
          url: 'https://www.meetcursive.com/blog/hunter-io-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
