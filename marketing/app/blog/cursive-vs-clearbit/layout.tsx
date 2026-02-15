import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cursive vs Clearbit: The Best Clearbit Replacement (2026) | Cursive",
  description: "Clearbit was acquired by HubSpot and its standalone features are being sunset. Cursive is the modern replacement for teams that relied on Clearbit for visitor identification and enrichment. Full comparison inside.",
  keywords: "cursive vs clearbit, clearbit alternative, clearbit replacement, clearbit hubspot acquisition, clearbit sunset, visitor identification, b2b data enrichment, clearbit pricing, clearbit review 2026, best clearbit alternative",

  openGraph: {
    title: "Cursive vs Clearbit: The Best Clearbit Replacement (2026) | Cursive",
    description: "Clearbit was acquired by HubSpot and its standalone features are being sunset. Cursive is the modern replacement for teams that relied on Clearbit for visitor identification and enrichment.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-clearbit",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs Clearbit: The Best Clearbit Replacement (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs Clearbit: The Best Clearbit Replacement (2026) | Cursive",
    description: "Clearbit was acquired by HubSpot and its standalone features are being sunset. Cursive is the modern replacement for teams that relied on Clearbit for visitor identification and enrichment.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-clearbit",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
