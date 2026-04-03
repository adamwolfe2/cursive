import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Sales Automation Tools in 2026: 15 Platforms We Tested | Cursive",
  description: "We tested 15 sales automation platforms across prospecting, outreach, CRM management, and conversation intelligence. See pricing, features, and which tool fits your workflow.",
  keywords: "sales automation tools, sales automation software, best sales automation platforms, sales automation 2026, AI sales tools, outbound automation, CRM automation",

  openGraph: {
    title: "Best Sales Automation Tools in 2026: 15 Platforms We Tested | Cursive",
    description: "We tested 15 sales automation platforms across prospecting, outreach, CRM management, and conversation intelligence. See pricing, features, and which tool fits your workflow.",
    type: "article",
    url: "https://www.meetcursive.com/blog/sales-automation-tools",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Sales Automation Tools in 2026: 15 Platforms We Tested",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Sales Automation Tools in 2026: 15 Platforms We Tested | Cursive",
    description: "We tested 15 sales automation platforms across prospecting, outreach, CRM management, and conversation intelligence. See pricing, features, and which tool fits your workflow.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/sales-automation-tools",
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
          { name: 'Best Sales Automation Tools in 2026: 15 Platforms We Tested', url: 'https://www.meetcursive.com/blog/sales-automation-tools' },
        ]),
        generateBlogPostSchema({
          title: 'Best Sales Automation Tools in 2026: 15 Platforms We Tested',
          description: 'We tested 15 sales automation platforms across prospecting, outreach, CRM management, and conversation intelligence. See pricing, features, and which tool fits your workflow.',
          url: 'https://www.meetcursive.com/blog/sales-automation-tools',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
