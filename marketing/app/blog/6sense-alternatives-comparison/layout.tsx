import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "7 Best 6sense Alternatives & Competitors in 2026 | Cursive",
  description: "Compare the 7 best 6sense alternatives for intent data, account identification, and predictive analytics. Find affordable ABM tools that deliver results without enterprise contracts starting at $50k+/yr.",
  keywords: "6sense alternatives, 6sense competitors, intent data platforms, account based marketing tools, predictive analytics alternatives, 6sense vs competitors, affordable abm platforms, b2b intent data tools, buyer intent software, revenue intelligence platforms",

  openGraph: {
    title: "7 Best 6sense Alternatives & Competitors in 2026 | Cursive",
    description: "Compare the 7 best 6sense alternatives for intent data, account identification, and predictive analytics. Find affordable ABM tools that deliver results without enterprise contracts starting at $50k+/yr.",
    type: "article",
    url: "https://www.meetcursive.com/blog/6sense-alternatives-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "7 Best 6sense Alternatives & Competitors in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "7 Best 6sense Alternatives & Competitors in 2026 | Cursive",
    description: "Compare the 7 best 6sense alternatives for intent data, account identification, and predictive analytics. Find affordable ABM tools that deliver results without enterprise contracts starting at $50k+/yr.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/6sense-alternatives-comparison",
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
          { name: '7 Best 6sense Alternatives & Competitors in 2026', url: 'https://www.meetcursive.com/blog/6sense-alternatives-comparison' },
        ]),
        generateBlogPostSchema({
          title: '7 Best 6sense Alternatives & Competitors in 2026',
          description: 'Compare the 7 best 6sense alternatives for intent data, account identification, and predictive analytics. Find affordable ABM tools that deliver results without enterprise contracts starting at $50k+/yr.',
          url: 'https://www.meetcursive.com/blog/6sense-alternatives-comparison',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
