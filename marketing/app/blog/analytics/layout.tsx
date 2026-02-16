import { Metadata } from "next"

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
  return children
}
