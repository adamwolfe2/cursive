import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "The Identity Resolution Moat: Building an Unassailable Competitive Advantage | Cursive",
  description: "How modern identity resolution technology creates compounding competitive advantage. Learn how the Identity Spine, NCOA refresh, UID2, and Geoframe data build a moat competitors cannot replicate.",
  keywords: "identity resolution technology, identity spine, website visitor identification moat, pixel identity resolution, UID2, NCOA data, first party data, visitor identification",

  openGraph: {
    title: "The Identity Resolution Moat: Building an Unassailable Competitive Advantage | Cursive",
    description: "How modern identity resolution technology creates compounding competitive advantage. Learn how the Identity Spine, NCOA refresh, UID2, and Geoframe data build a moat competitors cannot replicate.",
    type: "article",
    url: "https://www.meetcursive.com/blog/identity-resolution-moat",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The Identity Resolution Moat",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "The Identity Resolution Moat: Building an Unassailable Competitive Advantage | Cursive",
    description: "How modern identity resolution technology creates compounding competitive advantage. Learn how the Identity Spine, NCOA refresh, UID2, and Geoframe data build a moat competitors cannot replicate.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/identity-resolution-moat",
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
          { name: 'The Identity Resolution Moat', url: 'https://www.meetcursive.com/blog/identity-resolution-moat' },
        ]),
        generateBlogPostSchema({
          title: 'The Identity Resolution Moat: How Modern Pixels Build an Unassailable Competitive Advantage',
          description: 'How modern identity resolution technology creates compounding competitive advantage. Learn how the Identity Spine, NCOA refresh, UID2, and Geoframe data build a moat competitors cannot replicate.',
          url: 'https://www.meetcursive.com/blog/identity-resolution-moat',
          datePublished: '2026-06-12',
          dateModified: '2026-06-12',
        }),
      ]} />
      {children}
    </>
  )
}
