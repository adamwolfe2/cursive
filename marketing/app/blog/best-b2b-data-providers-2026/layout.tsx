import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best B2B Data Providers in 2026: 10 Platforms Compared | Cursive",
  description: "Compare the 10 best B2B data providers in 2026. Find the right platform for sales intelligence, contact data, and intent signals — with pricing, ratings, and a buyer's guide.",
  keywords: "best b2b data providers, b2b data providers 2026, best b2b database, b2b contact data providers, business data providers comparison, top b2b data companies, b2b data provider review, b2b sales intelligence tools",

  openGraph: {
    title: "Best B2B Data Providers in 2026: 10 Platforms Compared | Cursive",
    description: "Compare the 10 best B2B data providers in 2026. Find the right platform for sales intelligence, contact data, and intent signals — with pricing, ratings, and a buyer's guide.",
    type: "article",
    url: "https://www.meetcursive.com/blog/best-b2b-data-providers-2026",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best B2B Data Providers in 2026: 10 Platforms Compared",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best B2B Data Providers in 2026: 10 Platforms Compared | Cursive",
    description: "Compare the 10 best B2B data providers in 2026. Find the right platform for sales intelligence, contact data, and intent signals — with pricing, ratings, and a buyer's guide.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/best-b2b-data-providers-2026",
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
          { name: 'Best B2B Data Providers in 2026: 10 Platforms Compared', url: 'https://www.meetcursive.com/blog/best-b2b-data-providers-2026' },
        ]),
        generateBlogPostSchema({
          title: 'Best B2B Data Providers in 2026: 10 Platforms Compared',
          description: 'Compare the 10 best B2B data providers in 2026. Find the right platform for sales intelligence, contact data, and intent signals — with pricing, ratings, and a buyer\'s guide.',
          url: 'https://www.meetcursive.com/blog/best-b2b-data-providers-2026',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
