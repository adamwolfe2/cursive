import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "10 Best Sales Engagement Competitors to Consider in 2026 | Cursive",
  description: "Compare the 10 leading sales engagement competitors in 2026. Features, pricing models, and ideal use cases to match the right platform to your team.",
  keywords: "sales engagement competitors, sales engagement platforms comparison, Outreach competitors, Salesloft competitors, sales engagement tools 2026",

  openGraph: {
    title: "10 Best Sales Engagement Competitors to Consider in 2026 | Cursive",
    description: "Compare the 10 leading sales engagement competitors in 2026. Features, pricing models, and ideal use cases to match the right platform to your team.",
    type: "article",
    url: "https://www.meetcursive.com/blog/sales-engagement-competitors",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "10 Best Sales Engagement Competitors to Consider in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "10 Best Sales Engagement Competitors to Consider in 2026 | Cursive",
    description: "Compare the 10 leading sales engagement competitors in 2026. Features, pricing models, and ideal use cases to match the right platform to your team.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/sales-engagement-competitors",
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
          { name: '10 Best Sales Engagement Competitors to Consider in 2026', url: 'https://www.meetcursive.com/blog/sales-engagement-competitors' },
        ]),
        generateBlogPostSchema({
          title: '10 Best Sales Engagement Competitors to Consider in 2026',
          description: 'Compare the 10 leading sales engagement competitors in 2026. Features, pricing models, and ideal use cases to match the right platform to your team.',
          url: 'https://www.meetcursive.com/blog/sales-engagement-competitors',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
