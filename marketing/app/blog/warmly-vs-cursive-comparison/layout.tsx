import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Warmly vs Cursive Comparison: Which Intent Platform is Right for You? | Cursive",
  description: "Compare Warmly and Cursive side-by-side. See how these two intent-based platforms differ in features, pricing, use cases, and ROI. Detailed analysis for B2B teams.",
  keywords: "warmly vs cursive, cursive vs warmly, intent platform comparison, website visitor identification, B2B intent data, sales intelligence platform, warmly alternative, cursive alternative, account-based marketing tools, buyer intent platforms",

  openGraph: {
    title: "Warmly vs Cursive Comparison: Which Intent Platform is Right for You? | Cursive",
    description: "Compare Warmly and Cursive side-by-side. See how these two intent-based platforms differ in features, pricing, use cases, and ROI. Detailed analysis for B2B teams.",
    type: "article",
    url: "https://www.meetcursive.com/blog/warmly-vs-cursive-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Warmly vs Cursive Comparison: Which Intent Platform is Right for You?",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Warmly vs Cursive Comparison: Which Intent Platform is Right for You? | Cursive",
    description: "Compare Warmly and Cursive side-by-side. See how these two intent-based platforms differ in features, pricing, use cases, and ROI. Detailed analysis for B2B teams.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/warmly-vs-cursive-comparison",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
