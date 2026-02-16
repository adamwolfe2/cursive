import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cold Email Best Practices for 2026: What Actually Works | Cursive",
  description: "Master cold email in 2026 with proven strategies for deliverability, personalization, and compliance. Get higher open rates and more meetings.",
  keywords: "cold email 2026, email deliverability, cold outreach, B2B email marketing, email best practices, cold email strategy",

  openGraph: {
    title: "Cold Email Best Practices for 2026: What Actually Works | Cursive",
    description: "Master cold email in 2026 with proven strategies for deliverability, personalization, and compliance. Get higher open rates and more meetings.",
    type: "article",
    url: "https://www.meetcursive.com/blog/cold-email-2026",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Cold Email Best Practices for 2026: What Actually Works",
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cold Email Best Practices for 2026: What Actually Works | Cursive",
    description: "Master cold email in 2026 with proven strategies for deliverability, personalization, and compliance. Get higher open rates and more meetings.",
    images: ["https://www.meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://www.meetcursive.com/blog/cold-email-2026",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
