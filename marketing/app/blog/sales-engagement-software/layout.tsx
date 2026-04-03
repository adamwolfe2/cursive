import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "12 Best Sales Engagement Software for Teams in 2026 | Cursive",
  description: "Compare the 12 best sales engagement software platforms for 2026. Features, pricing, and implementation guidance to help your team close more deals faster.",
  keywords: "sales engagement software, sales engagement platforms, best sales engagement tools, sales outreach software, sales automation software 2026",

  openGraph: {
    title: "12 Best Sales Engagement Software for Teams in 2026 | Cursive",
    description: "Compare the 12 best sales engagement software platforms for 2026. Features, pricing, and implementation guidance to help your team close more deals faster.",
    type: "article",
    url: "https://www.meetcursive.com/blog/sales-engagement-software",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "12 Best Sales Engagement Software for Teams in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "12 Best Sales Engagement Software for Teams in 2026 | Cursive",
    description: "Compare the 12 best sales engagement software platforms for 2026. Features, pricing, and implementation guidance to help your team close more deals faster.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/sales-engagement-software",
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
          { name: '12 Best Sales Engagement Software for Teams in 2026', url: 'https://www.meetcursive.com/blog/sales-engagement-software' },
        ]),
        generateBlogPostSchema({
          title: '12 Best Sales Engagement Software for Teams in 2026',
          description: 'Compare the 12 best sales engagement software platforms for 2026. Features, pricing, and implementation guidance to help your team close more deals faster.',
          url: 'https://www.meetcursive.com/blog/sales-engagement-software',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
