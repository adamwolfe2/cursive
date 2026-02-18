import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Complete ICP Targeting Guide for B2B Marketers | Cursive",
  description: "Build and target your ideal customer profile (ICP) with data-driven strategies. Define firmographics, behaviors, and intent signals for better conversions.",
  keywords: "ICP targeting, ideal customer profile, B2B targeting, customer segmentation, firmographic targeting, ICP definition",

  openGraph: {
    title: "Complete ICP Targeting Guide for B2B Marketers | Cursive",
    description: "Build and target your ideal customer profile (ICP) with data-driven strategies. Define firmographics, behaviors, and intent signals for better conversions.",
    type: "article",
    url: "https://www.meetcursive.com/blog/icp-targeting-guide",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Complete ICP Targeting Guide for B2B Marketers",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Complete ICP Targeting Guide for B2B Marketers | Cursive",
    description: "Build and target your ideal customer profile (ICP) with data-driven strategies. Define firmographics, behaviors, and intent signals for better conversions.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/icp-targeting-guide",
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
          { name: 'Complete ICP Targeting Guide for B2B Marketers', url: 'https://www.meetcursive.com/blog/icp-targeting-guide' },
        ]),
        generateBlogPostSchema({
          title: 'Complete ICP Targeting Guide for B2B Marketers',
          description: 'Build and target your ideal customer profile (ICP) with data-driven strategies. Define firmographics, behaviors, and intent signals for better conversions.',
          url: 'https://www.meetcursive.com/blog/icp-targeting-guide',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
