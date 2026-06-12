import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "5 Identity Resolution Case Studies: Real Results From Real Campaigns | Cursive",
  description: "Five real identity resolution campaigns: B2B SaaS accuracy from 12% to 94%, 3x outreach conversion for mass tort, 34% ad spend efficiency gain via suppression, and more.",
  keywords: "identity resolution results, visitor identification case study, intent data ROI, pixel identity resolution results, website visitor identification roi, b2b identity resolution, visitor deanonymization results",

  openGraph: {
    title: "5 Identity Resolution Case Studies: Real Results From Real Campaigns | Cursive",
    description: "Five real identity resolution campaigns: B2B SaaS accuracy from 12% to 94%, 3x outreach conversion for mass tort, 34% ad spend efficiency gain via suppression, and more.",
    type: "article",
    url: "https://www.meetcursive.com/blog/identity-resolution-case-studies",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "5 Identity Resolution Case Studies: Real Results From Real Campaigns",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "5 Identity Resolution Case Studies: Real Results From Real Campaigns | Cursive",
    description: "Five real identity resolution campaigns: B2B SaaS accuracy from 12% to 94%, 3x outreach conversion for mass tort, 34% ad spend efficiency gain via suppression, and more.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/identity-resolution-case-studies",
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
          { name: '5 Identity Resolution Case Studies: Real Results From Real Campaigns', url: 'https://www.meetcursive.com/blog/identity-resolution-case-studies' },
        ]),
        generateBlogPostSchema({
          title: '5 Identity Resolution Case Studies: Real Results From Real Campaigns',
          description: 'Five real identity resolution campaigns: B2B SaaS accuracy from 12% to 94%, 3x outreach conversion for mass tort, 34% ad spend efficiency gain via suppression, and more.',
          url: 'https://www.meetcursive.com/blog/identity-resolution-case-studies',
          datePublished: '2026-06-12',
          dateModified: '2026-06-12',
        }),
      ]} />
      {children}
    </>
  )
}
