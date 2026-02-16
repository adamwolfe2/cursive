import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Complete ICP Targeting Guide for B2B Marketers | Cursive",
  description: "Build and target your ideal customer profile (ICP) with data-driven strategies. Define firmographics, behaviors, and intent signals for better conversions.",
  keywords: "ICP targeting, ideal customer profile, B2B targeting, customer segmentation, firmographic targeting, ICP definition",

  openGraph: {
    title: "Complete ICP Targeting Guide for B2B Marketers | Cursive",
    description: "Build and target your ideal customer profile (ICP) with data-driven strategies. Define firmographics, behaviors, and intent signals for better conversions.",
    type: "article",
    url: "https://www.meetcursive.com/blog/icp-targeting-guide",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Complete ICP Targeting Guide for B2B Marketers",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Complete ICP Targeting Guide for B2B Marketers | Cursive",
    description: "Build and target your ideal customer profile (ICP) with data-driven strategies. Define firmographics, behaviors, and intent signals for better conversions.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/icp-targeting-guide",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
