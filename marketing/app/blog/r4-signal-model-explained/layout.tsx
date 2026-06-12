import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "The R4 Signal Model: How Cursive Turns Raw Intent Into High-Confidence Buying Signals | Cursive",
  description: "The R4 Signal Model explains how Cursive processes raw behavioral signals into high-confidence buying intent. Four layers: Relevance, Reasoning, Recognition, and Restrictions.",
  keywords: "R4 signal model, intent data quality, how intent signals work, identity resolution signal quality, b2b buying signals, intent data framework, url level intent, buyer stage classification",

  openGraph: {
    title: "The R4 Signal Model: How Cursive Turns Raw Intent Into High-Confidence Buying Signals | Cursive",
    description: "The R4 Signal Model explains how Cursive processes raw behavioral signals into high-confidence buying intent. Four layers: Relevance, Reasoning, Recognition, and Restrictions.",
    type: "article",
    url: "https://www.meetcursive.com/blog/r4-signal-model-explained",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "The R4 Signal Model: How Cursive Turns Raw Intent Into High-Confidence Buying Signals",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "The R4 Signal Model: How Cursive Turns Raw Intent Into High-Confidence Buying Signals | Cursive",
    description: "The R4 Signal Model explains how Cursive processes raw behavioral signals into high-confidence buying intent. Four layers: Relevance, Reasoning, Recognition, and Restrictions.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/r4-signal-model-explained",
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
          { name: 'The R4 Signal Model: How Cursive Turns Raw Intent Into High-Confidence Buying Signals', url: 'https://www.meetcursive.com/blog/r4-signal-model-explained' },
        ]),
        generateBlogPostSchema({
          title: 'The R4 Signal Model: How Cursive Turns Raw Intent Into High-Confidence Buying Signals',
          description: 'The R4 Signal Model explains how Cursive processes raw behavioral signals into high-confidence buying intent. Four layers: Relevance, Reasoning, Recognition, and Restrictions.',
          url: 'https://www.meetcursive.com/blog/r4-signal-model-explained',
          datePublished: '2026-06-12',
          dateModified: '2026-06-12',
        }),
      ]} />
      {children}
    </>
  )
}
