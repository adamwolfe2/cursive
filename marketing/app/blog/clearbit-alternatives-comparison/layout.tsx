import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Clearbit Alternatives: 10 Tools Compared (2026) | Cursive",
  description: "Compare the top 10 Clearbit alternatives for B2B data enrichment, visitor identification, and lead intelligence. Find the best fit for your sales team with our detailed comparison.",
  keywords: "clearbit alternatives, clearbit competitors, b2b data enrichment, visitor identification tools, lead intelligence software, company data api, intent data platforms, clearbit vs competitors, b2b prospecting tools, contact enrichment software",

  openGraph: {
    title: "Clearbit Alternatives: 10 Tools Compared (2026) | Cursive",
    description: "Compare the top 10 Clearbit alternatives for B2B data enrichment, visitor identification, and lead intelligence. Find the best fit for your sales team with our detailed comparison.",
    type: "article",
    url: "https://www.meetcursive.com/blog/clearbit-alternatives-comparison",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Clearbit Alternatives: 10 Tools Compared (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Clearbit Alternatives: 10 Tools Compared (2026) | Cursive",
    description: "Compare the top 10 Clearbit alternatives for B2B data enrichment, visitor identification, and lead intelligence. Find the best fit for your sales team with our detailed comparison.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/clearbit-alternatives-comparison",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
