import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Leadfeeder Alternatives: 8 Better Visitor Tracking Tools (2026) | Cursive",
  description: "Compare the top Leadfeeder alternatives with person-level identification, higher match rates, and built-in outreach automation. Find the best visitor tracking tool for your B2B team.",
  keywords: [
    "leadfeeder alternatives",
    "leadfeeder competitors",
    "visitor tracking tools",
    "website visitor identification",
    "b2b visitor tracking",
    "leadfeeder vs competitors",
    "dealfront alternatives",
    "company identification tools",
    "lead generation software",
    "anonymous visitor tracking"
  ],

  openGraph: {
    title: "Leadfeeder Alternatives: 8 Better Visitor Tracking Tools (2026) | Cursive",
    description: "Compare the top Leadfeeder alternatives with person-level identification, higher match rates, and built-in outreach automation. Find the best visitor tracking tool for your B2B team.",
    type: "article",
    url: "https://www.meetcursive.com/blog/leadfeeder-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Leadfeeder Alternatives: 8 Better Visitor Tracking Tools (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Leadfeeder Alternatives: 8 Better Visitor Tracking Tools (2026) | Cursive",
    description: "Compare the top Leadfeeder alternatives with person-level identification, higher match rates, and built-in outreach automation. Find the best visitor tracking tool for your B2B team.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/leadfeeder-alternative",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
