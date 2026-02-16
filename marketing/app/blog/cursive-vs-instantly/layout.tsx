import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cursive vs Instantly: Visitor ID + Email Outreach Combined (2026) | Cursive",
  description: "Compare Cursive and Instantly for B2B outreach automation. Instantly is email-only at $97/mo. Cursive combines visitor identification, AI email, LinkedIn, SMS, and direct mail to replace your entire outreach stack.",
  keywords: "cursive vs instantly, instantly alternative, instantly.ai alternative, email outreach platform, visitor identification, multi-channel outreach, b2b email automation, instantly pricing, cursive pricing, cold email tool comparison",

  openGraph: {
    title: "Cursive vs Instantly: Visitor ID + Email Outreach Combined (2026) | Cursive",
    description: "Compare Cursive and Instantly for B2B outreach automation. Instantly is email-only at $97/mo. Cursive combines visitor identification, AI email, LinkedIn, SMS, and direct mail to replace your entire outreach stack.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cursive-vs-instantly",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cursive vs Instantly: Visitor ID + Email Outreach Combined (2026)",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cursive vs Instantly: Visitor ID + Email Outreach Combined (2026) | Cursive",
    description: "Compare Cursive and Instantly for B2B outreach automation. Instantly is email-only at $97/mo. Cursive combines visitor identification, AI email, LinkedIn, SMS, and direct mail to replace your entire outreach stack.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cursive-vs-instantly",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
