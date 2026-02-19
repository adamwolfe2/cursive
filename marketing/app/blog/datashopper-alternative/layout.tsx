import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best DataShopper Alternatives: 7 B2B Data Tools Compared (2026)",
  description: "DataShopper sells static contact lists — no visitor identification, no intent data, no outreach automation. Compare the 7 best DataShopper alternatives that go further in 2026.",
  keywords: "datashopper alternative, datashopper alternatives, datashopper competitors, b2b data marketplace, b2b contact lists, best alternative to datashopper, datashopper replacement, b2b prospecting tools, contact list alternatives 2026",

  openGraph: {
    title: "Best DataShopper Alternatives: 7 B2B Data Tools Compared (2026) | Cursive",
    description: "DataShopper sells static contact lists — no visitor identification, no intent data, no outreach automation. Compare the 7 best DataShopper alternatives that go further in 2026.",
    type: "article",
    url: "https://www.meetcursive.com/blog/datashopper-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best DataShopper Alternatives: 7 B2B Data Tools Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best DataShopper Alternatives: 7 B2B Data Tools Compared (2026) | Cursive",
    description: "DataShopper sells static contact lists — no visitor identification, no intent data, no outreach automation. Compare the 7 best alternatives.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/datashopper-alternative",
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
          { name: 'Best DataShopper Alternatives: 7 B2B Data Tools Compared (2026)', url: 'https://www.meetcursive.com/blog/datashopper-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best DataShopper Alternatives: 7 B2B Data Tools Compared (2026)',
          description: 'DataShopper sells static contact lists — no visitor identification, no intent data, no outreach automation. Compare the 7 best DataShopper alternatives that go further in 2026.',
          url: 'https://www.meetcursive.com/blog/datashopper-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
