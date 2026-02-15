import { Metadata } from "next"

export const metadata: Metadata = {
  title: "B2B Audience Targeting: The Complete Guide to Data-Driven Segmentation (2026) | Cursive",
  description: "Master B2B audience targeting with data-driven segmentation strategies. Learn how to build your ICP, use firmographic and intent data, and create high-converting audience segments at scale.",
  keywords: "audience targeting, B2B audience segmentation, audience builder, intent-based targeting, firmographic targeting, customer segmentation, target audience identification, ideal customer profile, ICP targeting, B2B marketing segmentation, behavioral targeting, account-based marketing",

  openGraph: {
    title: "B2B Audience Targeting: The Complete Guide to Data-Driven Segmentation (2026) | Cursive",
    description: "Master B2B audience targeting with data-driven segmentation strategies. Learn how to build your ICP, use firmographic and intent data, and create high-converting audience segments at scale.",
    type: "article",
    url: "https://www.meetcursive.com/blog/audience-targeting",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "B2B Audience Targeting: The Complete Guide to Data-Driven Segmentation",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "B2B Audience Targeting: The Complete Guide to Data-Driven Segmentation (2026) | Cursive",
    description: "Master B2B audience targeting with data-driven segmentation strategies. Learn how to build your ICP, use firmographic and intent data, and create high-converting audience segments at scale.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/audience-targeting",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
