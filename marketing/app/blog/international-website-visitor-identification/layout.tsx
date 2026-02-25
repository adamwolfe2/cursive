import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "International Website Visitor Identification: EU, UK & APAC Guide (2026)",
  description: "Most visitor ID tools only work for US traffic. Learn how to identify website visitors from the EU, UK, Canada, and APAC — not just North America — with compliant, global person-level identification.",
  keywords: [
    "international website visitor identification",
    "eu website visitor identification",
    "uk visitor identification",
    "global visitor tracking",
    "visitor identification outside usa",
    "b2b visitor identification europe",
    "apac visitor identification",
    "international b2b lead generation",
    "non-us visitor tracking",
    "global person level identification",
  ].join(", "),

  openGraph: {
    title: "International Website Visitor Identification: EU, UK & APAC Guide (2026)",
    description: "Most visitor ID tools only work for US traffic. Learn how to identify website visitors from the EU, UK, Canada, and APAC — not just North America — with compliant, global person-level identification.",
    type: "article",
    url: "https://www.meetcursive.com/blog/international-website-visitor-identification",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "International Website Visitor Identification: EU, UK & APAC Guide (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "International Website Visitor Identification: EU, UK & APAC Guide (2026)",
    description: "Most visitor ID tools only work for US traffic. Learn how to identify website visitors from the EU, UK, Canada, and APAC — not just North America — with compliant, global person-level identification.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/international-website-visitor-identification",
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
          { name: 'International Website Visitor Identification: EU, UK & APAC Guide (2026)', url: 'https://www.meetcursive.com/blog/international-website-visitor-identification' },
        ]),
        generateBlogPostSchema({
          title: 'International Website Visitor Identification: EU, UK & APAC Guide (2026)',
          description: 'Most visitor ID tools only work for US traffic. Learn how to identify website visitors from the EU, UK, Canada, and APAC — not just North America — with compliant, global person-level identification.',
          url: 'https://www.meetcursive.com/blog/international-website-visitor-identification',
          datePublished: '2026-02-24',
          dateModified: '2026-02-24',
        }),
      ]} />
      {children}
    </>
  )
}
