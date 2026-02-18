import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Best Datashopper Alternatives: 7 B2B Data Providers Compared (2026)",
  description: "Compare the top Datashopper alternatives for B2B data. Find providers with visitor identification, intent signals, AI-powered outreach, and fresher data than Datashopper.",
  keywords: "datashopper alternative, datashopper alternatives, datashopper competitor, b2b data provider alternative to datashopper, best datashopper replacement, datashopper vs cursive, b2b contact data tools",

  openGraph: {
    title: "Best Datashopper Alternatives: 7 B2B Data Providers Compared (2026) | Cursive",
    description: "Compare the top Datashopper alternatives for B2B data. Find providers with visitor identification, intent signals, AI-powered outreach, and fresher data than Datashopper.",
    type: "article",
    url: "https://www.meetcursive.com/blog/datashopper-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Best Datashopper Alternatives: 7 B2B Data Providers Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Datashopper Alternatives: 7 B2B Data Providers Compared (2026) | Cursive",
    description: "Compare the top Datashopper alternatives for B2B data. Find providers with visitor identification, intent signals, AI-powered outreach, and fresher data than Datashopper.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/datashopper-alternative",
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
          { name: 'Best Datashopper Alternatives: 7 B2B Data Providers Compared (2026)', url: 'https://www.meetcursive.com/blog/datashopper-alternative' },
        ]),
        generateBlogPostSchema({
          title: 'Best Datashopper Alternatives: 7 B2B Data Providers Compared (2026)',
          description: 'Compare the top Datashopper alternatives for B2B data. Find providers with visitor identification, intent signals, AI-powered outreach, and fresher data than Datashopper.',
          url: 'https://www.meetcursive.com/blog/datashopper-alternative',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
