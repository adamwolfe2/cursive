import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Cursive vs Leadfeeder: Person vs Company ID, $1k vs $139/mo (2026) | Cursive",
  description: "Leadfeeder identifies the company but not the person. Cursive reveals the actual individual — name, email, LinkedIn — at 70% ID rate. Compare approaches, pricing, and pipeline impact.",
  keywords: "cursive vs leadfeeder, leadfeeder alternative, leadfeeder competitor, person level identification, company level identification, website visitor identification, leadfeeder pricing, leadfeeder review, b2b visitor tracking, best leadfeeder alternative 2026",

  openGraph: {
    title: "Cursive vs Leadfeeder: Person vs Company ID, $1k vs $139/mo (2026) | Cursive",
    description: "Leadfeeder identifies the company but not the person. Cursive reveals the actual individual — name, email, LinkedIn — at 70% ID rate. Compare approaches, pricing, and pipeline impact.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-leadfeeder",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs Leadfeeder: Person-Level vs Company-Level ID (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs Leadfeeder: Person vs Company ID, $1k vs $139/mo (2026) | Cursive",
    description: "Leadfeeder identifies the company but not the person. Cursive reveals the actual individual — name, email, LinkedIn — at 70% ID rate. Compare approaches and pricing.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-leadfeeder",
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
          { name: 'Cursive vs Leadfeeder: Person vs Company ID, $1k vs $139/mo (2026)', url: 'https://www.meetcursive.com/blog/cursive-vs-leadfeeder' },
        ]),
        generateBlogPostSchema({
          title: 'Cursive vs Leadfeeder: Person vs Company ID, $1k vs $139/mo (2026)',
          description: 'Leadfeeder identifies the company but not the person. Cursive reveals the actual individual — name, email, LinkedIn — at 70% ID rate. Compare approaches, pricing, and pipeline impact.',
          url: 'https://www.meetcursive.com/blog/cursive-vs-leadfeeder',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
