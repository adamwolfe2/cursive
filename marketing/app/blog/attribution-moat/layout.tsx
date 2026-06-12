import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "The Attribution Moat: Why Intent-Driven Outreach Creates Compounding Returns That Paid Ads Cannot Match | Cursive",
  description: "Unlike paid ads that reset to zero the moment you stop spending, intent-driven outreach builds a proprietary data asset that compounds over time. Here is how the attribution moat works.",
  keywords: "marketing attribution strategy, intent data ROI, attribution moat marketing, intent vs paid ads ROI, compounding marketing returns, intent data strategy B2B, first-party data asset",

  openGraph: {
    title: "The Attribution Moat: Why Intent-Driven Outreach Creates Compounding Returns That Paid Ads Cannot Match | Cursive",
    description: "Unlike paid ads that reset to zero the moment you stop spending, intent-driven outreach builds a proprietary data asset that compounds over time. Here is how the attribution moat works.",
    type: "article",
    url: "https://www.meetcursive.com/blog/attribution-moat",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The Attribution Moat: Compounding Returns from Intent-Driven Outreach",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "The Attribution Moat: Why Intent-Driven Outreach Creates Compounding Returns That Paid Ads Cannot Match | Cursive",
    description: "Unlike paid ads that reset to zero the moment you stop spending, intent-driven outreach builds a proprietary data asset that compounds over time. Here is how the attribution moat works.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/attribution-moat",
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
          { name: 'The Attribution Moat: Why Intent-Driven Outreach Creates Compounding Returns', url: 'https://www.meetcursive.com/blog/attribution-moat' },
        ]),
        generateBlogPostSchema({
          title: 'The Attribution Moat: Why Intent-Driven Outreach Creates Compounding Returns That Paid Ads Cannot Match',
          description: 'Unlike paid ads that reset to zero the moment you stop spending, intent-driven outreach builds a proprietary data asset that compounds over time. Here is how the attribution moat works.',
          url: 'https://www.meetcursive.com/blog/attribution-moat',
          datePublished: '2026-06-12',
          dateModified: '2026-06-12',
        }),
      ]} />
      {children}
    </>
  )
}
