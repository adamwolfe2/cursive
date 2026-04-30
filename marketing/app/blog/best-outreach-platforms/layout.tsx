import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "12 Best Outreach Platforms for 2026 (Pricing and Features Compared) | Cursive",
  description: "Compare 12 leading outreach platforms by pricing, features, and use case. Includes Cursive, Outreach, Apollo, Salesloft, Reply.io, Lemlist, Instantly, and more.",
  keywords: "best outreach platforms, sales outreach tools, outreach software comparison, outreach platform pricing, email outreach tools 2026, sales engagement platforms",

  openGraph: {
    title: "12 Best Outreach Platforms for 2026 (Pricing and Features Compared) | Cursive",
    description: "Compare 12 leading outreach platforms by pricing, features, and use case. Includes Cursive, Outreach, Apollo, Salesloft, Reply.io, Lemlist, Instantly, and more.",
    type: "article",
    url: "https://www.meetcursive.com/blog/best-outreach-platforms",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "12 Best Outreach Platforms for 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "12 Best Outreach Platforms for 2026 (Pricing and Features Compared) | Cursive",
    description: "Compare 12 leading outreach platforms by pricing, features, and use case. Includes Cursive, Outreach, Apollo, Salesloft, Reply.io, Lemlist, Instantly, and more.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/best-outreach-platforms",
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
          { name: '12 Best Outreach Platforms for 2026', url: 'https://www.meetcursive.com/blog/best-outreach-platforms' },
        ]),
        generateBlogPostSchema({
          title: '12 Best Outreach Platforms for 2026 (Pricing and Features Compared)',
          description: 'Compare 12 leading outreach platforms by pricing, features, and use case. Includes Cursive, Outreach, Apollo, Salesloft, Reply.io, Lemlist, Instantly, and more.',
          url: 'https://www.meetcursive.com/blog/best-outreach-platforms',
          datePublished: '2026-04-03',
          dateModified: '2026-04-03',
        }),
      ]} />
      {children}
    </>
  )
}
