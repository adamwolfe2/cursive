import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "B2B Retargeting: Cross-Platform Strategies Using First-Party Data (2026) | Cursive",
  description: "Master cross-platform B2B retargeting using first-party visitor data. Build high-converting audience segments for ads, email, and direct mail without relying on third-party cookies.",
  keywords: "B2B retargeting, cross-platform retargeting, visitor retargeting, first-party data retargeting, retargeting campaigns, anonymous visitor retargeting, multi-channel retargeting, re-engagement strategies, retargeting audience segments, cookieless retargeting",

  openGraph: {
    title: "B2B Retargeting: Cross-Platform Strategies Using First-Party Data (2026) | Cursive",
    description: "Master cross-platform B2B retargeting using first-party visitor data. Build high-converting audience segments for ads, email, and direct mail without relying on third-party cookies.",
    type: "article",
    url: "https://www.meetcursive.com/blog/retargeting",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "B2B Retargeting: Cross-Platform Strategies Using First-Party Data",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "B2B Retargeting: Cross-Platform Strategies Using First-Party Data (2026) | Cursive",
    description: "Master cross-platform B2B retargeting using first-party visitor data. Build high-converting audience segments for ads, email, and direct mail without relying on third-party cookies.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/retargeting",
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
          { name: 'B2B Retargeting: Cross-Platform Strategies Using First-Party Data (2026)', url: 'https://www.meetcursive.com/blog/retargeting' },
        ]),
        generateBlogPostSchema({
          title: 'B2B Retargeting: Cross-Platform Strategies Using First-Party Data (2026)',
          description: 'Master cross-platform B2B retargeting using first-party visitor data. Build high-converting audience segments for ads, email, and direct mail without relying on third-party cookies.',
          url: 'https://www.meetcursive.com/blog/retargeting',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
