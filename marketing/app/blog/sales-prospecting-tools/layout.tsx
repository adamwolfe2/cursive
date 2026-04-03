import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "15 Best Sales Prospecting Tools for B2B Teams in 2026 | Cursive",
  description: "Compare the 15 best B2B sales prospecting tools for 2026. Covers data providers, sales engagement platforms, visitor identification, and AI-powered outreach with pricing and features.",
  keywords: "sales prospecting tools, B2B prospecting software, prospecting tools, sales prospecting, best prospecting tools 2026, B2B sales tools, lead prospecting, sales engagement tools",

  openGraph: {
    title: "15 Best Sales Prospecting Tools for B2B Teams in 2026 | Cursive",
    description: "Compare the 15 best B2B sales prospecting tools for 2026. Covers data providers, sales engagement platforms, visitor identification, and AI-powered outreach with pricing and features.",
    type: "article",
    url: "https://www.meetcursive.com/blog/sales-prospecting-tools",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "15 Best Sales Prospecting Tools for B2B Teams in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "15 Best Sales Prospecting Tools for B2B Teams in 2026 | Cursive",
    description: "Compare the 15 best B2B sales prospecting tools for 2026. Covers data providers, sales engagement platforms, visitor identification, and AI-powered outreach with pricing and features.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/sales-prospecting-tools",
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
          { name: '15 Best Sales Prospecting Tools for B2B Teams in 2026', url: 'https://www.meetcursive.com/blog/sales-prospecting-tools' },
        ]),
        generateBlogPostSchema({
          title: '15 Best Sales Prospecting Tools for B2B Teams in 2026',
          description: 'Compare the 15 best B2B sales prospecting tools for 2026. Covers data providers, sales engagement platforms, visitor identification, and AI-powered outreach with pricing and features.',
          url: 'https://www.meetcursive.com/blog/sales-prospecting-tools',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
