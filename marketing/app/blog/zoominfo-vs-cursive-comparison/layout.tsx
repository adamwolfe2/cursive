import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ZoomInfo vs Cursive: Complete Comparison (2026) | Cursive",
  description: "Compare ZoomInfo and Cursive for B2B data, visitor identification, and sales intelligence. Discover which platform delivers better ROI for your sales team.",
  keywords: "zoominfo vs cursive, zoominfo alternative, visitor identification, b2b contact database, sales intelligence comparison, cursive vs zoominfo, zoominfo pricing, cursive pricing, b2b lead generation, contact enrichment",

  openGraph: {
    title: "ZoomInfo vs Cursive: Complete Comparison (2026) | Cursive",
    description: "Compare ZoomInfo and Cursive for B2B data, visitor identification, and sales intelligence. Discover which platform delivers better ROI for your sales team.",
    type: "article",
    url: "https://www.meetcursive.com/blog/zoominfo-vs-cursive-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "ZoomInfo vs Cursive: Complete Comparison (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZoomInfo vs Cursive: Complete Comparison (2026) | Cursive",
    description: "Compare ZoomInfo and Cursive for B2B data, visitor identification, and sales intelligence. Discover which platform delivers better ROI for your sales team.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/zoominfo-vs-cursive-comparison",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
