import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Smartlead Alternatives: Email Outreach with Visitor Tracking (2026) | Cursive",
  description: "Compare the best Smartlead alternatives that combine email outreach with visitor identification and intent data. Find platforms with built-in visitor tracking, AI SDR, and multi-channel outreach.",
  keywords: "smartlead alternatives, smartlead competitors, cold email software, email outreach platform, smartlead vs cursive, inbox rotation tools, cold email deliverability, b2b email automation, visitor identification email, ai sdr platform",

  openGraph: {
    title: "Smartlead Alternatives: Email Outreach with Visitor Tracking (2026) | Cursive",
    description: "Compare the best Smartlead alternatives that combine email outreach with visitor identification and intent data. Find platforms with built-in visitor tracking, AI SDR, and multi-channel outreach.",
    type: "article",
    url: "https://www.meetcursive.com/blog/smartlead-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Smartlead Alternatives: Email Outreach with Visitor Tracking (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Smartlead Alternatives: Email Outreach with Visitor Tracking (2026) | Cursive",
    description: "Compare the best Smartlead alternatives that combine email outreach with visitor identification and intent data. Find platforms with built-in visitor tracking, AI SDR, and multi-channel outreach.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/smartlead-alternative",
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
          { name: 'Smartlead Alternatives: Email Outreach with Visitor Tracking (2026)', url: 'https://www.meetcursive.com/blog/smartlead-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Smartlead Alternatives: Email Outreach with Visitor Tracking (2026)',
          description: 'Compare the best Smartlead alternatives that combine email outreach with visitor identification and intent data. Find platforms with built-in visitor tracking, AI SDR, and multi-channel outreach.',
          url: 'https://www.meetcursive.com/blog/smartlead-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
