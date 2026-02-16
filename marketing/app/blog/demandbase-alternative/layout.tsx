import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Demandbase Alternatives: Affordable ABM Platforms for 2026",
  description: "Compare affordable Demandbase alternatives for account-based marketing. Find ABM platforms with visitor identification, intent data, and AI outreach starting at a fraction of the cost.",
  keywords: [
    "demandbase alternatives",
    "demandbase competitors",
    "account based marketing tools",
    "abm platforms",
    "affordable abm software",
    "demandbase vs competitors",
    "b2b marketing platforms",
    "intent data tools",
    "abm for smb",
    "enterprise abm alternatives"
  ].join(", "),

  openGraph: {
    title: "Demandbase Alternatives: Affordable ABM Platforms for 2026 | Cursive",
    description: "Compare affordable Demandbase alternatives for account-based marketing. Find ABM platforms with visitor identification, intent data, and AI outreach starting at a fraction of the cost.",
    type: "article",
    url: "https://www.meetcursive.com/blog/demandbase-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Demandbase Alternatives: Affordable ABM Platforms for 2026",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Demandbase Alternatives: Affordable ABM Platforms for 2026 | Cursive",
    description: "Compare affordable Demandbase alternatives for account-based marketing. Find ABM platforms with visitor identification, intent data, and AI outreach starting at a fraction of the cost.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/demandbase-alternative",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
