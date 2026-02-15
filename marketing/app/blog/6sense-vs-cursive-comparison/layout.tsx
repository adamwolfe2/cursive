import { Metadata } from "next"

export const metadata: Metadata = {
  title: "6sense vs Cursive: Complete Comparison (2026) | Cursive",
  description: "Compare 6sense and Cursive for visitor identification, intent data, and automated outreach. Discover which platform delivers better ROI for your B2B sales team.",
  keywords: "6sense vs cursive, 6sense alternative, visitor identification comparison, intent data platforms, abm platform comparison, cursive vs 6sense, 6sense pricing, cursive pricing, b2b intent data, account based marketing",

  openGraph: {
    title: "6sense vs Cursive: Complete Comparison (2026) | Cursive",
    description: "Compare 6sense and Cursive for visitor identification, intent data, and automated outreach. Discover which platform delivers better ROI for your B2B sales team.",
    type: "article",
    url: "https://www.meetcursive.com/blog/6sense-vs-cursive-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "6sense vs Cursive: Complete Comparison (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "6sense vs Cursive: Complete Comparison (2026) | Cursive",
    description: "Compare 6sense and Cursive for visitor identification, intent data, and automated outreach. Discover which platform delivers better ROI for your B2B sales team.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/6sense-vs-cursive-comparison",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
