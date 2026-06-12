import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Why Intent Data Fails — And How to Fix It | Cursive",
  description: "Most intent data platforms deliver high scores and low conversions. Here are the 6 structural failure modes killing your ROI — and how Cursive's R4 model solves each one.",
  keywords: "why intent data doesn't work, intent data problems, fix intent data strategy, intent data conversion rate, intent data quality, b2b intent data failure, keyword intent data vs url level",

  openGraph: {
    title: "Why Intent Data Fails — And How to Fix It | Cursive",
    description: "Most intent data platforms deliver high scores and low conversions. Here are the 6 structural failure modes killing your ROI — and how Cursive's R4 model solves each one.",
    type: "article",
    url: "https://www.meetcursive.com/blog/why-intent-data-fails",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Why Intent Data Fails — And How to Fix It",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Why Intent Data Fails — And How to Fix It | Cursive",
    description: "Most intent data platforms deliver high scores and low conversions. Here are the 6 structural failure modes killing your ROI — and how Cursive's R4 model solves each one.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/why-intent-data-fails",
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
          { name: 'Why Intent Data Fails — And How to Fix It', url: 'https://www.meetcursive.com/blog/why-intent-data-fails' },
        ]),
        generateBlogPostSchema({
          title: 'Why Intent Data Fails — And How to Fix It',
          description: 'Most intent data platforms deliver high scores and low conversions. Here are the 6 structural failure modes killing your ROI — and how Cursive\'s R4 model solves each one.',
          url: 'https://www.meetcursive.com/blog/why-intent-data-fails',
          datePublished: '2026-06-12',
          dateModified: '2026-06-12',
        }),
      ]} />
      {children}
    </>
  )
}
