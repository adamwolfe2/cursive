import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "15 Best Sales Engagement Alternatives for 2026 | Cursive",
  description: "Compare 15 sales engagement alternatives including pricing, features, and use cases. Find the right platform for your team size and budget in 2026.",
  keywords: "sales engagement alternatives, sales engagement platforms, Outreach alternatives, Salesloft alternatives, sales engagement tools 2026, sales outreach software",

  openGraph: {
    title: "15 Best Sales Engagement Alternatives for 2026 | Cursive",
    description: "Compare 15 sales engagement alternatives including pricing, features, and use cases. Find the right platform for your team size and budget in 2026.",
    type: "article",
    url: "https://www.meetcursive.com/blog/sales-engagement-alternatives",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "15 Best Sales Engagement Alternatives for 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "15 Best Sales Engagement Alternatives for 2026 | Cursive",
    description: "Compare 15 sales engagement alternatives including pricing, features, and use cases. Find the right platform for your team size and budget in 2026.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/sales-engagement-alternatives",
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
          { name: '15 Best Sales Engagement Alternatives for 2026', url: 'https://www.meetcursive.com/blog/sales-engagement-alternatives' },
        ]),
        generateBlogPostSchema({
          title: '15 Best Sales Engagement Alternatives for 2026',
          description: 'Compare 15 sales engagement alternatives including pricing, features, and use cases. Find the right platform for your team size and budget in 2026.',
          url: 'https://www.meetcursive.com/blog/sales-engagement-alternatives',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
