import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Instantly Alternatives: Cold Email + Visitor ID Combined (2026)",
  description: "Compare the best Instantly alternatives that combine cold email outreach with visitor identification and intent data. Find all-in-one platforms that replace your entire outbound stack.",
  keywords: "instantly alternatives, instantly competitors, cold email software, cold email platform, email outreach tools, instantly vs cursive, cold email visitor identification, b2b email outreach, ai cold email, outbound email platform",

  openGraph: {
    title: "Instantly Alternatives: Cold Email + Visitor ID Combined (2026) | Cursive",
    description: "Compare the best Instantly alternatives that combine cold email outreach with visitor identification and intent data. Find all-in-one platforms that replace your entire outbound stack.",
    type: "article",
    url: "https://www.meetcursive.com/blog/instantly-alternative",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Instantly Alternatives: Cold Email + Visitor ID Combined (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Instantly Alternatives: Cold Email + Visitor ID Combined (2026) | Cursive",
    description: "Compare the best Instantly alternatives that combine cold email outreach with visitor identification and intent data. Find all-in-one platforms that replace your entire outbound stack.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/instantly-alternative",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
