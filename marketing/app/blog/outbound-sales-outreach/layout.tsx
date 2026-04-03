import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Outbound Sales Outreach: The Complete Guide for 2026 | Cursive",
  description: "Complete guide to outbound sales outreach covering ICP definition, multi-channel sequences, personalization tactics, tools, and metrics that drive meetings in 2026.",
  keywords: "outbound sales outreach, outbound sales strategy, B2B outbound, cold outreach guide, sales prospecting, outbound lead generation, multi-channel outreach",

  openGraph: {
    title: "Outbound Sales Outreach: The Complete Guide for 2026 | Cursive",
    description: "Complete guide to outbound sales outreach covering ICP definition, multi-channel sequences, personalization tactics, tools, and metrics that drive meetings in 2026.",
    type: "article",
    url: "https://www.meetcursive.com/blog/outbound-sales-outreach",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Outbound Sales Outreach: The Complete Guide for 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Outbound Sales Outreach: The Complete Guide for 2026 | Cursive",
    description: "Complete guide to outbound sales outreach covering ICP definition, multi-channel sequences, personalization tactics, tools, and metrics that drive meetings in 2026.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/outbound-sales-outreach",
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
          { name: 'Outbound Sales Outreach: The Complete Guide for 2026', url: 'https://www.meetcursive.com/blog/outbound-sales-outreach' },
        ]),
        generateBlogPostSchema({
          title: 'Outbound Sales Outreach: The Complete Guide for 2026',
          description: 'Complete guide to outbound sales outreach covering ICP definition, multi-channel sequences, personalization tactics, tools, and metrics that drive meetings in 2026.',
          url: 'https://www.meetcursive.com/blog/outbound-sales-outreach',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
