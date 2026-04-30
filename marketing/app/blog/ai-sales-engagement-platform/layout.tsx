import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Cursive: AI Sales Engagement Platform | Cursive",
  description: "Learn how AI sales engagement platforms automate prospecting, outreach, and meeting booking. See how Cursive identifies website visitors and converts them into pipeline.",
  keywords: "ai sales engagement, ai sales engagement platform, sales engagement software, ai outreach, ai prospecting, visitor identification, ai sdr platform",

  openGraph: {
    title: "Cursive: AI Sales Engagement Platform | Cursive",
    description: "Learn how AI sales engagement platforms automate prospecting, outreach, and meeting booking. See how Cursive identifies website visitors and converts them into pipeline.",
    type: "article",
    url: "https://www.meetcursive.com/blog/ai-sales-engagement-platform",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive: AI Sales Engagement Platform",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive: AI Sales Engagement Platform | Cursive",
    description: "Learn how AI sales engagement platforms automate prospecting, outreach, and meeting booking. See how Cursive identifies website visitors and converts them into pipeline.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/ai-sales-engagement-platform",
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
          { name: 'Cursive: AI Sales Engagement Platform', url: 'https://www.meetcursive.com/blog/ai-sales-engagement-platform' },
        ]),
        generateBlogPostSchema({
          title: 'Cursive: AI Sales Engagement Platform',
          description: 'Learn how AI sales engagement platforms automate prospecting, outreach, and meeting booking. See how Cursive identifies website visitors and converts them into pipeline.',
          url: 'https://www.meetcursive.com/blog/ai-sales-engagement-platform',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
