import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Warmly vs Cursive: 70% ID Rate vs 40%, $1k vs $3.5k/mo (2026 Comparison) | Cursive",
  description: "Warmly vs Cursive compared: Cursive identifies 70% of visitors vs Warmly's 40%, starting at $1,000/mo vs $3,500/mo. Includes AI outreach, intent data, and direct mail. See which wins.",
  keywords: "warmly vs cursive, cursive vs warmly, warmly alternative, warmly pricing, cursive vs warmly comparison, website visitor identification comparison, intent platform comparison, warmly competitors 2026, B2B visitor tracking tools",

  openGraph: {
    title: "Warmly vs Cursive: 70% ID Rate vs 40%, $1k vs $3.5k/mo (2026) | Cursive",
    description: "Warmly vs Cursive compared: Cursive identifies 70% of visitors vs Warmly's 40%, starting at $1,000/mo vs $3,500/mo. See which visitor identification platform wins in 2026.",
    type: "article",
    url: "https://www.meetcursive.com/blog/warmly-vs-cursive-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Warmly vs Cursive: Visitor Identification Platform Comparison 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Warmly vs Cursive: 70% ID Rate vs 40%, $1k vs $3.5k/mo (2026) | Cursive",
    description: "Warmly vs Cursive compared: Cursive identifies 70% of visitors vs Warmly's 40%, starting at $1,000/mo vs $3,500/mo. See which visitor identification platform wins.",
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
