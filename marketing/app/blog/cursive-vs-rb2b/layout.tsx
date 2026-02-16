import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cursive vs RB2B: Which Visitor ID Tool is Better? (2026) | Cursive",
  description: "An in-depth comparison of Cursive and RB2B for B2B visitor identification. Compare match rates, outreach capabilities, pricing, and total cost of ownership to find the right tool for your team.",
  keywords: "cursive vs rb2b, rb2b alternative, rb2b competitor, visitor identification tools, website visitor identification, b2b visitor tracking, person-level identification, rb2b pricing, rb2b review, best visitor id tool 2026",

  openGraph: {
    title: "Cursive vs RB2B: Which Visitor ID Tool is Better? (2026) | Cursive",
    description: "An in-depth comparison of Cursive and RB2B for B2B visitor identification. Compare match rates, outreach capabilities, pricing, and total cost of ownership.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-rb2b",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs RB2B: Which Visitor ID Tool is Better? (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs RB2B: Which Visitor ID Tool is Better? (2026) | Cursive",
    description: "An in-depth comparison of Cursive and RB2B for B2B visitor identification. Compare match rates, outreach capabilities, pricing, and total cost of ownership.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-rb2b",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
