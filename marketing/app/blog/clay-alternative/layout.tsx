import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Clay Alternatives: Easier Data Enrichment + Outbound Tools (2026) | Cursive",
  description: "Compare the best Clay alternatives for data enrichment, lead building, and outbound automation. Find simpler platforms that combine enrichment with visitor identification and outreach.",
  keywords: "clay alternatives, clay competitors, data enrichment tools, clay vs cursive, lead enrichment platform, b2b data enrichment, clay spreadsheet alternative, waterfall enrichment, lead building tools, outbound data platform",

  openGraph: {
    title: "Clay Alternatives: Easier Data Enrichment + Outbound Tools (2026) | Cursive",
    description: "Compare the best Clay alternatives for data enrichment, lead building, and outbound automation. Find simpler platforms that combine enrichment with visitor identification and outreach.",
    type: "article",
    url: "https://www.meetcursive.com/blog/clay-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Clay Alternatives: Easier Data Enrichment + Outbound Tools (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Clay Alternatives: Easier Data Enrichment + Outbound Tools (2026) | Cursive",
    description: "Compare the best Clay alternatives for data enrichment, lead building, and outbound automation. Find simpler platforms that combine enrichment with visitor identification and outreach.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/clay-alternative",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
