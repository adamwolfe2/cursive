import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Apollo vs Cursive: Complete Comparison (2026) | Cursive",
  description: "Compare Apollo.io and Cursive for sales intelligence, visitor identification, and outreach automation. Discover which platform delivers better ROI for your B2B sales team.",
  keywords: "apollo vs cursive, apollo.io alternative, visitor identification, sales engagement platform, b2b prospecting tools, cursive vs apollo, apollo pricing, cursive pricing, sales intelligence comparison, outreach automation",

  openGraph: {
    title: "Apollo vs Cursive: Complete Comparison (2026) | Cursive",
    description: "Compare Apollo.io and Cursive for sales intelligence, visitor identification, and outreach automation. Discover which platform delivers better ROI for your B2B sales team.",
    type: "article",
    url: "https://www.meetcursive.com/blog/apollo-vs-cursive-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Apollo vs Cursive: Complete Comparison (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Apollo vs Cursive: Complete Comparison (2026) | Cursive",
    description: "Compare Apollo.io and Cursive for sales intelligence, visitor identification, and outreach automation. Discover which platform delivers better ROI for your B2B sales team.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/apollo-vs-cursive-comparison",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
