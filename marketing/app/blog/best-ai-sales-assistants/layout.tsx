import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "The 12 Best AI Sales Assistants for 2026 | Cursive",
  description: "Compare the 12 best AI sales assistant platforms for 2026. See pricing, features, and which tool fits your team's workflow for prospecting, outreach, and CRM automation.",
  keywords: "ai sales assistants, ai sales assistant software, best ai sales tools 2026, ai sales platforms, ai sdr, sales automation, ai prospecting tools",

  openGraph: {
    title: "The 12 Best AI Sales Assistants for 2026 | Cursive",
    description: "Compare the 12 best AI sales assistant platforms for 2026. See pricing, features, and which tool fits your team's workflow for prospecting, outreach, and CRM automation.",
    type: "article",
    url: "https://www.meetcursive.com/blog/best-ai-sales-assistants",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The 12 Best AI Sales Assistants for 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "The 12 Best AI Sales Assistants for 2026 | Cursive",
    description: "Compare the 12 best AI sales assistant platforms for 2026. See pricing, features, and which tool fits your team's workflow for prospecting, outreach, and CRM automation.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/best-ai-sales-assistants",
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
          { name: 'The 12 Best AI Sales Assistants for 2026', url: 'https://www.meetcursive.com/blog/best-ai-sales-assistants' },
        ]),
        generateBlogPostSchema({
          title: 'The 12 Best AI Sales Assistants for 2026',
          description: 'Compare the 12 best AI sales assistant platforms for 2026. See pricing, features, and which tool fits your team\'s workflow for prospecting, outreach, and CRM automation.',
          url: 'https://www.meetcursive.com/blog/best-ai-sales-assistants',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
