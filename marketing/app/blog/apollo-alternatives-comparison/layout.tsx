import { Metadata } from "next"

export const metadata: Metadata = {
  title: "7 Best Apollo.io Alternatives & Competitors in 2026 | Cursive",
  description: "Looking for Apollo.io alternatives? Compare the 7 best competitors for B2B prospecting, intent data, and outbound automation. Find the right tool for your sales team in 2026.",
  keywords: [
    "apollo alternatives",
    "apollo.io alternatives",
    "apollo competitors",
    "apollo.io competitors",
    "b2b prospecting tools",
    "sales intelligence platforms",
    "outbound automation tools",
    "apollo replacement",
    "sales engagement platforms",
    "b2b data providers"
  ].join(", "),

  openGraph: {
    title: "7 Best Apollo.io Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for Apollo.io alternatives? Compare the 7 best competitors for B2B prospecting, intent data, and outbound automation. Find the right tool for your sales team in 2026.",
    type: "article",
    url: "https://www.meetcursive.com/blog/apollo-alternatives-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "7 Best Apollo.io Alternatives & Competitors in 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "7 Best Apollo.io Alternatives & Competitors in 2026 | Cursive",
    description: "Looking for Apollo.io alternatives? Compare the 7 best competitors for B2B prospecting, intent data, and outbound automation. Find the right tool for your sales team in 2026.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/apollo-alternatives-comparison",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
