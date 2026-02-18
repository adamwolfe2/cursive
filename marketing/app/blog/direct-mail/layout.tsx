import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Direct Mail Marketing Automation: Combine Digital + Physical for 3-5x Higher Conversions (2026) | Cursive",
  description: "Learn how to automate direct mail campaigns triggered by digital behavior. Covers combining offline and online marketing, ROI measurement, address verification, and implementation for B2B teams.",
  keywords: "direct mail automation, triggered direct mail, postcard marketing, offline marketing, direct mail retargeting, physical mail automation, hybrid marketing campaigns, B2B direct mail, programmatic direct mail, direct mail ROI, marketing automation, multi-channel marketing",

  openGraph: {
    title: "Direct Mail Marketing Automation: Combine Digital + Physical for 3-5x Higher Conversions (2026) | Cursive",
    description: "Learn how to automate direct mail campaigns triggered by digital behavior. Covers combining offline and online marketing, ROI measurement, address verification, and implementation for B2B teams.",
    type: "article",
    url: "https://www.meetcursive.com/blog/direct-mail",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Direct Mail Marketing Automation: Combine Digital + Physical for Higher Conversions",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Direct Mail Marketing Automation: Combine Digital + Physical for 3-5x Higher Conversions (2026) | Cursive",
    description: "Learn how to automate direct mail campaigns triggered by digital behavior. Covers combining offline and online marketing, ROI measurement, address verification, and implementation for B2B teams.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/direct-mail",
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
          { name: 'Direct Mail Marketing Automation: Combine Digital + Physical for 3-5x Higher Conversions (2026)', url: 'https://www.meetcursive.com/blog/direct-mail' },
        ]),
        generateBlogPostSchema({
          title: 'Direct Mail Marketing Automation: Combine Digital + Physical for 3-5x Higher Conversions (2026)',
          description: 'Learn how to automate direct mail campaigns triggered by digital behavior. Covers combining offline and online marketing, ROI measurement, address verification, and implementation for B2B teams.',
          url: 'https://www.meetcursive.com/blog/direct-mail',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
