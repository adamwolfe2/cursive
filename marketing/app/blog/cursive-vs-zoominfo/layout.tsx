import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cursive vs ZoomInfo: Which B2B Data Platform Should You Choose? (2026) | Cursive",
  description: "Cursive vs ZoomInfo: an honest head-to-head comparison. Compare pricing, visitor identification, intent data, AI outreach, and contract terms. Find out which B2B data platform is right for your team in 2026.",
  keywords: "cursive vs zoominfo, zoominfo alternative, zoominfo comparison, zoominfo pricing, zoominfo vs cursive, zoominfo competitors, b2b data platform, visitor identification, intent data, sales intelligence",

  openGraph: {
    title: "Cursive vs ZoomInfo: Which B2B Data Platform Should You Choose? (2026) | Cursive",
    description: "Cursive vs ZoomInfo: an honest head-to-head comparison. Compare pricing, visitor identification, intent data, AI outreach, and contract terms to find the right fit for your team.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-zoominfo",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs ZoomInfo: Which B2B Data Platform Should You Choose? (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs ZoomInfo: Which B2B Data Platform Should You Choose? (2026) | Cursive",
    description: "Cursive vs ZoomInfo: an honest head-to-head comparison. Compare pricing, visitor identification, intent data, AI outreach, and contract terms to find the right fit for your team.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-zoominfo",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
