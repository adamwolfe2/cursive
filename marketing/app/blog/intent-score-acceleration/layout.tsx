import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Score Acceleration: How to Use Daily Intent Score Trends to Build Your Sales Call List | Cursive",
  description: "Stop sorting by absolute intent score. Sort by Score Trend to find accounts that just entered an active research phase. Here's the morning routine that triples demo bookings.",
  keywords: "intent score acceleration, intent data for sales, daily sales call list intent, how to use intent scores, score trend outreach, intent data morning routine, b2b sales prospecting intent",

  openGraph: {
    title: "Score Acceleration: How to Use Daily Intent Score Trends to Build Your Sales Call List | Cursive",
    description: "Stop sorting by absolute intent score. Sort by Score Trend to find accounts that just entered an active research phase. Here's the morning routine that triples demo bookings.",
    type: "article",
    url: "https://www.meetcursive.com/blog/intent-score-acceleration",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Score Acceleration: How to Use Daily Intent Score Trends to Build Your Sales Call List",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Score Acceleration: How to Use Daily Intent Score Trends to Build Your Sales Call List | Cursive",
    description: "Stop sorting by absolute intent score. Sort by Score Trend to find accounts that just entered an active research phase. Here's the morning routine that triples demo bookings.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/intent-score-acceleration",
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
          { name: 'Score Acceleration: How to Use Daily Intent Score Trends to Build Your Sales Call List', url: 'https://www.meetcursive.com/blog/intent-score-acceleration' },
        ]),
        generateBlogPostSchema({
          title: 'Score Acceleration: How to Use Daily Intent Score Trends to Build Your Sales Call List',
          description: 'Stop sorting by absolute intent score. Sort by Score Trend to find accounts that just entered an active research phase. Here\'s the morning routine that triples demo bookings.',
          url: 'https://www.meetcursive.com/blog/intent-score-acceleration',
          datePublished: '2026-06-12',
          dateModified: '2026-06-12',
        }),
      ]} />
      {children}
    </>
  )
}
