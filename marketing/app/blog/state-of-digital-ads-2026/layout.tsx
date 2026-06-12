import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "The State of Digital Ads in 2026: Why CPL Keeps Rising and What to Do About It | Cursive",
  description: "B2B cost per lead has risen 3-5x in four years. Here is why Meta and paid ads are structurally inflated — and how intent-qualified outreach sidesteps all four cost vectors.",
  keywords: "cost per lead 2026, digital advertising ROI, meta ads performance 2026, why digital ads cost more, B2B CPL inflation, intent data alternative to paid ads, meta ad fraud B2B",

  openGraph: {
    title: "The State of Digital Ads in 2026: Why CPL Keeps Rising and What to Do About It | Cursive",
    description: "B2B cost per lead has risen 3-5x in four years. Here is why Meta and paid ads are structurally inflated — and how intent-qualified outreach sidesteps all four cost vectors.",
    type: "article",
    url: "https://www.meetcursive.com/blog/state-of-digital-ads-2026",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The State of Digital Ads in 2026: Why CPL Keeps Rising",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "The State of Digital Ads in 2026: Why CPL Keeps Rising and What to Do About It | Cursive",
    description: "B2B cost per lead has risen 3-5x in four years. Here is why Meta and paid ads are structurally inflated — and how intent-qualified outreach sidesteps all four cost vectors.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/state-of-digital-ads-2026",
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
          { name: 'The State of Digital Ads in 2026: Why CPL Keeps Rising and What to Do About It', url: 'https://www.meetcursive.com/blog/state-of-digital-ads-2026' },
        ]),
        generateBlogPostSchema({
          title: 'The State of Digital Ads in 2026: Why CPL Keeps Rising and What to Do About It',
          description: 'B2B cost per lead has risen 3-5x in four years. Here is why Meta and paid ads are structurally inflated — and how intent-qualified outreach sidesteps all four cost vectors.',
          url: 'https://www.meetcursive.com/blog/state-of-digital-ads-2026',
          datePublished: '2026-06-12',
          dateModified: '2026-06-12',
        }),
      ]} />
      {children}
    </>
  )
}
