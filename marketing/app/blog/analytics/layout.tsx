import { Metadata } from "next"
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: "Marketing Analytics & Attribution: The Complete B2B Dashboard Guide (2026) | Cursive",
  description: "Build marketing analytics dashboards that prove ROI. Learn multi-touch attribution modeling, pipeline metrics, and how to measure what actually drives B2B revenue.",
  keywords: "marketing analytics, marketing attribution, B2B analytics dashboard, multi-touch attribution, marketing ROI, pipeline analytics, revenue attribution, data-driven marketing, marketing metrics, campaign attribution",

  openGraph: {
    title: "Marketing Analytics & Attribution: The Complete B2B Dashboard Guide (2026) | Cursive",
    description: "Build marketing analytics dashboards that prove ROI. Learn multi-touch attribution modeling, pipeline metrics, and how to measure what actually drives B2B revenue.",
    type: "article",
    url: "https://www.meetcursive.com/blog/analytics",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Marketing Analytics & Attribution: The Complete B2B Dashboard Guide",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Marketing Analytics & Attribution: The Complete B2B Dashboard Guide (2026) | Cursive",
    description: "Build marketing analytics dashboards that prove ROI. Learn multi-touch attribution modeling, pipeline metrics, and how to measure what actually drives B2B revenue.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/analytics",
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
          { name: 'Marketing Analytics & Attribution: The Complete B2B Dashboard Guide (2026)', url: 'https://www.meetcursive.com/blog/analytics' },
        ]),
        generateBlogPostSchema({
          title: 'Marketing Analytics & Attribution: The Complete B2B Dashboard Guide (2026)',
          description: 'Build marketing analytics dashboards that prove ROI. Learn multi-touch attribution modeling, pipeline metrics, and how to measure what actually drives B2B revenue.',
          url: 'https://www.meetcursive.com/blog/analytics',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
