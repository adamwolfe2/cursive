import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "How to Identify Website Visitors: Technical Guide | Cursive",
  description: "Learn the technical methods behind website visitor identification including IP tracking, reverse lookup, cookie-based tracking, and privacy-compliant approaches for B2B lead generation.",
  keywords: "website visitor identification, visitor tracking technology, IP-based identification, reverse IP lookup, cookie tracking, first-party data, visitor identification methods, B2B visitor tracking, anonymous visitor identification, GDPR compliant tracking, privacy-safe visitor tracking, visitor identification software",

  openGraph: {
    title: "How to Identify Website Visitors: Technical Guide | Cursive",
    description: "Learn the technical methods behind website visitor identification including IP tracking, reverse lookup, cookie-based tracking, and privacy-compliant approaches for B2B lead generation.",
    type: "article",
    url: "https://www.meetcursive.com/blog/how-to-identify-website-visitors-technical-guide",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/cursive-social-preview.png",
      width: 1200,
      height: 630,
      alt: "How to Identify Website Visitors: Technical Guide",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "How to Identify Website Visitors: Technical Guide | Cursive",
    description: "Learn the technical methods behind website visitor identification including IP tracking, reverse lookup, cookie-based tracking, and privacy-compliant approaches for B2B lead generation.",
    images: ["https://www.meetcursive.com/cursive-social-preview.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/how-to-identify-website-visitors-technical-guide",
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
          { name: 'How to Identify Website Visitors: Technical Guide', url: 'https://www.meetcursive.com/blog/how-to-identify-website-visitors-technical-guide' },
        ]),
        generateBlogPostSchema({
          title: 'How to Identify Website Visitors: Technical Guide',
          description: 'Learn the technical methods behind website visitor identification including IP tracking, reverse lookup, cookie-based tracking, and privacy-compliant approaches for B2B lead generation.',
          url: 'https://www.meetcursive.com/blog/how-to-identify-website-visitors-technical-guide',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
